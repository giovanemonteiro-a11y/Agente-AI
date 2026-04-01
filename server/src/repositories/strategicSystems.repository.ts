import { query } from '../config/database';

export interface StrategicSystemRow {
  id: string;
  client_id: string;
  cohort_id: string | null;
  type: string;
  scope: string | null;
  content_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EmpathyMapContentJson {
  pensa_sente: string;
  ve: string;
  ouve: string;
  fala_faz: string;
  dores: string;
  ganhos: string;
}

export interface UpsertStrategicSystemData {
  client_id: string;
  cohort_id?: string | null;
  type: string;
  scope?: string | null;
  content_json: Record<string, unknown>;
}

/**
 * Find strategic systems by client, type, and optionally cohort_id.
 */
export async function findByClientAndType(
  clientId: string,
  type: string,
  cohortId?: string | null
): Promise<StrategicSystemRow[]> {
  if (cohortId !== undefined) {
    const result = await query<StrategicSystemRow>(
      `SELECT * FROM strategic_systems
       WHERE client_id = $1 AND type = $2 AND cohort_id = $3
       ORDER BY created_at ASC`,
      [clientId, type, cohortId]
    );
    return result.rows;
  }

  const result = await query<StrategicSystemRow>(
    `SELECT * FROM strategic_systems
     WHERE client_id = $1 AND type = $2
     ORDER BY created_at ASC`,
    [clientId, type]
  );
  return result.rows;
}

/**
 * Find a single empathy map by client and cohort.
 */
export async function findEmpathyMapByCohort(
  clientId: string,
  cohortId: string
): Promise<StrategicSystemRow | null> {
  const result = await query<StrategicSystemRow>(
    `SELECT * FROM strategic_systems
     WHERE client_id = $1 AND type = 'empathy_map' AND cohort_id = $2
     LIMIT 1`,
    [clientId, cohortId]
  );
  return result.rows[0] ?? null;
}

/**
 * Upsert a strategic system record.
 * For empathy maps: conflicts on (client_id, type, cohort_id).
 * For brand-level (cohort_id IS NULL): conflicts on (client_id, type) where cohort_id IS NULL.
 */
export async function upsert(data: UpsertStrategicSystemData): Promise<StrategicSystemRow> {
  const cohortId = data.cohort_id ?? null;

  if (cohortId !== null) {
    // Per-cohort record: upsert on (client_id, type, cohort_id)
    const result = await query<StrategicSystemRow>(
      `INSERT INTO strategic_systems (client_id, cohort_id, type, scope, content_json, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (client_id, type, cohort_id)
       DO UPDATE SET
         scope        = EXCLUDED.scope,
         content_json = EXCLUDED.content_json,
         updated_at   = NOW()
       RETURNING *`,
      [data.client_id, cohortId, data.type, data.scope ?? null, JSON.stringify(data.content_json)]
    );
    return result.rows[0];
  }

  // Brand-level record (cohort_id IS NULL)
  // Use a different approach: check and update or insert
  const existing = await query<StrategicSystemRow>(
    `SELECT * FROM strategic_systems
     WHERE client_id = $1 AND type = $2 AND cohort_id IS NULL
     LIMIT 1`,
    [data.client_id, data.type]
  );

  if (existing.rows.length > 0) {
    const result = await query<StrategicSystemRow>(
      `UPDATE strategic_systems
       SET scope = $1, content_json = $2, updated_at = NOW()
       WHERE client_id = $3 AND type = $4 AND cohort_id IS NULL
       RETURNING *`,
      [data.scope ?? null, JSON.stringify(data.content_json), data.client_id, data.type]
    );
    return result.rows[0];
  }

  const result = await query<StrategicSystemRow>(
    `INSERT INTO strategic_systems (client_id, cohort_id, type, scope, content_json, created_at, updated_at)
     VALUES ($1, NULL, $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [data.client_id, data.type, data.scope ?? null, JSON.stringify(data.content_json)]
  );
  return result.rows[0];
}

/**
 * Delete all strategic systems of a given type for a client (used when regenerating cohorts).
 */
export async function deleteByClientAndType(clientId: string, type: string): Promise<void> {
  await query('DELETE FROM strategic_systems WHERE client_id = $1 AND type = $2', [
    clientId,
    type,
  ]);
}

/**
 * Find all brand-level (cohort_id IS NULL) strategic systems for a client.
 */
export async function findAllByClient(clientId: string): Promise<StrategicSystemRow[]> {
  const result = await query<StrategicSystemRow>(
    `SELECT * FROM strategic_systems
     WHERE client_id = $1 AND cohort_id IS NULL
     ORDER BY type ASC`,
    [clientId]
  );
  return result.rows;
}
