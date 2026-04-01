import { query } from '../config/database';

export interface SummaryRow {
  id: string;
  client_id: string;
  strategy_id: string | null;
  summary_json: Record<string, unknown>;
  brand_profile_json: Record<string, unknown>;
  approved_by: string | null;
  approved_at: string | null;
  generated_at: string;
  updated_at: string;
  auto_refreshed: boolean;
  previous_summary_json: Record<string, unknown> | null;
  previous_brand_profile_json: Record<string, unknown> | null;
  auto_refreshed_at: string | null;
}

export async function findByClientId(clientId: string): Promise<SummaryRow | null> {
  const result = await query<SummaryRow>(
    'SELECT * FROM summaries WHERE client_id = $1 LIMIT 1',
    [clientId]
  );
  return result.rows[0] ?? null;
}

export async function findSummaryByClientId(clientId: string): Promise<SummaryRow | null> {
  return findByClientId(clientId);
}

export async function findSummaryById(id: string): Promise<SummaryRow | null> {
  const result = await query<SummaryRow>('SELECT * FROM summaries WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function upsert(data: {
  clientId: string;
  summaryJson: Record<string, unknown>;
  brandProfileJson: Record<string, unknown>;
  strategyId?: string;
  autoRefreshed?: boolean;
}): Promise<SummaryRow> {
  const { clientId, summaryJson, brandProfileJson, strategyId, autoRefreshed } = data;

  const result = await query<SummaryRow>(
    `INSERT INTO summaries (
        client_id,
        strategy_id,
        summary_json,
        brand_profile_json,
        generated_at,
        updated_at,
        auto_refreshed
      )
      VALUES ($1, $2, $3, $4, NOW(), NOW(), $5)
      ON CONFLICT (client_id) DO UPDATE
      SET
        strategy_id              = COALESCE($2, summaries.strategy_id),
        previous_summary_json    = summaries.summary_json,
        previous_brand_profile_json = summaries.brand_profile_json,
        auto_refreshed_at        = CASE WHEN $5 THEN NOW() ELSE summaries.auto_refreshed_at END,
        summary_json             = $3,
        brand_profile_json       = $4,
        generated_at             = NOW(),
        updated_at               = NOW(),
        auto_refreshed           = $5
      RETURNING *`,
    [
      clientId,
      strategyId ?? null,
      JSON.stringify(summaryJson),
      JSON.stringify(brandProfileJson),
      autoRefreshed ?? false,
    ]
  );
  return result.rows[0];
}

export async function upsertSummary(
  clientId: string,
  summaryJson: Record<string, unknown>,
  brandProfileJson: Record<string, unknown>,
  strategyId?: string
): Promise<SummaryRow> {
  return upsert({ clientId, summaryJson, brandProfileJson, strategyId });
}

export async function approve(clientId: string, userId: string): Promise<SummaryRow | null> {
  const result = await query<SummaryRow>(
    `UPDATE summaries
     SET approved_by = $1, approved_at = NOW()
     WHERE client_id = $2
     RETURNING *`,
    [userId, clientId]
  );
  return result.rows[0] ?? null;
}

export async function approveSummaryById(id: string, approvedBy: string): Promise<void> {
  await query(
    'UPDATE summaries SET approved_by = $1, approved_at = NOW() WHERE id = $2',
    [approvedBy, id]
  );
}

export async function resetApproval(clientId: string): Promise<void> {
  await query(
    `UPDATE summaries
     SET approved_by = NULL, approved_at = NULL
     WHERE client_id = $1`,
    [clientId]
  );
}

export async function patchSummaryFields(
  clientId: string,
  fields: {
    summaryJson?: Record<string, unknown>;
    brandProfileJson?: Record<string, unknown>;
  }
): Promise<SummaryRow | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (fields.summaryJson !== undefined) {
    updates.push(`summary_json = $${idx++}`);
    values.push(JSON.stringify(fields.summaryJson));
  }
  if (fields.brandProfileJson !== undefined) {
    updates.push(`brand_profile_json = $${idx++}`);
    values.push(JSON.stringify(fields.brandProfileJson));
  }

  if (updates.length === 0) return null;

  updates.push(`updated_at = NOW()`);
  values.push(clientId);

  const result = await query<SummaryRow>(
    `UPDATE summaries SET ${updates.join(', ')} WHERE client_id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}
