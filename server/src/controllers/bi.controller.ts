import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as biService from '../services/bi.service';

// ── GET /api/bi/:clientId — individual BI ────────────────────────────────────

export const getClientBI = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const bi = await biService.getClientBI(clientId);

  if (!bi) {
    res.status(404).json({ error: 'No BI data found for this client' });
    return;
  }

  res.json({ data: bi });
});

// ── POST /api/bi/:clientId/generate — generate individual BI ─────────────────

export const generateClientBI = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;

  try {
    const bi = await biService.generateClientBI(clientId);
    res.json({ data: bi });
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    if (error.statusCode === 422) {
      res.status(422).json({ error: error.message });
      return;
    }
    throw err;
  }
});

// ── GET /api/bi/global — global BI ────────────────────────────────────────────

export const getGlobalBI = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const bi = await biService.getGlobalBI();

  if (!bi) {
    // Return empty structure if none exists yet
    res.json({
      data: {
        id: null,
        client_id: null,
        type: 'global',
        data_json: {
          kpi_performance: [],
          campaign_insights: '',
          content_performance_notes: '',
          recommendations: [],
          risk_flags: [],
          period_summary: 'Nenhum BI global gerado ainda.',
        },
        generated_at: null,
        updated_at: null,
      },
    });
    return;
  }

  res.json({ data: bi });
});

// ── POST /api/bi/global/generate — generate global BI ─────────────────────────

export const generateGlobalBI = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const bi = await biService.generateGlobalBI();
  res.json({ data: bi });
});

// ── (kept for compatibility) ──────────────────────────────────────────────────

export const refreshBI = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ error: 'Use POST /api/bi/:clientId/generate or /api/bi/global/generate' });
});
