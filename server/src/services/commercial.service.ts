import { AppError } from '../middleware/errorHandler';
import {
  findAllGoals, findGoalById, insertGoal, updateGoal, deleteGoal,
  findAllCommissionRules, findCommissionRuleByType, updateCommissionRule,
  findMonetizations, findMonetizationById, insertMonetization, updateMonetization,
  getMonetizationOverview,
  findCommissions, upsertCommission, updateCommissionStatus,
  getCommissionSummary, findCommissionByMonetizationId,
  CommercialGoalRow, CommissionRuleRow, MonetizationRow, CommissionRow,
  CommissionSummaryRow, MonetizationOverviewRow,
} from '../repositories/commercial.repository';
import { query } from '../config/database';

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function listAccountUsers(): Promise<{ id: string; name: string; email: string }[]> {
  const result = await query(
    `SELECT id, name, email FROM users WHERE role = 'account' ORDER BY name`,
  );
  return result.rows;
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function listGoals(): Promise<CommercialGoalRow[]> {
  return findAllGoals();
}

export async function createGoal(data: {
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
  if (new Date(data.period_end) <= new Date(data.period_start)) {
    throw new AppError('Data de fim deve ser posterior a data de inicio', 400);
  }
  return insertGoal(data);
}

export async function getGoal(id: string): Promise<CommercialGoalRow> {
  const goal = await findGoalById(id);
  if (!goal) throw new AppError('Meta nao encontrada', 404);
  return goal;
}

export async function editGoal(id: string, fields: Record<string, unknown>): Promise<CommercialGoalRow> {
  const goal = await updateGoal(id, fields);
  if (!goal) throw new AppError('Meta nao encontrada', 404);
  return goal;
}

export async function removeGoal(id: string): Promise<void> {
  const deleted = await deleteGoal(id);
  if (!deleted) throw new AppError('Meta nao encontrada', 404);
}

export interface GoalProgress {
  goal: CommercialGoalRow;
  monthly_goal: number;
  per_account_goal: number;
  account_count: number;
  current_month: string;
  total_achieved: number;
  expansion_achieved: number;
  drx_achieved: number;
  activation_achieved: number;
  referral_achieved: number;
  achievement_pct: number;
  by_account: Array<{
    account_user_id: string;
    account_name: string;
    achieved: number;
    individual_goal: number;
    achievement_pct: number;
  }>;
}

export async function getGoalProgress(goalId: string, referenceMonth: string): Promise<GoalProgress> {
  const goal = await findGoalById(goalId);
  if (!goal) throw new AppError('Meta nao encontrada', 404);

  // Count account users
  const accountCountResult = await query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM users WHERE role = 'account'"
  );
  const accountCount = parseInt(accountCountResult.rows[0].count, 10) || 1;

  // Calculate monthly goal
  const start = new Date(goal.period_start);
  const end = new Date(goal.period_end);
  const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  const monthlyGoal = parseFloat(goal.total_goal) / monthsDiff;
  const perAccountGoal = monthlyGoal / accountCount;

  // Get overview for the reference month
  const overview = await getMonetizationOverview(referenceMonth);

  const totalAchieved = overview.reduce((sum, row) => sum + parseFloat(row.total_value_closed), 0);

  // Get type-specific totals
  const typeResult = await query<{ monetization_type: string; total: string }>(
    `SELECT monetization_type, SUM(value) AS total
     FROM commercial_monetizations
     WHERE reference_month = $1 AND status = 'fechada'
     GROUP BY monetization_type`,
    [referenceMonth]
  );
  const typeMap = Object.fromEntries(typeResult.rows.map((r) => [r.monetization_type, parseFloat(r.total)]));

  const byAccount = overview.map((row) => ({
    account_user_id: row.account_user_id,
    account_name: row.account_name,
    achieved: parseFloat(row.total_value_closed),
    individual_goal: perAccountGoal,
    achievement_pct: perAccountGoal > 0 ? (parseFloat(row.total_value_closed) / perAccountGoal) * 100 : 0,
  }));

  return {
    goal,
    monthly_goal: monthlyGoal,
    per_account_goal: perAccountGoal,
    account_count: accountCount,
    current_month: referenceMonth,
    total_achieved: totalAchieved,
    expansion_achieved: typeMap['expansao'] ?? 0,
    drx_achieved: typeMap['drx'] ?? 0,
    activation_achieved: typeMap['ativacao'] ?? 0,
    referral_achieved: typeMap['indicacao'] ?? 0,
    achievement_pct: monthlyGoal > 0 ? (totalAchieved / monthlyGoal) * 100 : 0,
    by_account: byAccount,
  };
}

// ─── Commission Rules ──────────────────────────────────────────────────────────

export async function listCommissionRules(): Promise<CommissionRuleRow[]> {
  return findAllCommissionRules();
}

export async function editCommissionRule(id: string, fields: Record<string, unknown>): Promise<CommissionRuleRow> {
  const rule = await updateCommissionRule(id, fields);
  if (!rule) throw new AppError('Regra de comissao nao encontrada', 404);
  return rule;
}

// ─── Monetizations ────────────────────────────────────────────────────────────

export async function listMonetizations(filters: {
  reference_month?: string;
  monetization_type?: string;
  account_user_id?: string;
  status?: string;
}): Promise<MonetizationRow[]> {
  return findMonetizations(filters);
}

export async function createMonetization(data: {
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
  return insertMonetization(data);
}

export async function getMonetization(id: string): Promise<MonetizationRow> {
  const m = await findMonetizationById(id);
  if (!m) throw new AppError('Monetizacao nao encontrada', 404);
  return m;
}

export async function editMonetization(id: string, fields: Record<string, unknown>): Promise<MonetizationRow> {
  // If closing a deal, set closed_at
  if (fields.status === 'fechada' && !fields.closed_at) {
    fields.closed_at = new Date().toISOString();
  }
  const m = await updateMonetization(id, fields);
  if (!m) throw new AppError('Monetizacao nao encontrada', 404);
  return m;
}

export async function getOverview(reference_month: string): Promise<MonetizationOverviewRow[]> {
  return getMonetizationOverview(reference_month);
}

// ─── Commission Calculation ───────────────────────────────────────────────────

export interface CalculationResult {
  calculated: number;
  skipped: number;
  total_commission: number;
  total_coordinator: number;
}

export async function calculateCommissions(referenceMonth: string): Promise<CalculationResult> {
  // Get all closed monetizations for the month
  const monetizations = await findMonetizations({ reference_month: referenceMonth, status: 'fechada' });
  if (monetizations.length === 0) {
    return { calculated: 0, skipped: 0, total_commission: 0, total_coordinator: 0 };
  }

  // Count accounts for goal distribution
  const accountCountResult = await query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM users WHERE role = 'account'"
  );
  const accountCount = parseInt(accountCountResult.rows[0].count, 10) || 1;

  // Get latest goal for period
  const goalResult = await query<{ id: string; expansion_goal: string; total_goal: string; period_start: Date; period_end: Date }>(
    `SELECT id, expansion_goal, total_goal, period_start, period_end
     FROM commercial_goals
     WHERE period_start <= $1 AND period_end >= $1
     ORDER BY created_at DESC LIMIT 1`,
    [referenceMonth]
  );
  const goal = goalResult.rows[0];

  // Calculate per-account monthly expansion goal
  let perAccountMonthlyExpansionGoal = 0;
  if (goal) {
    const start = new Date(goal.period_start);
    const end = new Date(goal.period_end);
    const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    perAccountMonthlyExpansionGoal = (parseFloat(goal.expansion_goal) / monthsDiff) / accountCount;
  }

  // Load commission rules
  const expansaoRule = await findCommissionRuleByType('expansao');
  const drxRule = await findCommissionRuleByType('drx');
  const ativacaoRule = await findCommissionRuleByType('ativacao');
  const indicacaoRule = await findCommissionRuleByType('indicacao');

  // Group expansion deals by account to calculate tier
  const expansaoByAccount: Record<string, { total: number; deals: MonetizationRow[] }> = {};
  for (const m of monetizations) {
    if (m.monetization_type === 'expansao') {
      if (!expansaoByAccount[m.account_user_id]) {
        expansaoByAccount[m.account_user_id] = { total: 0, deals: [] };
      }
      expansaoByAccount[m.account_user_id].total += parseFloat(m.value);
      expansaoByAccount[m.account_user_id].deals.push(m);
    }
  }

  let calculated = 0;
  let skipped = 0;
  let totalCommission = 0;
  let totalCoordinator = 0;

  for (const m of monetizations) {
    let commissionValue = 0;
    let commissionPct: number | null = null;
    let tierName: string | null = null;
    let rule: CommissionRuleRow | null = null;

    if (m.monetization_type === 'expansao' && expansaoRule) {
      rule = expansaoRule;
      const accountTotal = expansaoByAccount[m.account_user_id]?.total ?? 0;
      const achievementPct = perAccountMonthlyExpansionGoal > 0
        ? (accountTotal / perAccountMonthlyExpansionGoal) * 100
        : 0;

      // Find applicable tier
      const tiers = expansaoRule.tiers ?? [];
      const tier = tiers.find((t) => {
        const min = parseFloat(t.min_pct);
        const max = t.max_pct != null ? parseFloat(t.max_pct) : Infinity;
        return achievementPct >= min && achievementPct <= max;
      });

      if (tier) {
        commissionPct = parseFloat(tier.commission_pct);
        tierName = tier.tier_name;
        commissionValue = parseFloat(m.value) * (commissionPct / 100);
      }
    } else if (m.monetization_type === 'drx' && drxRule) {
      rule = drxRule;
      commissionPct = parseFloat(drxRule.fixed_pct ?? '0');
      commissionValue = parseFloat(m.value) * (commissionPct / 100);
    } else if (m.monetization_type === 'ativacao' && ativacaoRule) {
      rule = ativacaoRule;
      commissionPct = parseFloat(ativacaoRule.fixed_pct ?? '0');
      commissionValue = parseFloat(m.value) * (commissionPct / 100);
    } else if (m.monetization_type === 'indicacao' && indicacaoRule) {
      rule = indicacaoRule;
      commissionPct = null;
      commissionValue = parseFloat(indicacaoRule.fixed_value ?? '700');
    }

    if (!rule || commissionValue === 0) {
      skipped++;
      continue;
    }

    const coordinatorPct = parseFloat(rule.coordinator_pct);
    const coordinatorValue = parseFloat(m.value) * (coordinatorPct / 100);

    await upsertCommission({
      monetization_id: m.id,
      account_user_id: m.account_user_id,
      reference_month: referenceMonth,
      deal_value: parseFloat(m.value),
      commission_pct: commissionPct,
      commission_value: commissionValue,
      coordinator_pct: coordinatorPct,
      coordinator_value: coordinatorValue,
      tier_name: tierName,
    });

    totalCommission += commissionValue;
    totalCoordinator += coordinatorValue;
    calculated++;
  }

  return { calculated, skipped, total_commission: totalCommission, total_coordinator: totalCoordinator };
}

// ─── Commissions ──────────────────────────────────────────────────────────────

export async function listCommissions(filters: {
  reference_month?: string;
  account_user_id?: string;
  status?: string;
}): Promise<CommissionRow[]> {
  return findCommissions(filters);
}

export async function approveCommission(id: string, status: 'approved' | 'paid'): Promise<CommissionRow> {
  const commission = await updateCommissionStatus(id, status);
  if (!commission) throw new AppError('Comissao nao encontrada', 404);
  return commission;
}

export async function listCommissionSummary(reference_month: string): Promise<CommissionSummaryRow[]> {
  return getCommissionSummary(reference_month);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardData {
  month: string;
  goal: CommercialGoalRow | null;
  monthly_goal: number;
  per_account_goal: number;
  total_achieved: number;
  achievement_pct: number;
  by_account: GoalProgress['by_account'];
  overview: MonetizationOverviewRow[];
  commission_summary: CommissionSummaryRow[];
  temperature_summary: { quente: number; morno: number; frio: number };
  total_commission_value: number;
  total_coordinator_value: number;
}

export async function getDashboard(referenceMonth: string): Promise<DashboardData> {
  // Get active goal for this month
  const goalResult = await query<CommercialGoalRow>(
    `SELECT * FROM commercial_goals
     WHERE period_start <= $1 AND period_end >= $1
     ORDER BY created_at DESC LIMIT 1`,
    [referenceMonth]
  );
  const goal = goalResult.rows[0] ?? null;

  let monthlyGoal = 0;
  let perAccountGoal = 0;
  let byAccount: GoalProgress['by_account'] = [];

  if (goal) {
    const progress = await getGoalProgress(goal.id, referenceMonth);
    monthlyGoal = progress.monthly_goal;
    perAccountGoal = progress.per_account_goal;
    byAccount = progress.by_account;
  }

  const overview = await getMonetizationOverview(referenceMonth);
  const commissionSummary = await getCommissionSummary(referenceMonth);

  const totalAchieved = overview.reduce((sum, r) => sum + parseFloat(r.total_value_closed), 0);

  // Temperature summary
  const tempResult = await query<{ temperature: string; count: string }>(
    `SELECT temperature, COUNT(*) AS count
     FROM commercial_monetizations
     WHERE reference_month = $1
     GROUP BY temperature`,
    [referenceMonth]
  );
  const tempMap = Object.fromEntries(tempResult.rows.map((r) => [r.temperature, parseInt(r.count, 10)]));

  const totalCommissionValue = commissionSummary.reduce((sum, r) => sum + parseFloat(r.total_commissions), 0);
  const totalCoordinatorValue = commissionSummary.reduce((sum, r) => sum + parseFloat(r.total_coordinator), 0);

  return {
    month: referenceMonth,
    goal,
    monthly_goal: monthlyGoal,
    per_account_goal: perAccountGoal,
    total_achieved: totalAchieved,
    achievement_pct: monthlyGoal > 0 ? (totalAchieved / monthlyGoal) * 100 : 0,
    by_account: byAccount,
    overview,
    commission_summary: commissionSummary,
    temperature_summary: {
      quente: tempMap['quente'] ?? 0,
      morno: tempMap['morno'] ?? 0,
      frio: tempMap['frio'] ?? 0,
    },
    total_commission_value: totalCommissionValue,
    total_coordinator_value: totalCoordinatorValue,
  };
}
