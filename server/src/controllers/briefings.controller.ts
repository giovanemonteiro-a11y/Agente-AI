import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { findClientById } from '../repositories/clients.repository';
import { findLatestByClientId } from '../repositories/strategies.repository';
import { findMeetingsByClientId } from '../repositories/meetings.repository';
import { findByClientId as findCohortsByClientId } from '../repositories/cohorts.repository';
import {
  findByClientAndType as findStrategicSystems,
} from '../repositories/strategicSystems.repository';
import {
  findByClientId,
  findById,
  create,
  updateSentAt,
  updateMondayTaskId,
} from '../repositories/briefings.repository';
import { findUserById } from '../repositories/users.repository';
import { generateBriefing as aiGenerateBriefing, PromptContext } from '../services/ai/ai.service';
import { createItem } from '../services/monday.service';
import { pushNotificationToUser } from '../services/notification.service';
import { logger } from '../utils/logger';
import { BriefingType, UserRole } from '../types/index';

// ── Types ─────────────────────────────────────────────────────────────────────

type ClientRow = {
  id: string;
  name: string;
  segment?: string | null;
  services_scope?: string[] | null;
};

type MeetingRow = {
  id: string;
  transcript_text?: string | null;
};

type CohortRow = {
  characteristic_phrase: string;
  anthropological_description: string;
  demographic_profile_json: Record<string, unknown>;
  behavior_lifestyle: string;
  audience_size: string;
  reach_potential: string;
  triggers: string[];
  alternative_solutions: string[];
  indicators: string[];
  editorial_lines: string[];
  [key: string]: unknown;
};

// ── Role access helpers ────────────────────────────────────────────────────────

const ROLE_BRIEFING_TYPE_MAP: Partial<Record<UserRole, BriefingType>> = {
  designer: 'designer',
  gestor_trafego: 'traffic',
};

/**
 * Returns which briefing type a role is restricted to.
 * super_admin, lideranca, coordenador and account can see all types (returns undefined = no filter).
 * Other roles are restricted to their mapped type or see nothing.
 */
function getAllowedTypeForRole(role: UserRole): BriefingType | null | undefined {
  if (role === 'super_admin' || role === 'lideranca' || role === 'coordenador' || role === 'account') return undefined; // see all
  return ROLE_BRIEFING_TYPE_MAP[role] ?? null;
}

// ── Context builder ───────────────────────────────────────────────────────────

async function buildBriefingContext(clientId: string, client: ClientRow): Promise<PromptContext> {
  const [strategy, meetings, cohorts, creativeSystems, campaignSystems, copySystems] =
    await Promise.all([
      findLatestByClientId(clientId),
      findMeetingsByClientId(clientId),
      findCohortsByClientId(clientId),
      findStrategicSystems(clientId, 'creatives_per_phase'),
      findStrategicSystems(clientId, 'campaign_structure'),
      findStrategicSystems(clientId, 'copy_manual'),
    ]);

  const meetingRows = meetings as MeetingRow[];
  const meetingTranscripts = meetingRows
    .filter((m) => m.transcript_text)
    .map((m) => m.transcript_text as string);

  const cohortRows = cohorts as unknown as CohortRow[];

  // Build strategic system context blob
  const strategicContext: Record<string, unknown>[] = [
    ...creativeSystems.map((s) => ({ type: s.type, data: s.content_json })),
    ...campaignSystems.map((s) => ({ type: s.type, data: s.content_json })),
    ...copySystems.map((s) => ({ type: s.type, data: s.content_json })),
  ];

  return {
    clientName: client.name,
    clientSegment: client.segment ?? undefined,
    clientServicesScope: client.services_scope ?? undefined,
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
    cohorts: cohortRows as unknown as Array<Record<string, unknown>>,
    campaignReports: strategicContext,
  };
}

// ── GET /api/briefings/:clientId ──────────────────────────────────────────────

export const listBriefings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const requestingUser = req.user;

  if (!requestingUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const client = (await findClientById(clientId)) as ClientRow | null | undefined;
  if (!client) {
    res.status(404).json({ error: 'Not Found', message: 'Client not found' });
    return;
  }

  const allowedType = getAllowedTypeForRole(requestingUser.role);

  // Roles without a mapped briefing type have no access
  if (allowedType === null) {
    res.status(200).json({ data: [] });
    return;
  }

  // Optional ?type= query param for manual filtering (account/admin only)
  let typeFilter: BriefingType | undefined;
  if (req.query.type && typeof req.query.type === 'string') {
    typeFilter = req.query.type as BriefingType;
  }

  // Role-based filter takes precedence
  const effectiveType = allowedType ?? typeFilter;

  const briefings = await findByClientId(clientId, effectiveType);

  res.status(200).json({ data: briefings });
});

// ── POST /api/briefings/:clientId/generate ────────────────────────────────────

export const generateBriefingHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;
    const { type, designerScope } = req.body as {
      type?: BriefingType;
      designerScope?: string;
    };

    if (!type || !['designer', 'traffic', 'account', 'site'].includes(type)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'type must be one of: designer, traffic, account, site',
      });
      return;
    }

    const client = (await findClientById(clientId)) as ClientRow | null | undefined;
    if (!client) {
      res.status(404).json({ error: 'Not Found', message: 'Client not found' });
      return;
    }

    const context = await buildBriefingContext(clientId, client);

    logger.info(
      `Generating ${type} briefing for client ${clientId} (scope: ${designerScope ?? 'none'})`
    );

    const contentJson = await aiGenerateBriefing(context, type, designerScope);

    const briefing = await create({
      client_id: clientId,
      type,
      content_json: contentJson as Record<string, unknown>,
      source_sprints: context.sprintData?.length
        ? JSON.stringify(context.sprintData)
        : null,
      source_whatsapp: context.whatsappMessages?.length
        ? context.whatsappMessages.join('\n')
        : null,
    });

    res.status(201).json({ data: briefing });
  }
);

// ── GET /api/briefings/:clientId/:briefingId ──────────────────────────────────

export const getBriefingById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId, briefingId } = req.params;
    const requestingUser = req.user;

    if (!requestingUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const briefing = await findById(briefingId);
    if (!briefing || briefing.client_id !== clientId) {
      res.status(404).json({ error: 'Not Found', message: 'Briefing not found' });
      return;
    }

    // Role access check
    const allowedType = getAllowedTypeForRole(requestingUser.role);
    if (allowedType === null) {
      res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
      return;
    }
    if (allowedType !== undefined && briefing.type !== allowedType) {
      res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
      return;
    }

    res.status(200).json({ data: briefing });
  }
);

// ── POST /api/briefings/:clientId/:briefingId/send ────────────────────────────

export const sendBriefing = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId, briefingId } = req.params;

  const briefing = await findById(briefingId);
  if (!briefing || briefing.client_id !== clientId) {
    res.status(404).json({ error: 'Not Found', message: 'Briefing not found' });
    return;
  }

  if (briefing.sent_at) {
    res.status(409).json({ error: 'Conflict', message: 'Briefing already sent' });
    return;
  }

  const updated = await updateSentAt(briefingId);

  // Fire SSE notification to assigned user if any
  if (briefing.assigned_to_user_id) {
    try {
      const assignee = await findUserById(briefing.assigned_to_user_id);
      if (assignee) {
        pushNotificationToUser(briefing.assigned_to_user_id, {
          type: 'briefing_sent',
          title: 'Novo briefing disponível',
          message: `Um briefing do tipo "${briefing.type}" foi enviado para você.`,
          data: { briefingId, clientId },
        });
      }
    } catch (err) {
      logger.warn('Failed to push notification for briefing send:', err);
    }
  }

  res.status(200).json({ data: updated });
});

// ── POST /api/briefings/:clientId/:briefingId/push-monday ─────────────────────

export const pushBriefingToMonday = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId, briefingId } = req.params;
    const { boardId, groupId } = req.body as { boardId?: string; groupId?: string };

    const briefing = await findById(briefingId);
    if (!briefing || briefing.client_id !== clientId) {
      res.status(404).json({ error: 'Not Found', message: 'Briefing not found' });
      return;
    }

    if (briefing.monday_task_id) {
      res.status(409).json({
        error: 'Conflict',
        message: 'Briefing already pushed to Monday.com',
        monday_task_id: briefing.monday_task_id,
      });
      return;
    }

    const client = (await findClientById(clientId)) as ClientRow | null | undefined;
    const clientName = client?.name ?? 'Cliente';

    const contentJson = briefing.content_json as Record<string, unknown>;
    const title =
      typeof contentJson.title === 'string' ? contentJson.title : `Briefing ${briefing.type}`;

    const itemName = `[${briefing.type.toUpperCase()}] ${title} — ${clientName}`;

    const effectiveBoardId = boardId ?? process.env.MONDAY_DEFAULT_BOARD_ID ?? 'mock-board';
    const effectiveGroupId = groupId ?? process.env.MONDAY_DEFAULT_GROUP_ID ?? 'topics';

    const created = await createItem(effectiveBoardId, effectiveGroupId, itemName, {
      text: `Tipo: ${briefing.type} | Cliente: ${clientName} | Gerado: ${briefing.created_at}`,
    });

    const updated = await updateMondayTaskId(briefingId, created.id);

    res.status(200).json({
      data: updated,
      monday_task_id: created.id,
    });
  }
);

// ── Legacy stub exports (kept for backwards compat with old routes) ────────────

// Re-export handler under old name so old imports still resolve
export { generateBriefingHandler as generateBriefing };

export const createBriefing = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    res.status(410).json({
      error: 'Gone',
      message: 'Manual creation removed. Use POST /generate instead.',
    });
  }
);

export const updateBriefing = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Briefings are immutable. Generate a new version instead.',
    });
  }
);
