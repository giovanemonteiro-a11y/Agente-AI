import { query } from '../config/database';
import { BriefingType } from '../types/index';

export interface BriefingRow {
  id: string;
  client_id: string;
  type: BriefingType;
  content_json: Record<string, unknown>;
  source_sprints: string | null;
  source_whatsapp: string | null;
  assigned_to_user_id: string | null;
  sent_at: string | null;
  monday_task_id: string | null;
  created_at: string;
}

export interface CreateBriefingData {
  client_id: string;
  type: BriefingType;
  content_json: Record<string, unknown>;
  source_sprints?: string | null;
  source_whatsapp?: string | null;
  assigned_to_user_id?: string | null;
}

/**
 * List briefings for a client, optionally filtered by type.
 */
export async function findByClientId(
  clientId: string,
  type?: BriefingType
): Promise<BriefingRow[]> {
  if (type) {
    const result = await query<BriefingRow>(
      'SELECT * FROM briefings WHERE client_id = $1 AND type = $2 ORDER BY created_at DESC',
      [clientId, type]
    );
    return result.rows;
  }

  const result = await query<BriefingRow>(
    'SELECT * FROM briefings WHERE client_id = $1 ORDER BY created_at DESC',
    [clientId]
  );
  return result.rows;
}

/**
 * Find a single briefing by id.
 */
export async function findById(id: string): Promise<BriefingRow | null> {
  const result = await query<BriefingRow>('SELECT * FROM briefings WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

/**
 * Insert a new briefing and return the created row.
 */
export async function create(data: CreateBriefingData): Promise<BriefingRow> {
  const result = await query<BriefingRow>(
    `INSERT INTO briefings
       (client_id, type, content_json, source_sprints, source_whatsapp, assigned_to_user_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING *`,
    [
      data.client_id,
      data.type,
      JSON.stringify(data.content_json),
      data.source_sprints ?? null,
      data.source_whatsapp ?? null,
      data.assigned_to_user_id ?? null,
    ]
  );
  return result.rows[0];
}

/**
 * Mark a briefing as sent by setting sent_at = NOW().
 */
export async function updateSentAt(id: string): Promise<BriefingRow | null> {
  const result = await query<BriefingRow>(
    'UPDATE briefings SET sent_at = NOW() WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] ?? null;
}

/**
 * Store the Monday.com task id linked to this briefing.
 */
export async function updateMondayTaskId(
  id: string,
  taskId: string
): Promise<BriefingRow | null> {
  const result = await query<BriefingRow>(
    'UPDATE briefings SET monday_task_id = $1 WHERE id = $2 RETURNING *',
    [taskId, id]
  );
  return result.rows[0] ?? null;
}

// ── Legacy shim — keep old callers compiling ──────────────────────────────────

export async function findBriefingsByClientId(clientId: string): Promise<BriefingRow[]> {
  return findByClientId(clientId);
}

export async function findBriefingById(id: string): Promise<BriefingRow | null> {
  return findById(id);
}

export async function insertBriefing(data: Record<string, unknown>): Promise<BriefingRow> {
  return create(data as unknown as CreateBriefingData);
}

export async function updateBriefingById(
  id: string,
  data: Record<string, unknown>
): Promise<BriefingRow | null> {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return findById(id);
  const updates = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const values = [...entries.map(([, v]) => v), id];
  const result = await query<BriefingRow>(
    `UPDATE briefings SET ${updates} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export async function markBriefingSent(id: string): Promise<void> {
  await updateSentAt(id);
}
