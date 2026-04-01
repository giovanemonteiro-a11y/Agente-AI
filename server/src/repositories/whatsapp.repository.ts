import { query } from '../config/database';

export interface WhatsAppMessage {
  id: string;
  client_id: string;
  message_text: string;
  sender: string | null;
  sent_at: string;
  extracted_demands_json: unknown | null;
  created_at: string;
}

export interface CreateWhatsAppMessageData {
  client_id: string;
  message_text: string;
  sender?: string | null;
  sent_at: Date | string;
}

export async function findByClientId(
  clientId: string,
  limit: number = 50
): Promise<WhatsAppMessage[]> {
  const result = await query<WhatsAppMessage>(
    `SELECT * FROM whatsapp_messages
     WHERE client_id = $1
     ORDER BY sent_at DESC
     LIMIT $2`,
    [clientId, limit]
  );
  return result.rows;
}

export async function create(data: CreateWhatsAppMessageData): Promise<WhatsAppMessage> {
  const result = await query<WhatsAppMessage>(
    `INSERT INTO whatsapp_messages (client_id, message_text, sender, sent_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.client_id, data.message_text, data.sender ?? null, data.sent_at]
  );
  return result.rows[0];
}

export async function updateExtractedDemands(
  id: string,
  demands: unknown
): Promise<WhatsAppMessage | null> {
  const result = await query<WhatsAppMessage>(
    `UPDATE whatsapp_messages
     SET extracted_demands_json = $1
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(demands), id]
  );
  return result.rows[0] ?? null;
}

export async function findClientIdByWhatsAppGroup(
  groupId: string
): Promise<string | null> {
  // clients table may store whatsapp_group_id
  const result = await query<{ id: string }>(
    `SELECT id FROM clients WHERE whatsapp_group_id = $1 LIMIT 1`,
    [groupId]
  );
  return result.rows[0]?.id ?? null;
}
