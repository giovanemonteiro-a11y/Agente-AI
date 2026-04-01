export type BIType = 'individual' | 'global';

export interface KPIPerformance {
  kpi: string;
  target: string;
  actual: string;
  status: 'on_track' | 'behind' | 'achieved';
  trend: 'up' | 'down' | 'stable';
}

export interface BIRecommendation {
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  rationale: string;
}

export interface BIDataJson {
  kpi_performance: KPIPerformance[];
  campaign_insights: string;
  content_performance_notes: string;
  recommendations: BIRecommendation[];
  risk_flags: string[];
  period_summary: string;
}

export interface BIData {
  id: string;
  client_id: string | null;
  type: BIType;
  data_json: BIDataJson;
  generated_at: string;
  updated_at: string;
}
