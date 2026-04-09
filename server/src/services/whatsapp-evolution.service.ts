import { logger } from '../utils/logger';
import * as whatsappRepo from '../repositories/whatsapp.repository';
import { processMessagesForDemands } from './demand-detection.service';

/**
 * WhatsApp Evolution API Integration
 *
 * Evolution API is a self-hosted WhatsApp Web API that allows:
 * - Connecting to WhatsApp via QR code scan
 * - Receiving messages from groups (not just 1:1)
 * - Sending messages to groups
 * - Webhook notifications for new messages
 *
 * Env vars needed:
 * - EVOLUTION_API_URL: URL of the Evolution API instance (e.g. https://evo.yourdomain.com)
 * - EVOLUTION_API_KEY: API key for authentication
 * - EVOLUTION_INSTANCE_NAME: Name of the WhatsApp instance (e.g. "ai-sici")
 */

const getConfig = () => ({
  apiUrl: process.env.EVOLUTION_API_URL ?? '',
  apiKey: process.env.EVOLUTION_API_KEY ?? '',
  instanceName: process.env.EVOLUTION_INSTANCE_NAME ?? 'ai-sici',
});

/**
 * Check if Evolution API is configured.
 */
export function isEvolutionConfigured(): boolean {
  const { apiUrl, apiKey } = getConfig();
  return !!(apiUrl && apiKey);
}

/**
 * Create a WhatsApp instance on Evolution API.
 * Returns QR code for scanning.
 */
export async function createInstance(): Promise<{ qrcode?: string; status: string }> {
  const { apiUrl, apiKey, instanceName } = getConfig();
  if (!apiUrl) throw new Error('EVOLUTION_API_URL not configured');

  const response = await fetch(`${apiUrl}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
    body: JSON.stringify({
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
      webhook: {
        url: `${process.env.API_PUBLIC_URL ?? 'https://api-production-487f.up.railway.app'}/api/webhooks/evolution`,
        events: ['MESSAGES_UPSERT'],
        byEvents: true,
      },
    }),
  });

  const data = await response.json() as Record<string, unknown>;
  logger.info('Evolution instance created:', data);

  return {
    qrcode: (data.qrcode as { base64?: string })?.base64 ?? undefined,
    status: (data.instance as { status?: string })?.status ?? 'unknown',
  };
}

/**
 * Get connection status of the WhatsApp instance.
 */
export async function getConnectionStatus(): Promise<{ connected: boolean; phoneNumber?: string }> {
  const { apiUrl, apiKey, instanceName } = getConfig();
  if (!apiUrl) return { connected: false };

  try {
    const response = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': apiKey },
    });

    const data = await response.json() as { instance?: { state?: string; phoneNumber?: string } };
    const state = data.instance?.state;

    return {
      connected: state === 'open',
      phoneNumber: data.instance?.phoneNumber,
    };
  } catch (err) {
    logger.error('getConnectionStatus error:', err);
    return { connected: false };
  }
}

/**
 * Get QR code for connecting the WhatsApp instance.
 */
export async function getQRCode(): Promise<{ qrcode?: string }> {
  const { apiUrl, apiKey, instanceName } = getConfig();
  if (!apiUrl) throw new Error('EVOLUTION_API_URL not configured');

  const response = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
    headers: { 'apikey': apiKey },
  });

  const data = await response.json() as { base64?: string; code?: string };
  return { qrcode: data.base64 ?? data.code };
}

/**
 * Fetch all groups the connected WhatsApp account is part of.
 */
export async function listGroups(): Promise<Array<{ id: string; name: string; participantsCount: number }>> {
  const { apiUrl, apiKey, instanceName } = getConfig();
  if (!apiUrl) return [];

  try {
    const response = await fetch(`${apiUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
      headers: { 'apikey': apiKey },
    });

    const groups = await response.json() as Array<{ id: string; subject: string; size: number }>;
    return (groups ?? []).map(g => ({
      id: g.id,
      name: g.subject,
      participantsCount: g.size,
    }));
  } catch (err) {
    logger.error('listGroups error:', err);
    return [];
  }
}

/**
 * Process webhook payload from Evolution API.
 * Called by POST /api/webhooks/evolution
 */
export async function processEvolutionWebhook(body: Record<string, unknown>): Promise<void> {
  try {
    const event = body.event as string;
    if (event !== 'messages.upsert') return;

    const data = body.data as {
      key?: { remoteJid?: string; fromMe?: boolean; participant?: string };
      message?: { conversation?: string; extendedTextMessage?: { text?: string } };
      messageTimestamp?: number;
      pushName?: string;
    };

    if (!data?.key?.remoteJid) return;

    // Only process group messages
    const remoteJid = data.key.remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');
    if (!isGroup) return;

    // Extract message text
    const messageText = data.message?.conversation
      ?? data.message?.extendedTextMessage?.text
      ?? '';
    if (!messageText) return;

    // Skip messages from self
    if (data.key.fromMe) return;

    const sender = data.pushName ?? data.key.participant ?? 'unknown';
    const sentAt = data.messageTimestamp
      ? new Date(data.messageTimestamp * 1000)
      : new Date();
    const groupId = remoteJid;

    logger.info(`Evolution webhook: msg from ${sender} in group ${groupId}`);

    // Find client by WhatsApp group ID
    // First try clients table, then handoffs table
    let clientId = await whatsappRepo.findClientIdByWhatsAppGroup(groupId);

    if (!clientId) {
      // Try matching by handoff whatsapp_group_id
      const hResult = await import('../config/database').then(db =>
        db.query<{ id: string }>('SELECT id FROM clients WHERE whatsapp_group_id = $1 LIMIT 1', [groupId])
      );
      clientId = hResult.rows[0]?.id ?? null;
    }

    if (!clientId) {
      logger.warn(`Evolution: no client found for group ${groupId} — storing with null client`);
      // Store message even without client link (can be linked later)
      await whatsappRepo.create({
        client_id: '00000000-0000-0000-0000-000000000000', // placeholder
        message_text: messageText,
        sender,
        sent_at: sentAt,
      });
      return;
    }

    // Save message
    const saved = await whatsappRepo.create({
      client_id: clientId,
      message_text: messageText,
      sender,
      sent_at: sentAt,
    });

    logger.info(`Evolution: saved msg ${saved.id} for client ${clientId}`);

    // Check if we have enough messages to run demand detection (every 5 messages)
    const recentCount = await whatsappRepo.findByClientId(clientId, 5);
    if (recentCount.length >= 5) {
      const recentMessages = recentCount.map(m => ({
        id: m.id,
        sender: m.sender ?? 'unknown',
        text: m.message_text,
        sentAt: m.sent_at,
      }));

      // Run demand detection asynchronously
      processMessagesForDemands(clientId, recentMessages).catch(err =>
        logger.error('Async demand detection failed:', err)
      );
    }
  } catch (err) {
    logger.error('processEvolutionWebhook error:', err);
  }
}

/**
 * Send a message to a WhatsApp group.
 */
export async function sendGroupMessage(groupId: string, text: string): Promise<boolean> {
  const { apiUrl, apiKey, instanceName } = getConfig();
  if (!apiUrl) return false;

  try {
    const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        number: groupId,
        text,
      }),
    });

    return response.ok;
  } catch (err) {
    logger.error('sendGroupMessage error:', err);
    return false;
  }
}
