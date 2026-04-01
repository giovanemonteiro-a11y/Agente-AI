export interface CampaignReport {
  id: string;
  client_id: string;
  campaign_name: string;
  period_start: string;
  period_end: string;
  roi?: number;
  roas?: number;
  cpa?: number;
  ctr?: number;
  cpm?: number;
  impressions?: number;
  conversions?: number;
  spend?: number;
  extra_metrics_json?: Record<string, unknown>;
  reported_by?: string;
  created_at: string;
}
