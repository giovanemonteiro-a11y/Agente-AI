import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { query } from '../config/database';
import { logger } from '../utils/logger';

// ── GET /api/demands/:clientId ──────────────────────────────────────────────

export const listDemands = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const status = req.query.status as string | undefined;

  let sql = 'SELECT * FROM demand_detections WHERE client_id = $1';
  const params: unknown[] = [clientId];

  if (status) {
    sql += ' AND status = $2';
    params.push(status);
  }

  sql += ' ORDER BY CASE urgency WHEN \'critical\' THEN 0 WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 ELSE 3 END, created_at DESC';

  const result = await query(sql, params);
  res.status(200).json({ data: result.rows });
});

// ── GET /api/demands/:clientId/pending ───────────────────────────────────────

export const listPendingDemands = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;

  const result = await query(
    `SELECT * FROM demand_detections
     WHERE client_id = $1 AND status IN ('detected', 'briefing_created')
     ORDER BY CASE urgency WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC`,
    [clientId]
  );

  res.status(200).json({ data: result.rows });
});

// ── PATCH /api/demands/:demandId/status ─────────────────────────────────────

export const updateDemandStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { demandId } = req.params;
  const { status } = req.body as { status?: string };

  const validStatuses = ['detected', 'briefing_created', 'assigned', 'completed', 'dismissed'];
  if (!status || !validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  const result = await query(
    'UPDATE demand_detections SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, demandId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Demand not found', 404);
  }

  res.status(200).json({ data: result.rows[0] });
});

// ── POST /api/demands/:demandId/dismiss ─────────────────────────────────────

export const dismissDemand = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { demandId } = req.params;

  const result = await query(
    "UPDATE demand_detections SET status = 'dismissed', updated_at = NOW() WHERE id = $1 RETURNING *",
    [demandId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Demand not found', 404);
  }

  res.status(200).json({ data: result.rows[0] });
});
