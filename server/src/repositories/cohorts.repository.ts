import { query, getClient } from '../config/database';

export interface CohortRow {
  id: string;
  client_id: string;
  characteristic_phrase: string;
  anthropological_description: string;
  demographic_profile_json: Record<string, unknown>;
  behavior_lifestyle: string;
  audience_size: string;
  reach_potential: string;
  triggers: string[];
  alternative_solutions: string[];
  indicators: string[];
  editorial_lines: string[];
  created_at: string;
  updated_at: string;
}

export interface InsertCohortData {
  client_id: string;
  characteristic_phrase: string;
  anthropological_description: string;
  demographic_profile_json: Record<string, unknown>;
  behavior_lifestyle: string;
  audience_size: string;
  reach_potential: string;
  triggers: string[];
  alternative_solutions: string[];
  indicators: string[];
  editorial_lines: string[];
}

export async function findByClientId(clientId: string): Promise<CohortRow[]> {
  const result = await query<CohortRow>(
    'SELECT * FROM cohorts WHERE client_id = $1 ORDER BY created_at ASC',
    [clientId]
  );
  return result.rows;
}

export async function findById(id: string): Promise<CohortRow | null> {
  const result = await query<CohortRow>('SELECT * FROM cohorts WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

/**
 * Atomically delete all existing cohorts for a client and insert new ones.
 * Runs inside a transaction.
 */
export async function upsertAll(
  clientId: string,
  cohorts: Omit<InsertCohortData, 'client_id'>[]
): Promise<CohortRow[]> {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM cohorts WHERE client_id = $1', [clientId]);

    const inserted: CohortRow[] = [];
    for (const cohort of cohorts) {
      const result = await client.query<CohortRow>(
        `INSERT INTO cohorts (
          client_id,
          characteristic_phrase,
          anthropological_description,
          demographic_profile_json,
          behavior_lifestyle,
          audience_size,
          reach_potential,
          triggers,
          alternative_solutions,
          indicators,
          editorial_lines,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *`,
        [
          clientId,
          cohort.characteristic_phrase,
          cohort.anthropological_description,
          JSON.stringify(cohort.demographic_profile_json),
          cohort.behavior_lifestyle,
          cohort.audience_size,
          cohort.reach_potential,
          cohort.triggers,
          cohort.alternative_solutions,
          cohort.indicators,
          cohort.editorial_lines,
        ]
      );
      inserted.push(result.rows[0]);
    }

    await client.query('COMMIT');
    return inserted;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateOne(
  id: string,
  data: Partial<Omit<InsertCohortData, 'client_id'>>
): Promise<CohortRow | null> {
  const fieldMap: Record<string, unknown> = {};

  if (data.characteristic_phrase !== undefined)
    fieldMap['characteristic_phrase'] = data.characteristic_phrase;
  if (data.anthropological_description !== undefined)
    fieldMap['anthropological_description'] = data.anthropological_description;
  if (data.demographic_profile_json !== undefined)
    fieldMap['demographic_profile_json'] = JSON.stringify(data.demographic_profile_json);
  if (data.behavior_lifestyle !== undefined)
    fieldMap['behavior_lifestyle'] = data.behavior_lifestyle;
  if (data.audience_size !== undefined) fieldMap['audience_size'] = data.audience_size;
  if (data.reach_potential !== undefined) fieldMap['reach_potential'] = data.reach_potential;
  if (data.triggers !== undefined) fieldMap['triggers'] = data.triggers;
  if (data.alternative_solutions !== undefined)
    fieldMap['alternative_solutions'] = data.alternative_solutions;
  if (data.indicators !== undefined) fieldMap['indicators'] = data.indicators;
  if (data.editorial_lines !== undefined) fieldMap['editorial_lines'] = data.editorial_lines;

  const entries = Object.entries(fieldMap);
  if (entries.length === 0) return findById(id);

  const setClauses = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const values = [...entries.map(([, v]) => v), id];

  const result = await query<CohortRow>(
    `UPDATE cohorts SET ${setClauses}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

// ── Legacy aliases ────────────────────────────────────────────────────────────

export async function findCohortsByClientId(clientId: string): Promise<CohortRow[]> {
  return findByClientId(clientId);
}

export async function findCohortById(id: string): Promise<CohortRow | null> {
  return findById(id);
}

export async function insertCohort(data: InsertCohortData): Promise<CohortRow> {
  const result = await query<CohortRow>(
    `INSERT INTO cohorts (
      client_id,
      characteristic_phrase,
      anthropological_description,
      demographic_profile_json,
      behavior_lifestyle,
      audience_size,
      reach_potential,
      triggers,
      alternative_solutions,
      indicators,
      editorial_lines,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
    RETURNING *`,
    [
      data.client_id,
      data.characteristic_phrase,
      data.anthropological_description,
      JSON.stringify(data.demographic_profile_json),
      data.behavior_lifestyle,
      data.audience_size,
      data.reach_potential,
      data.triggers,
      data.alternative_solutions,
      data.indicators,
      data.editorial_lines,
    ]
  );
  return result.rows[0];
}

export async function insertManyCohorts(
  clientId: string,
  cohorts: Omit<InsertCohortData, 'client_id'>[]
): Promise<CohortRow[]> {
  return upsertAll(clientId, cohorts);
}

export async function updateCohortById(
  id: string,
  data: Partial<Omit<InsertCohortData, 'client_id'>>
): Promise<CohortRow | null> {
  return updateOne(id, data);
}

export async function deleteCohortById(id: string): Promise<boolean> {
  const result = await query('DELETE FROM cohorts WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
