import { query } from '../config/database';

export interface CampaignReport {
  id: string;
  client_id: string;
  campaign_name: string;
  period_start: string;
  period_end: string;
  roi: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  cpm: number | null;
  impressions: number | null;
  conversions: number | null;
  spend: number | null;
  extra_metrics_json: Record<string, unknown> | null;
  reported_by: string | null;
  created_at: string;
}

export interface CreateReportData {
  client_id: string;
  campaign_name: string;
  period_start: string;
  period_end: string;
  roi?: number | null;
  roas?: number | null;
  cpa?: number | null;
  ctr?: number | null;
  cpm?: number | null;
  impressions?: number | null;
  conversions?: number | null;
  spend?: number | null;
  extra_metrics_json?: Record<string, unknown> | null;
  reported_by?: string | null;
}

export async function findByClientId(clientId: string): Promise<CampaignReport[]> {
  const result = await query<CampaignReport>(
    `SELECT * FROM campaign_reports
     WHERE client_id = $1
     ORDER BY created_at DESC`,
    [clientId]
  );
  return result.rows;
}

export async function findById(id: string): Promise<CampaignReport | null> {
  const result = await query<CampaignReport>(
    `SELECT * FROM campaign_reports WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function create(data: CreateReportData): Promise<CampaignReport> {
  const result = await query<CampaignReport>(
    `INSERT INTO campaign_reports (
       client_id, campaign_name, period_start, period_end,
       roi, roas, cpa, ctr, cpm, impressions, conversions, spend,
       extra_metrics_json, reported_by
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      data.client_id,
      data.campaign_name,
      data.period_start,
      data.period_end,
      data.roi ?? null,
      data.roas ?? null,
      data.cpa ?? null,
      data.ctr ?? null,
      data.cpm ?? null,
      data.impressions ?? null,
      data.conversions ?? null,
      data.spend ?? null,
      data.extra_metrics_json ? JSON.stringify(data.extra_metrics_json) : null,
      data.reported_by ?? null,
    ]
  );
  return result.rows[0];
}
