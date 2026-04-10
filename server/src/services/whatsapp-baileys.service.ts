import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  BaileysEventMap,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import * as whatsappRepo from '../repositories/whatsapp.repository';
import { processMessagesForDemands } from './demand-detection.service';

let sock: WASocket | null = null;
let qrCode: string | null = null;
let connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
let connectedNumber: string | null = null;

const AUTH_DIR = path.join(process.cwd(), '.baileys-auth');

/**
 * Get current connection status
 */
export function getStatus() {
  return { status: connectionStatus, qrCode, phoneNumber: connectedNumber };
}

/**
 * Start WhatsApp connection via Baileys.
 * Generates QR code for scanning.
 */
export async function startConnection(): Promise<{ qrCode?: string; status: string }> {
  if (sock && connectionStatus === 'connected') {
    return { status: 'already_connected' };
  }

  connectionStatus = 'connecting';
  qrCode = null;

  // Ensure auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ['AI SICI', 'Chrome', '1.0.0'],
  });

  // Handle connection updates
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      connectionStatus = 'connecting';
      logger.info('Baileys: QR code generated — scan with WhatsApp');
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.info(`Baileys: connection closed (code: ${statusCode}), reconnect: ${shouldReconnect}`);

      connectionStatus = 'disconnected';
      qrCode = null;
      connectedNumber = null;

      if (shouldReconnect) {
        // Auto-reconnect after 5 seconds
        setTimeout(() => startConnection(), 5000);
      } else {
        // Logged out — clear auth
        if (fs.existsSync(AUTH_DIR)) {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        }
      }
    }

    if (connection === 'open') {
      connectionStatus = 'connected';
      qrCode = null;
      connectedNumber = sock?.user?.id?.split(':')[0] ?? null;
      logger.info(`Baileys: connected as ${connectedNumber}`);
    }
  });

  // Save credentials on update
  sock.ev.on('creds.update', saveCreds);

  // Handle incoming messages
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      try {
        // Skip messages from self
        if (msg.key.fromMe) continue;

        // Only process group messages
        const remoteJid = msg.key.remoteJid ?? '';
        const isGroup = remoteJid.endsWith('@g.us');
        if (!isGroup) continue;

        // Extract text
        const text = msg.message?.conversation
          ?? msg.message?.extendedTextMessage?.text
          ?? '';
        if (!text) continue;

        const sender = msg.pushName ?? msg.key.participant ?? 'unknown';
        const timestamp = msg.messageTimestamp
          ? new Date(Number(msg.messageTimestamp) * 1000)
          : new Date();

        logger.info(`Baileys msg: [${remoteJid}] ${sender}: ${text.substring(0, 80)}...`);

        // Find client by group ID
        const clientId = await whatsappRepo.findClientIdByWhatsAppGroup(remoteJid);

        if (!clientId) {
          logger.debug(`Baileys: no client linked to group ${remoteJid}`);
          continue;
        }

        // Save message
        const saved = await whatsappRepo.create({
          client_id: clientId,
          message_text: text,
          sender,
          sent_at: timestamp,
        });

        logger.info(`Baileys: saved msg ${saved.id} for client ${clientId}`);

        // Run demand detection every 5 messages
        const recent = await whatsappRepo.findByClientId(clientId, 5);
        if (recent.length >= 5) {
          processMessagesForDemands(
            clientId,
            recent.map(r => ({ id: r.id, sender: r.sender ?? 'unknown', text: r.message_text, sentAt: r.sent_at }))
          ).catch(err => logger.error('Demand detection failed:', err));
        }
      } catch (err) {
        logger.error('Baileys message processing error:', err);
      }
    }
  });

  // Wait for QR code to be generated (max 15s)
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 15000);
    const check = setInterval(() => {
      if (qrCode || connectionStatus === 'connected') {
        clearInterval(check);
        clearTimeout(timeout);
        resolve();
      }
    }, 500);
  });

  return { qrCode: qrCode ?? undefined, status: connectionStatus };
}

/**
 * Disconnect WhatsApp
 */
export async function disconnect(): Promise<void> {
  if (sock) {
    await sock.logout();
    sock = null;
    connectionStatus = 'disconnected';
    qrCode = null;
    connectedNumber = null;
    // Clear auth
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  }
}

/**
 * List all groups the connected account is in.
 */
export async function listGroups(): Promise<Array<{ id: string; name: string; participants: number }>> {
  if (!sock || connectionStatus !== 'connected') return [];

  try {
    const groups = await sock.groupFetchAllParticipating();
    return Object.values(groups).map(g => ({
      id: g.id,
      name: g.subject,
      participants: g.participants.length,
    }));
  } catch (err) {
    logger.error('Baileys listGroups error:', err);
    return [];
  }
}

/**
 * Send a text message to a group or contact.
 */
export async function sendMessage(jid: string, text: string): Promise<boolean> {
  if (!sock || connectionStatus !== 'connected') return false;

  try {
    await sock.sendMessage(jid, { text });
    return true;
  } catch (err) {
    logger.error('Baileys sendMessage error:', err);
    return false;
  }
}
