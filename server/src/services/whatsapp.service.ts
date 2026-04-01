import { getOpenAIClient, OPENAI_MODELS } from '../config/openai';
import { logger } from '../utils/logger';
import * as whatsappRepo from '../repositories/whatsapp.repository';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ExtractedDemand {
  description: string;
  urgency: 'high' | 'medium' | 'low';
  type: string;
}

export interface IncomingWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: string;
          text?: { body: string };
        }>;
      };
      field: string;
    }>;
  }>;
}

// ── verifyWebhook ─────────────────────────────────────────────────────────────

export function verifyWebhook(
  mode: string | undefined,
  token: string | undefined,
  challenge: string | undefined
): { valid: boolean; challenge?: string } {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    return { valid: true, challenge };
  }

  return { valid: false };
}

// ── processIncomingMessage ────────────────────────────────────────────────────

export async function processIncomingMessage(body: IncomingWebhookPayload): Promise<void> {
  try {
    if (body.object !== 'whatsapp_business_account') {
      return;
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue;

        const messages = change.value.messages ?? [];

        for (const msg of messages) {
          if (msg.type !== 'text' || !msg.text?.body) continue;

          const messageText = msg.text.body;
          const sender = msg.from;
          const sentAt = new Date(parseInt(msg.timestamp, 10) * 1000);

          // The entry.id is the WhatsApp Business Account ID / phone number ID
          // We use the sender's number or the entry.id to find the client
          const groupId = entry.id;
          const clientId = await whatsappRepo.findClientIdByWhatsAppGroup(groupId);

          if (!clientId) {
            logger.warn(`processIncomingMessage: no client found for group ${groupId}`);
            continue;
          }

          await whatsappRepo.create({
            client_id: clientId,
            message_text: messageText,
            sender,
            sent_at: sentAt,
          });

          logger.info(`processIncomingMessage: saved message from ${sender} for client ${clientId}`);
        }
      }
    }
  } catch (error) {
    logger.error('processIncomingMessage error:', error);
  }
}

// ── extractDemands ────────────────────────────────────────────────────────────

export async function extractDemands(clientId: string): Promise<ExtractedDemand[]> {
  const messages = await whatsappRepo.findByClientId(clientId, 50);

  if (messages.length === 0) {
    return [];
  }

  const messagesText = messages
    .map((m) => `[${new Date(m.sent_at).toLocaleString('pt-BR')}] ${m.sender ?? 'unknown'}: ${m.message_text}`)
    .join('\n');

  const systemPrompt = `Você é um assistente especializado em extrair demandas de clientes a partir de mensagens de WhatsApp.
Analise as mensagens e extraia demandas, pedidos, reclamações e solicitações.

Retorne APENAS um JSON válido no formato:
{
  "demands": [
    {
      "description": "Descrição clara da demanda",
      "urgency": "high|medium|low",
      "type": "tipo da demanda (ex: criativo, revisão, campanha, reunião, etc)"
    }
  ]
}

Regras:
- urgency "high": prazo imediato, reclamação urgente ou bloqueador
- urgency "medium": solicitação normal com prazo definido
- urgency "low": sugestão, dúvida ou item sem prazo
- Agrupe mensagens relacionadas em uma única demanda
- Ignore mensagens de saudação e conversas sem demandas concretas`;

  const userPrompt = `Mensagens do WhatsApp do cliente (últimas 50):\n\n${messagesText}`;

  let demands: ExtractedDemand[] = [];

  if (!getOpenAIClient()) {
    logger.warn('extractDemands: OpenAI not configured — returning empty demands');
    return [];
  }

  try {
    const response = await getOpenAIClient()!.chat.completions.create({
      model: OPENAI_MODELS.GPT4O,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenAI');

    const parsed = JSON.parse(content) as { demands?: ExtractedDemand[] };
    demands = parsed.demands ?? [];

    // Update extracted_demands_json on the most recent messages that don't have it yet
    const unprocessed = messages.filter((m) => !m.extracted_demands_json);
    if (unprocessed.length > 0 && demands.length > 0) {
      await whatsappRepo.updateExtractedDemands(messages[0].id, demands);
    }

    logger.info(`extractDemands: extracted ${demands.length} demands for client ${clientId}`);
  } catch (error) {
    logger.error('extractDemands error:', error);
  }

  return demands;
}
