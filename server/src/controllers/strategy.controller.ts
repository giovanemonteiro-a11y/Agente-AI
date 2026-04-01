import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import {
  findByClientId,
  findLatestByClientId,
  findById,
  create,
  getNextVersion,
} from '../repositories/strategies.repository';
import { findMeetingsByClientId } from '../repositories/meetings.repository';
import { findClientById } from '../repositories/clients.repository';
import {
  detectGaps as aiDetectGaps,
  getTranscriptHighlights,
  streamTranscriptHighlights,
  PromptContext,
} from '../services/ai/ai.service';

// ── Validation schema ─────────────────────────────────────────────────────────

const strategyBodySchema = z.object({
  objectives: z.string().min(1, 'objectives is required'),
  positioning: z.string().min(1, 'positioning is required'),
  differentials: z.string().min(1, 'differentials is required'),
  tone: z.string().min(1, 'tone is required'),
  products: z.string().min(1, 'products is required'),
  expected_results: z.string().min(1, 'expected_results is required'),
});

// ── Helper: build PromptContext for a client ──────────────────────────────────

async function buildContext(
  clientId: string,
  strategyData?: Record<string, string>
): Promise<PromptContext> {
  const client = (await findClientById(clientId)) as {
    name?: string;
    segment?: string;
    services_scope?: string[];
  } | null;

  if (!client) throw new AppError('Client not found', 404);

  const meetings = (await findMeetingsByClientId(clientId)) as Array<{
    transcript_text?: string | null;
    type?: string;
    recorded_at?: string;
  }>;

  const meetingTranscripts = meetings
    .filter((m) => m.transcript_text)
    .map((m) => m.transcript_text as string);

  const ctx: PromptContext = {
    clientName: client.name ?? clientId,
    clientSegment: client.segment,
    clientServicesScope: client.services_scope,
    meetingTranscripts,
  };

  if (strategyData) {
    ctx.strategy = {
      objectives: strategyData.objectives,
      positioning: strategyData.positioning,
      differentials: strategyData.differentials,
      tone: strategyData.tone,
      products: strategyData.products,
      expectedResults: strategyData.expected_results,
    };
  }

  return ctx;
}

// ── GET /:clientId — latest strategy ─────────────────────────────────────────

export const getLatestStrategy = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;
    const strategy = await findLatestByClientId(clientId);
    res.status(200).json({ data: strategy ?? null });
  }
);

// ── GET /:clientId/history — all versions ────────────────────────────────────

export const getStrategyHistory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;
    const versions = await findByClientId(clientId);
    res.status(200).json({ data: versions });
  }
);

// ── POST /:clientId — create new version ─────────────────────────────────────

export const createStrategyVersion = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;

    const parsed = strategyBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    // Ensure client exists
    const client = await findClientById(clientId);
    if (!client) throw new AppError('Client not found', 404);

    const nextVersion = await getNextVersion(clientId);
    const userId = req.user?.userId ?? 'unknown';

    const strategy = await create({
      client_id: clientId,
      version: nextVersion,
      objectives: parsed.data.objectives,
      positioning: parsed.data.positioning,
      differentials: parsed.data.differentials,
      tone: parsed.data.tone,
      products: parsed.data.products,
      expected_results: parsed.data.expected_results,
      created_by: userId,
    });

    res.status(201).json({ data: strategy });
  }
);

// ── POST /:clientId/highlights — transcript highlights (non-streaming) ────────

export const getHighlights = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;
    const { fieldName } = req.body as { fieldName?: string };

    if (!fieldName || typeof fieldName !== 'string') {
      throw new AppError('fieldName is required in request body', 400);
    }

    const ctx = await buildContext(clientId);
    const highlights = await getTranscriptHighlights(ctx, fieldName);
    res.status(200).json({ data: highlights });
  }
);

// ── GET /:clientId/highlights/stream — SSE streaming highlights ───────────────

export const streamHighlights = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;
    const field = req.query.field as string | undefined;

    if (!field) {
      res.status(400).json({ error: 'field query parameter is required' });
      return;
    }

    const ctx = await buildContext(clientId);
    await streamTranscriptHighlights(ctx, field, res);
  }
);

// ── POST /:clientId/gaps — gap detection ─────────────────────────────────────

export const detectStrategyGaps = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;

    // Use latest strategy if no body provided; otherwise use body fields
    let strategyFields: Record<string, string> = {};

    const bodyFields = req.body as Partial<Record<string, string>>;
    const fieldNames = ['objectives', 'positioning', 'differentials', 'tone', 'products', 'expected_results'];
    const hasBodyFields = fieldNames.some((f) => bodyFields[f]);

    if (hasBodyFields) {
      strategyFields = Object.fromEntries(
        fieldNames
          .filter((f) => bodyFields[f])
          .map((f) => [f, bodyFields[f] as string])
      );
    } else {
      const latest = await findLatestByClientId(clientId);
      if (latest) {
        strategyFields = {
          objectives: latest.objectives ?? '',
          positioning: latest.positioning ?? '',
          differentials: latest.differentials ?? '',
          tone: latest.tone ?? '',
          products: latest.products ?? '',
          expected_results: latest.expected_results ?? '',
        };
      }
    }

    const ctx = await buildContext(clientId, strategyFields);
    const gaps = await aiDetectGaps(ctx, strategyFields);
    res.status(200).json({ data: gaps });
  }
);

// ── Legacy stubs — kept for backward-compat with old route file ───────────────

export const listStrategies = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const clientId = req.query.clientId as string | undefined;
    if (!clientId) {
      res.status(400).json({ error: 'clientId query parameter is required' });
      return;
    }
    const strategies = await findByClientId(clientId);
    res.status(200).json({ data: strategies });
  }
);

export const createStrategy = createStrategyVersion;

export const getStrategyById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const strategy = await findById(id);
    if (!strategy) throw new AppError('Strategy not found', 404);
    res.status(200).json({ data: strategy });
  }
);

export const updateStrategy = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    // Strategies are immutable — updates create new versions
    res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST /:clientId to create a new version' });
  }
);

// Legacy alias — the old route used `detectGaps` as the export name
export { detectStrategyGaps as detectGaps };
