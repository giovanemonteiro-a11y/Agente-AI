import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  findByClientId,
  upsert,
  approve,
  resetApproval,
  patchSummaryFields,
} from '../repositories/summaries.repository';
import { findClientById } from '../repositories/clients.repository';
import { findLatestByClientId } from '../repositories/strategies.repository';
import { findMeetingsByClientId } from '../repositories/meetings.repository';
import { generateSummary, assembleContext, PromptContext } from '../services/ai/ai.service';
import { eventBus } from '../events/eventBus';
import { logger } from '../utils/logger';

const RESTRICTED_ROLES = ['social_media', 'designer', 'gestor_trafego'] as const;

// ── GET /api/summary/:clientId ────────────────────────────────────────────────

export const getSummaryByClient = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;
    const user = req.user!;

    const summary = await findByClientId(clientId);

    if (!summary) {
      res.status(200).json({ data: null });
      return;
    }

    // Role gate: restricted roles cannot see summary until approved
    if (
      RESTRICTED_ROLES.includes(user.role as (typeof RESTRICTED_ROLES)[number]) &&
      !summary.approved_at
    ) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Summary not yet approved. Access restricted until Account approves.',
      });
      return;
    }

    res.status(200).json({ data: summary });
  }
);

// ── POST /api/summary/:clientId/generate ──────────────────────────────────────

export const generateSummaryHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;

    // Fetch client
    const client = (await findClientById(clientId)) as
      | { id: string; name: string; segment?: string; services_scope?: string[] }
      | null
      | undefined;

    if (!client) {
      res.status(404).json({ error: 'Not Found', message: 'Client not found' });
      return;
    }

    // Fetch latest strategy
    const strategy = await findLatestByClientId(clientId);

    // Fetch meetings with transcripts
    const meetings = (await findMeetingsByClientId(clientId)) as Array<{
      transcript_text?: string | null;
    }>;

    const meetingTranscripts = meetings
      .filter((m) => m.transcript_text)
      .map((m) => m.transcript_text as string);

    // Assemble context
    const context: PromptContext = {
      clientName: client.name,
      clientSegment: client.segment,
      clientServicesScope: client.services_scope,
      strategy: strategy
        ? {
            objectives: strategy.objectives,
            positioning: strategy.positioning,
            differentials: strategy.differentials,
            tone: strategy.tone,
            products: strategy.products,
            expectedResults: strategy.expected_results,
          }
        : undefined,
      meetingTranscripts,
    };

    // Generate via AI
    const { summary: summaryJson, brand_profile: brandProfileJson } =
      await generateSummary(context);

    // Reset approval and upsert
    const saved = await upsert({
      clientId,
      summaryJson: summaryJson as unknown as Record<string, unknown>,
      brandProfileJson: brandProfileJson as unknown as Record<string, unknown>,
      strategyId: strategy?.id,
      autoRefreshed: false,
    });

    logger.info(`Summary generated for client ${clientId}`);

    res.status(200).json({ data: saved });
  }
);

// ── PATCH /api/summary/:clientId ──────────────────────────────────────────────

export const updateSummary = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;
    const { summary_json, brand_profile_json } = req.body as {
      summary_json?: Record<string, unknown>;
      brand_profile_json?: Record<string, unknown>;
    };

    if (!summary_json && !brand_profile_json) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Provide summary_json or brand_profile_json to update',
      });
      return;
    }

    const existing = await findByClientId(clientId);
    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Summary not found for this client' });
      return;
    }

    // Merge: incoming fields override existing ones
    const mergedSummary = summary_json
      ? { ...(existing.summary_json as Record<string, unknown>), ...summary_json }
      : undefined;

    const mergedBrandProfile = brand_profile_json
      ? { ...(existing.brand_profile_json as Record<string, unknown>), ...brand_profile_json }
      : undefined;

    const updated = await patchSummaryFields(clientId, {
      summaryJson: mergedSummary,
      brandProfileJson: mergedBrandProfile,
    });

    res.status(200).json({ data: updated });
  }
);

// ── POST /api/summary/:clientId/approve ───────────────────────────────────────

export const approveSummary = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;
    const user = req.user!;

    const existing = await findByClientId(clientId);
    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Summary not found for this client' });
      return;
    }

    const approved = await approve(clientId, user.userId);
    if (!approved) {
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to approve summary' });
      return;
    }

    // Emit event
    eventBus.emit('summary:approved', {
      summaryId: approved.id,
      clientId,
      approvedBy: user.userId,
    });

    logger.info(`Summary approved for client ${clientId} by user ${user.userId}`);

    res.status(200).json({ data: approved });
  }
);

// ── GET /api/summary/:clientId/diff ───────────────────────────────────────────

export const getSummaryDiff = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;

    const summary = await findByClientId(clientId);
    if (!summary) {
      res.status(404).json({ error: 'Not Found', message: 'Summary not found for this client' });
      return;
    }

    res.status(200).json({
      data: {
        previous_summary_json: summary.previous_summary_json ?? null,
        previous_brand_profile_json: summary.previous_brand_profile_json ?? null,
        current_summary_json: summary.summary_json,
        current_brand_profile_json: summary.brand_profile_json,
        auto_refreshed_at: summary.auto_refreshed_at ?? null,
      },
    });
  }
);

// Named export alias so old route import `generateSummary` resolves correctly
export { generateSummaryHandler as generateSummary };
