import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import {
  generateHypotheses,
  getHypothesesByClient,
  updateHypothesisStatus,
  validateHypothesis,
} from '../services/hypothesis.service';

// ── GET /api/hypotheses/:clientId ───────────────────────────────────────────

export const listHypotheses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const { status, category } = req.query as { status?: string; category?: string };
  const hypotheses = await getHypothesesByClient(clientId, { status, category });
  res.status(200).json({ data: hypotheses });
});

// ── POST /api/hypotheses/:clientId/generate ─────────────────────────────────

export const generate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const result = await generateHypotheses(clientId);
  res.status(201).json({ data: result });
});

// ── PATCH /api/hypotheses/:hypothesisId/status ──────────────────────────────

export const updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { hypothesisId } = req.params;
  const { status } = req.body as { status?: string };

  const valid = ['proposed', 'accepted', 'testing', 'validated', 'rejected'];
  if (!status || !valid.includes(status)) {
    throw new AppError(`Invalid status. Must be: ${valid.join(', ')}`, 400);
  }

  const updated = await updateHypothesisStatus(hypothesisId, status);
  if (!updated) throw new AppError('Hypothesis not found', 404);
  res.status(200).json({ data: updated });
});

// ── POST /api/hypotheses/:hypothesisId/validate ─────────────────────────────

export const validate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { hypothesisId } = req.params;
  const { testResults } = req.body as { testResults?: string };

  if (!testResults) throw new AppError('testResults text is required', 400);

  const validation = await validateHypothesis(hypothesisId, testResults);
  res.status(200).json({ data: validation });
});
