import { query } from '../config/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommercialGoalRow {
  id: string;
  title: string;
  period_type: 'monthly' | 'quarterly';
  period_start: Date;
  period_end: Date;
  total_goal: string;
  expansion_goal: string;
  drx_goal: string;
  activation_goal: string;
  referral_goal: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CommissionRuleRow {
  id: string;
  monetization_type: 'expansao' | 'drx' | 'ativacao' | 'indicacao';
  rule_type: 'percentage' | 'fixed_value' | 'progressive';
  fixed_pct: string | null;
  fixed_value: string | null;
  coordinator_pct: string;
  is_active: boolean;
  tiers?: CommissionTierRow[];
}

export interface CommissionTierRow {
  id: string;
  rule_id: string;
  tier_name: string;
  min_pct: string;
  max_pct: string | null;
  commission_pct: string;
  sort_order: number;
}

export interface MonetizationRow {
  id: string;
  client_name: string;
  client_id: string | null;
  account_user_id: string;
  account_name?: string;
  monetization_type: 'expansao' | 'drx' | 'ativacao' | 'indicacao';
  product_service: string;
  value: string;
  temperature: 'quente' | 'morno' | 'frio';
  status: 'proposta' | 'fechada' | 'perdida';
  reference_month: Date;
  notes: string | null;
  closed_at: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CommissionRow {
  id: string;
  monetization_id: string;
  account_user_id: string;
  account_name?: string;
  reference_month: Date;
  deal_value: string;
  commission_pct: string | null;
  commission_value: string;
  coordinator_pct: string;
  coordinator_value: string;
  tier_name: string | null;
  status: 'pending' | 'approved' | 'paid';
  created_at: Date;
  updated_at: Date;
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function findAllGoals(): Promise<CommercialGoalRow[]> {
  const result = await query<CommercialGoalRow>(
    'SELECT * FROM commercial_goals ORDER BY period_start DESC'
  );
  return result.rows;
}

export async function findGoalById(id: string): Promise<CommercialGoalRow | null> {
  const result = await query<CommercialGoalRow>(
    'SELECT * FROM commercial_goals WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
}

export async function insertGoal(data: {
  title: string;
  period_type: string;
  period_start: string;
  period_end: string;
  total_goal: number;
  expansion_goal: number;
  drx_goal: number;
  activation_goal: number;
  referral_goal: number;
  created_by: string;
}): Promise<CommercialGoalRow> {
  const result = await query<CommercialGoalRow>(
    `INSERT INTO commercial_goals
      (title, period_type, period_start, period_end, total_goal, expansion_goal, drx_goal, activation_goal, referral_goal, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [data.title, data.period_type, data.period_start, data.period_end,
     data.total_goal, data.expansion_goal, data.drx_goal, data.activation_goal,
     data.referral_goal, data.created_by]
  );
  return result.rows[0];
}

export async function updateGoal(id: string, fields: Record<string, unknown>): Promise<CommercialGoalRow | null> {
  const keys = Object.keys(fields);
  if (keys.length === 0) return null;
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [id, ...Object.values(fields)];
  const result = await query<CommercialGoalRow>(
    `UPDATE commercial_goals SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export async function deleteGoal(id: string): Promise<boolean> {
  const result = await query('DELETE FROM commercial_goals WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// ─── Commission Rules ──────────────────────────────────────────────────────────

export async function findAllCommissionRules(): Promise<CommissionRuleRow[]> {
  const rulesResult = await query<CommissionRuleRow>(
    'SELECT * FROM commercial_commission_rules WHERE is_active = TRUE ORDER BY monetization_type'
  );
  const tiersResult = await query<CommissionTierRow>(
    'SELECT * FROM commercial_commission_tiers ORDER BY rule_id, sort_order'
  );
  return rulesResult.rows.map((rule) => ({
    ...rule,
    tiers: tiersResult.rows.filter((t) => t.rule_id === rule.id),
  }));
}

export async function findCommissionRuleByType(type: string): Promise<CommissionRuleRow | null> {
  const result = await query<CommissionRuleRow>(
    'SELECT * FROM commercial_commission_rules WHERE monetization_type = $1 AND is_active = TRUE LIMIT 1',
    [type]
  );
  if (!result.rows[0]) return null;
  const tiersResult = await query<CommissionTierRow>(
    'SELECT * FROM commercial_commission_tiers WHERE rule_id = $1 ORDER BY sort_order',
    [result.rows[0].id]
  );
  return { ...result.rows[0], tiers: tiersResult.rows };
}

export async function updateCommissionRule(id: string, fields: Record<string, unknown>): Promise<CommissionRuleRow | null> {
  const keys = Object.keys(fields);
  if (keys.length === 0) return null;
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [id, ...Object.values(fields)];
  const result = await query<CommissionRuleRow>(
    `UPDATE commercial_commission_rules SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

// ─── Monetizations ────────────────────────────────────────────────────────────

export async function findMonetizations(filters: {
  reference_month?: string;
  monetization_type?: string;
  account_user_id?: string;
  status?: string;
}): Promise<MonetizationRow[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (filters.reference_month) {
    conditions.push(`m.reference_month = $${idx++}`);
    values.push(filters.reference_month);
  }
  if (filters.monetization_type) {
    conditions.push(`m.monetization_type = $${idx++}`);
    values.push(filters.monetization_type);
  }
  if (filters.account_user_id) {
    conditions.push(`m.account_user_id = $${idx++}`);
    values.push(filters.account_user_id);
  }
  if (filters.status) {
    conditions.push(`m.status = $${idx++}`);
    values.push(filters.status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query<MonetizationRow>(
    `SELECT m.*, u.name AS account_name
     FROM commercial_monetizations m
     LEFT JOIN users u ON u.id = m.account_user_id
     ${where}
     ORDER BY m.created_at DESC`,
    values
  );
  return result.rows;
}

export async function findMonetizationById(id: string): Promise<MonetizationRow | null> {
  const result = await query<MonetizationRow>(
    `SELECT m.*, u.name AS account_name
     FROM commercial_monetizations m
     LEFT JOIN users u ON u.id = m.account_user_id
     WHERE m.id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function insertMonetization(data: {
  client_name: string;
  client_id?: string;
  account_user_id: string;
  monetization_type: string;
  product_service: string;
  value: number;
  temperature: string;
  status: string;
  reference_month: string;
  notes?: string;
  created_by: string;
}): Promise<MonetizationRow> {
  const result = await query<MonetizationRow>(
    `INSERT INTO commercial_monetizations
      (client_name, client_id, account_user_id, monetization_type, product_service,
       value, temperature, status, reference_month, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [data.client_name, data.client_id ?? null, data.account_user_id,
     data.monetization_type, data.product_service, data.value,
     data.temperature, data.status, data.reference_month,
     data.notes ?? null, data.created_by]
  );
  return result.rows[0];
}

export async function updateMonetization(id: string, fields: Record<string, unknown>): Promise<MonetizationRow | null> {
  const keys = Object.keys(fields);
  if (keys.length === 0) return null;
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [id, ...Object.values(fields)];
  const result = await query<MonetizationRow>(
    `UPDATE commercial_monetizations SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export interface MonetizationOverviewRow {
  account_user_id: string;
  account_name: string;
  total_raised: string;
  total_closed: string;
  total_lost: string;
  total_value_closed: string;
  quente_count: string;
  morno_count: string;
  frio_count: string;
}

export async function getMonetizationOverview(reference_month: string): Promise<MonetizationOverviewRow[]> {
  const result = await query<MonetizationOverviewRow>(
    `SELECT
       m.account_user_id,
       u.name AS account_name,
       COUNT(*) AS total_raised,
       COUNT(*) FILTER (WHERE m.status = 'fechada') AS total_closed,
       COUNT(*) FILTER (WHERE m.status = 'perdida') AS total_lost,
       COALESCE(SUM(m.value) FILTER (WHERE m.status = 'fechada'), 0) AS total_value_closed,
       COUNT(*) FILTER (WHERE m.temperature = 'quente') AS quente_count,
       COUNT(*) FILTER (WHERE m.temperature = 'morno') AS morno_count,
       COUNT(*) FILTER (WHERE m.temperature = 'frio') AS frio_count
     FROM commercial_monetizations m
     LEFT JOIN users u ON u.id = m.account_user_id
     WHERE m.reference_month = $1
     GROUP BY m.account_user_id, u.name
     ORDER BY total_value_closed DESC`,
    [reference_month]
  );
  return result.rows;
}

// ─── Commissions ──────────────────────────────────────────────────────────────

export async function findCommissions(filters: {
  reference_month?: string;
  account_user_id?: string;
  status?: string;
}): Promise<CommissionRow[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (filters.reference_month) {
    conditions.push(`c.reference_month = $${idx++}`);
    values.push(filters.reference_month);
  }
  if (filters.account_user_id) {
    conditions.push(`c.account_user_id = $${idx++}`);
    values.push(filters.account_user_id);
  }
  if (filters.status) {
    conditions.push(`c.status = $${idx++}`);
    values.push(filters.status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query<CommissionRow>(
    `SELECT c.*, u.name AS account_name
     FROM commercial_commissions c
     LEFT JOIN users u ON u.id = c.account_user_id
     ${where}
     ORDER BY c.reference_month DESC, c.created_at DESC`,
    values
  );
  return result.rows;
}

export async function findCommissionByMonetizationId(monetizationId: string): Promise<CommissionRow | null> {
  const result = await query<CommissionRow>(
    'SELECT * FROM commercial_commissions WHERE monetization_id = $1',
    [monetizationId]
  );
  return result.rows[0] ?? null;
}

export async function upsertCommission(data: {
  monetization_id: string;
  account_user_id: string;
  reference_month: string;
  deal_value: number;
  commission_pct: number | null;
  commission_value: number;
  coordinator_pct: number;
  coordinator_value: number;
  tier_name: string | null;
}): Promise<CommissionRow> {
  const result = await query<CommissionRow>(
    `INSERT INTO commercial_commissions
      (monetization_id, account_user_id, reference_month, deal_value,
       commission_pct, commission_value, coordinator_pct, coordinator_value, tier_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (monetization_id)
     DO UPDATE SET
       deal_value = EXCLUDED.deal_value,
       commission_pct = EXCLUDED.commission_pct,
       commission_value = EXCLUDED.commission_value,
       coordinator_pct = EXCLUDED.coordinator_pct,
       coordinator_value = EXCLUDED.coordinator_value,
       tier_name = EXCLUDED.tier_name,
       updated_at = NOW()
     RETURNING *`,
    [data.monetization_id, data.account_user_id, data.reference_month,
     data.deal_value, data.commission_pct, data.commission_value,
     data.coordinator_pct, data.coordinator_value, data.tier_name]
  );
  return result.rows[0];
}

export async function updateCommissionStatus(id: string, status: 'approved' | 'paid'): Promise<CommissionRow | null> {
  const result = await query<CommissionRow>(
    'UPDATE commercial_commissions SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] ?? null;
}

export interface CommissionSummaryRow {
  account_user_id: string;
  account_name: string;
  total_commissions: string;
  total_coordinator: string;
  count: string;
}

export async function getCommissionSummary(reference_month: string): Promise<CommissionSummaryRow[]> {
  const result = await query<CommissionSummaryRow>(
    `SELECT
       c.account_user_id,
       u.name AS account_name,
       SUM(c.commission_value) AS total_commissions,
       SUM(c.coordinator_value) AS total_coordinator,
       COUNT(*) AS count
     FROM commercial_commissions c
     LEFT JOIN users u ON u.id = c.account_user_id
     WHERE c.reference_month = $1
     GROUP BY c.account_user_id, u.name
     ORDER BY total_commissions DESC`,
    [reference_month]
  );
  return result.rows;
}
