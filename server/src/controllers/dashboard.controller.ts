import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { query } from '../config/database';
import {
  calculateClientHealth,
  calculateAllClientHealth,
  generatePortfolioSnapshot,
  getHealthTrend,
} from '../services/health.service';
import { logger } from '../utils/logger';

// ── GET /api/dashboard/client/:clientId ─────────────────────────────────────

export const getClientDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;

  // Get latest health score
  const healthResult = await query(
    'SELECT * FROM health_scores WHERE client_id = $1 ORDER BY calculated_at DESC LIMIT 1',
    [clientId]
  );

  // Get client info
  const clientResult = await query(
    'SELECT id, name, segment, services_scope, health_score, health_updated_at FROM clients WHERE id = $1',
    [clientId]
  );

  // Get pending demands count
  const demandsResult = await query(
    "SELECT COUNT(*) as count FROM demand_detections WHERE client_id = $1 AND status IN ('detected', 'briefing_created')",
    [clientId]
  );

  // Get knowledge docs count
  const knowledgeResult = await query(
    'SELECT COUNT(*) as count FROM knowledge_documents WHERE client_id = $1',
    [clientId]
  );

  // Get meetings count (last 30 days)
  const meetingsResult = await query(
    "SELECT COUNT(*) as count FROM meetings WHERE client_id = $1 AND recorded_at > NOW() - INTERVAL '30 days'",
    [clientId]
  );

  res.status(200).json({
    client: clientResult.rows[0] ?? null,
    health: healthResult.rows[0] ?? null,
    stats: {
      pendingDemands: Number((demandsResult.rows[0] as { count: string }).count),
      knowledgeDocs: Number((knowledgeResult.rows[0] as { count: string }).count),
      meetingsLast30Days: Number((meetingsResult.rows[0] as { count: string }).count),
    },
  });
});

// ── POST /api/dashboard/client/:clientId/calculate-health ───────────────────

export const calculateHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  logger.info(`Calculating health for client ${clientId}`);
  const health = await calculateClientHealth(clientId);
  res.status(200).json({ data: health });
});

// ── GET /api/dashboard/client/:clientId/health-trend ────────────────────────

export const getClientHealthTrend = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const days = parseInt(req.query.days as string) || 30;
  const trend = await getHealthTrend(clientId, days);
  res.status(200).json({ data: trend });
});

// ── GET /api/dashboard/portfolio ────────────────────────────────────────────

export const getPortfolioDashboard = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  // Get latest snapshot
  const snapshotResult = await query(
    'SELECT * FROM portfolio_snapshots ORDER BY snapshot_date DESC LIMIT 1'
  );

  // Get all clients with health scores
  const clientsResult = await query(
    `SELECT c.id, c.name, c.segment, c.health_score, c.health_updated_at,
            c.services_scope, c.status
     FROM clients c
     WHERE c.status = 'active'
     ORDER BY c.health_score ASC NULLS LAST`
  );

  // Get overall stats
  const statsResult = await query(
    `SELECT
       COUNT(*) as total_clients,
       COUNT(*) FILTER (WHERE status = 'active') as active_clients,
       AVG(health_score) FILTER (WHERE health_score IS NOT NULL) as avg_health,
       COUNT(*) FILTER (WHERE health_score < 40) as critical_count,
       COUNT(*) FILTER (WHERE health_score >= 40 AND health_score < 60) as at_risk_count,
       COUNT(*) FILTER (WHERE health_score >= 60 AND health_score < 80) as healthy_count,
       COUNT(*) FILTER (WHERE health_score >= 80) as thriving_count
     FROM clients WHERE status = 'active'`
  );

  res.status(200).json({
    snapshot: snapshotResult.rows[0] ?? null,
    clients: clientsResult.rows,
    stats: statsResult.rows[0],
  });
});

// ── POST /api/dashboard/portfolio/generate ──────────────────────────────────

export const generatePortfolio = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  logger.info('Generating portfolio snapshot');
  const portfolio = await generatePortfolioSnapshot();
  res.status(201).json({ data: portfolio });
});

// ── POST /api/dashboard/calculate-all-health ────────────────────────────────

export const calculateAllHealth = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  logger.info('Calculating health for all clients');
  const results = await calculateAllClientHealth();
  res.status(200).json({
    message: `Health calculated for ${results.length} clients`,
    results,
  });
});

// ── GET /api/dashboard/health/distribution ──────────────────────────────────

export const getHealthDistribution = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE health_score >= 80) as thriving,
       COUNT(*) FILTER (WHERE health_score >= 60 AND health_score < 80) as healthy,
       COUNT(*) FILTER (WHERE health_score >= 40 AND health_score < 60) as at_risk,
       COUNT(*) FILTER (WHERE health_score < 40) as critical,
       COUNT(*) FILTER (WHERE health_score IS NULL) as no_data
     FROM clients WHERE status = 'active'`
  );
  res.status(200).json({ data: result.rows[0] });
});
