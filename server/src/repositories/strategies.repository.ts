import { query } from '../config/database';

export interface StrategyRow {
  id: string;
  client_id: string;
  version: number;
  objectives: string;
  positioning: string;
  differentials: string;
  tone: string;
  products: string;
  expected_results: string;
  created_by: string;
  created_at: string;
}

export interface CreateStrategyData {
  client_id: string;
  version: number;
  objectives: string;
  positioning: string;
  differentials: string;
  tone: string;
  products: string;
  expected_results: string;
  created_by: string;
}

// ── Phase 3 named methods ────────────────────────────────────────────────────

export async function findByClientId(clientId: string): Promise<StrategyRow[]> {
  const result = await query<StrategyRow>(
    'SELECT * FROM strategies WHERE client_id = $1 ORDER BY version DESC',
    [clientId]
  );
  return result.rows;
}

export async function findLatestByClientId(clientId: string): Promise<StrategyRow | null> {
  const result = await query<StrategyRow>(
    'SELECT * FROM strategies WHERE client_id = $1 ORDER BY version DESC LIMIT 1',
    [clientId]
  );
  return result.rows[0] ?? null;
}

export async function findById(id: string): Promise<StrategyRow | null> {
  const result = await query<StrategyRow>('SELECT * FROM strategies WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function create(data: CreateStrategyData): Promise<StrategyRow> {
  const fields = Object.keys(data) as (keyof CreateStrategyData)[];
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const result = await query<StrategyRow>(
    `INSERT INTO strategies (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    fields.map((f) => data[f])
  );
  return result.rows[0];
}

export async function getNextVersion(clientId: string): Promise<number> {
  const result = await query<{ max: number | null }>(
    'SELECT MAX(version) as max FROM strategies WHERE client_id = $1',
    [clientId]
  );
  return (result.rows[0].max ?? 0) + 1;
}

// ── Legacy aliases (used by existing code elsewhere) ─────────────────────────

export async function findStrategiesByClientId(clientId: string): Promise<unknown[]> {
  return findByClientId(clientId);
}

export async function findStrategyById(id: string): Promise<unknown> {
  return findById(id);
}

export async function findLatestStrategyByClientId(clientId: string): Promise<unknown> {
  return findLatestByClientId(clientId);
}

export async function insertStrategy(data: Record<string, unknown>): Promise<unknown> {
  const fields = Object.keys(data);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const result = await query(
    `INSERT INTO strategies (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    Object.values(data)
  );
  return result.rows[0];
}

export async function updateStrategyById(
  id: string,
  data: Record<string, unknown>
): Promise<unknown> {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  const updates = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const values = [...entries.map(([, v]) => v), id];
  const result = await query(
    `UPDATE strategies SET ${updates} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export async function getNextVersionNumber(clientId: string): Promise<number> {
  return getNextVersion(clientId);
}
