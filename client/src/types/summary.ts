export interface KPI {
  metric: string;
  target: string;
}

export interface SummaryJSON {
  contracted_scope: string;
  client_needs: string;
  kpis: KPI[];
  success_indicator: string;
  target_audience: string;
  objectives: string;
  extra_details: string;
}

export interface BrandProfileJSON {
  positioning: string;
  personality: string;
  tone_of_voice: string;
  visual_identity_notes: string;
  brand_promise: string;
  differentiators: string;
  archetype: string | null;
}

export interface Summary {
  id: string;
  client_id: string;
  strategy_id: string | null;
  summary_json: SummaryJSON;
  brand_profile_json: BrandProfileJSON;
  approved_by: string | null;
  approved_at: string | null;
  generated_at: string;
  updated_at: string;
  auto_refreshed?: boolean;
  auto_refreshed_at?: string | null;
  previous_summary_json?: SummaryJSON | null;
  previous_brand_profile_json?: BrandProfileJSON | null;
}
