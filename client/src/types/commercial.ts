export type MonetizationType = 'expansao' | 'drx' | 'ativacao' | 'indicacao';
export type ProposalTemperature = 'quente' | 'morno' | 'frio';
export type MonetizationStatus = 'proposta' | 'fechada' | 'perdida';
export type CommissionStatus = 'pending' | 'approved' | 'paid';
export type CommissionRuleType = 'percentage' | 'fixed_value' | 'progressive';

export interface CommercialGoal {
  id: string;
  title: string;
  period_type: 'monthly' | 'quarterly';
  period_start: string;
  period_end: string;
  total_goal: string;
  expansion_goal: string;
  drx_goal: string;
  activation_goal: string;
  referral_goal: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionTier {
  id: string;
  rule_id: string;
  tier_name: string;
  min_pct: string;
  max_pct: string | null;
  commission_pct: string;
  sort_order: number;
}

export interface CommissionRule {
  id: string;
  monetization_type: MonetizationType;
  rule_type: CommissionRuleType;
  fixed_pct: string | null;
  fixed_value: string | null;
  coordinator_pct: string;
  is_active: boolean;
  tiers?: CommissionTier[];
}

export interface Monetization {
  id: string;
  client_name: string;
  client_id: string | null;
  account_user_id: string;
  account_name?: string;
  monetization_type: MonetizationType;
  product_service: string;
  value: string;
  temperature: ProposalTemperature;
  status: MonetizationStatus;
  reference_month: string;
  notes: string | null;
  closed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  monetization_id: string;
  account_user_id: string;
  account_name?: string;
  reference_month: string;
  deal_value: string;
  commission_pct: string | null;
  commission_value: string;
  coordinator_pct: string;
  coordinator_value: string;
  tier_name: string | null;
  status: CommissionStatus;
  created_at: string;
}

export interface MonetizationOverview {
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

export interface CommissionSummary {
  account_user_id: string;
  account_name: string;
  total_commissions: string;
  total_coordinator: string;
  count: string;
}

export interface AccountProgress {
  account_user_id: string;
  account_name: string;
  achieved: number;
  individual_goal: number;
  achievement_pct: number;
}

export interface GoalProgress {
  goal: CommercialGoal;
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
  by_account: AccountProgress[];
}

export interface DashboardData {
  month: string;
  goal: CommercialGoal | null;
  monthly_goal: number;
  per_account_goal: number;
  total_achieved: number;
  achievement_pct: number;
  by_account: AccountProgress[];
  overview: MonetizationOverview[];
  commission_summary: CommissionSummary[];
  temperature_summary: { quente: number; morno: number; frio: number };
  total_commission_value: number;
  total_coordinator_value: number;
}

export interface CreateGoalPayload {
  title: string;
  period_type: 'monthly' | 'quarterly';
  period_start: string;
  period_end: string;
  total_goal: number;
  expansion_goal: number;
  drx_goal: number;
  activation_goal: number;
  referral_goal: number;
}

export interface CreateMonetizationPayload {
  client_name: string;
  client_id?: string;
  account_user_id: string;
  monetization_type: MonetizationType;
  product_service: string;
  value: number;
  temperature: ProposalTemperature;
  status: MonetizationStatus;
  reference_month: string;
  notes?: string;
}

export interface UpdateMonetizationPayload {
  client_name?: string;
  monetization_type?: MonetizationType;
  product_service?: string;
  value?: number;
  temperature?: ProposalTemperature;
  status?: MonetizationStatus;
  notes?: string;
}
