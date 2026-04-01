import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as reportsService from '../services/reports.service';

// ── GET /api/reports/:clientId ────────────────────────────────────────────────

export const listReports = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const reports = await reportsService.listReports(clientId);
  res.json({ data: reports, total: reports.length });
});

// ── POST /api/reports/:clientId ───────────────────────────────────────────────

export const createReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const userId = req.user?.userId;

  const {
    campaign_name,
    period_start,
    period_end,
    roi,
    roas,
    cpa,
    ctr,
    cpm,
    impressions,
    conversions,
    spend,
    extra_metrics_json,
  } = req.body as {
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
  };

  if (!campaign_name || !period_start || !period_end) {
    res.status(400).json({ error: 'campaign_name, period_start, and period_end are required' });
    return;
  }

  const report = await reportsService.createReport({
    client_id: clientId,
    campaign_name,
    period_start,
    period_end,
    roi: roi ?? null,
    roas: roas ?? null,
    cpa: cpa ?? null,
    ctr: ctr ?? null,
    cpm: cpm ?? null,
    impressions: impressions ?? null,
    conversions: conversions ?? null,
    spend: spend ?? null,
    extra_metrics_json: extra_metrics_json ?? null,
    reported_by: userId ?? null,
  });

  res.status(201).json({ data: report });
});

// ── GET /api/reports/:clientId/:reportId ──────────────────────────────────────

export const getReportById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { reportId } = req.params;

  const report = await reportsService.getReportById(reportId);
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }

  res.json({ data: report });
});

// ── (kept for compatibility) ──────────────────────────────────────────────────

export const updateReport = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ error: 'Not Implemented' });
});
