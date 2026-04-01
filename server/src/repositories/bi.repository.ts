import { query } from '../config/database';

export interface BIRecord {
  id: string;
  client_id: string | null;
  type: 'individual' | 'global';
  data_json: Record<string, unknown>;
  generated_at: string;
  updated_at: string;
}

export interface UpsertBIData {
  client_id?: string | null;
  type: 'individual' | 'global';
  data_json: Record<string, unknown>;
}

export async function findByClientId(
  clientId: string,
  type?: 'individual' | 'global'
): Promise<BIRecord[]> {
  if (type) {
    const result = await query<BIRecord>(
      `SELECT * FROM bi_data WHERE client_id = $1 AND type = $2 ORDER BY updated_at DESC`,
      [clientId, type]
    );
    return result.rows;
  }
  const result = await query<BIRecord>(
    `SELECT * FROM bi_data WHERE client_id = $1 ORDER BY updated_at DESC`,
    [clientId]
  );
  return result.rows;
}

export async function findGlobal(): Promise<BIRecord | null> {
  const result = await query<BIRecord>(
    `SELECT * FROM bi_data WHERE type = 'global' AND client_id IS NULL ORDER BY updated_at DESC LIMIT 1`
  );
  return result.rows[0] ?? null;
}

export async function findAllForGlobal(): Promise<BIRecord[]> {
  const result = await query<BIRecord>(
    `SELECT * FROM bi_data WHERE type = 'individual' ORDER BY updated_at DESC`
  );
  return result.rows;
}

export async function upsert(data: UpsertBIData): Promise<BIRecord> {
  if (data.type === 'global') {
    // Global BI has no client_id
    const result = await query<BIRecord>(
      `INSERT INTO bi_data (client_id, type, data_json, generated_at, updated_at)
       VALUES (NULL, 'global', $1, NOW(), NOW())
       ON CONFLICT (client_id, type) DO UPDATE
         SET data_json = EXCLUDED.data_json,
             updated_at = NOW()
       RETURNING *`,
      [JSON.stringify(data.data_json)]
    );
    // If no conflict clause exists on the table (no unique constraint), fallback to delete+insert
    if (!result.rows[0]) {
      await query(`DELETE FROM bi_data WHERE type = 'global' AND client_id IS NULL`);
      const ins = await query<BIRecord>(
        `INSERT INTO bi_data (client_id, type, data_json, generated_at, updated_at)
         VALUES (NULL, 'global', $1, NOW(), NOW()) RETURNING *`,
        [JSON.stringify(data.data_json)]
      );
      return ins.rows[0];
    }
    return result.rows[0];
  }

  // Individual BI — upsert by client_id + type
  const result = await query<BIRecord>(
    `INSERT INTO bi_data (client_id, type, data_json, generated_at, updated_at)
     VALUES ($1, 'individual', $2, NOW(), NOW())
     ON CONFLICT (client_id, type) DO UPDATE
       SET data_json = EXCLUDED.data_json,
           updated_at = NOW()
     RETURNING *`,
    [data.client_id, JSON.stringify(data.data_json)]
  );

  if (result.rows[0]) return result.rows[0];

  // Fallback: delete + insert
  await query(`DELETE FROM bi_data WHERE client_id = $1 AND type = 'individual'`, [data.client_id]);
  const ins = await query<BIRecord>(
    `INSERT INTO bi_data (client_id, type, data_json, generated_at, updated_at)
     VALUES ($1, 'individual', $2, NOW(), NOW()) RETURNING *`,
    [data.client_id, JSON.stringify(data.data_json)]
  );
  return ins.rows[0];
}
