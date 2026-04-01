import { query } from '../config/database';

// pg returns custom enum arrays as strings like '{}' or '{social_media,trafego}'
// This normalizes them to proper JS arrays
function normalizeClient(row: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!row) return null;
  const arrayFields = ['services_scope', 'designer_scope', 'gt_scope'];
  for (const field of arrayFields) {
    const val = row[field];
    if (typeof val === 'string') {
      // Parse PostgreSQL array literal: '{}' -> [], '{a,b}' -> ['a','b']
      if (val === '{}') {
        row[field] = [];
      } else {
        row[field] = val.replace(/^\{/, '').replace(/\}$/, '').split(',').filter(Boolean);
      }
    } else if (!Array.isArray(val)) {
      row[field] = [];
    }
  }
  return row;
}

export async function findAllClients(limit: number = 50, offset: number = 0): Promise<unknown[]> {
  const result = await query(
    'SELECT * FROM clients ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return result.rows.map((r) => normalizeClient(r as Record<string, unknown>));
}

export async function findClientById(id: string): Promise<unknown> {
  const result = await query('SELECT * FROM clients WHERE id = $1', [id]);
  return normalizeClient((result.rows[0] as Record<string, unknown>) ?? null);
}

export async function insertClient(data: Record<string, unknown>): Promise<unknown> {
  const fields = Object.keys(data);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const values = Object.values(data);
  const result = await query(
    `INSERT INTO clients (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function updateClientById(
  id: string,
  data: Record<string, unknown>
): Promise<unknown> {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  const updates = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const values = entries.map(([, v]) => v);
  values.push(id);
  const result = await query(
    `UPDATE clients SET ${updates} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export async function deleteClientById(id: string): Promise<boolean> {
  const result = await query('DELETE FROM clients WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function countClients(): Promise<number> {
  const result = await query<{ count: string }>('SELECT COUNT(*) as count FROM clients');
  return parseInt(result.rows[0].count, 10);
}
