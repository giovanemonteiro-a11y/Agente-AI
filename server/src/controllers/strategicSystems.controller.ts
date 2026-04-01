import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { findClientById } from '../repositories/clients.repository';
import {
  findAllByClient,
  findByClientAndType,
  upsert as upsertStrategicSystem,
} from '../repositories/strategicSystems.repository';
import { findLatestByClientId } from '../repositories/strategies.repository';
import { findMeetingsByClientId } from '../repositories/meetings.repository';
import { findByClientId as findCohortsByClientId } from '../repositories/cohorts.repository';
import {
  generateStrategicSystem,
  PromptContext,
  CohortData,
  StrategicSystemType,
  SYSTEM_SCOPE_MAP,
} from '../services/ai/ai.service';
import { logger } from '../utils/logger';

// ── All system types (Phase 6, excluding empathy_map which is Phase 5) ─────────

const ALL_SYSTEM_TYPES: StrategicSystemType[] = [
  'content_arch',
  'format_proportion',
  'theme_proportion',
  'campaign_structure',
  'creatives_per_phase',
  'lead_funnel',
  'mql_funnel',
  'editorial_calendar',
  'copy_manual',
  'storytelling_storydoing',
  'graphic_approach',
];

type ClientRow = {
  id: string;
  name: string;
  segment?: string | null;
  services_scope?: string[] | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidSystemType(type: string): type is StrategicSystemType {
  return ALL_SYSTEM_TYPES.includes(type as StrategicSystemType);
}

/**
 * Checks if the client's services_scope includes at least one scope
 * required by the system type. Returns true if no scope constraint applies.
 */
function isScopeApplicable(type: StrategicSystemType, servicesScope: string[] | null | undefined): boolean {
  const requiredScopes = SYSTEM_SCOPE_MAP[type];
  if (!requiredScopes || requiredScopes.length === 0) return true;
  if (!servicesScope || servicesScope.length === 0) return false;
  return requiredScopes.some((scope) => servicesScope.includes(scope));
}

/**
 * Build a PromptContext from a client row + its strategy + meeting transcripts + cohorts.
 */
async function buildContext(
  client: ClientRow,
  clientId: string
): Promise<{ context: PromptContext; cohortDataList: CohortData[] }> {
  const strategy = await findLatestByClientId(clientId);
  const meetings = (await findMeetingsByClientId(clientId)) as Array<{
    transcript_text?: string | null;
  }>;
  const meetingTranscripts = meetings
    .filter((m) => m.transcript_text)
    .map((m) => m.transcript_text as string);

  // Load cohorts for AI context
  const dbCohorts = await findCohortsByClientId(clientId);
  const cohortDataList: CohortData[] = dbCohorts.map((c) => ({
    characteristicPhrase: c.characteristic_phrase,
    anthropologicalDescription: c.anthropological_description,
    demographicProfile: c.demographic_profile_json as unknown as CohortData['demographicProfile'],
    behaviorLifestyle: c.behavior_lifestyle,
    audienceSize: c.audience_size,
    reachPotential: c.reach_potential,
    triggers: c.triggers,
    alternativeSolutions: c.alternative_solutions,
    indicators: c.indicators,
    editorialLines: c.editorial_lines,
  }));

  const context: PromptContext = {
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
    cohorts: dbCohorts as unknown as Array<Record<string, unknown>>,
  };

  return { context, cohortDataList };
}

// ── GET /api/systems/:clientId ────────────────────────────────────────────────

export const listSystems = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;

  const client = (await findClientById(clientId)) as ClientRow | null | undefined;
  if (!client) {
    res.status(404).json({ error: 'Not Found', message: 'Client not found' });
    return;
  }

  const systems = await findAllByClient(clientId);

  // Build a map of type → system, including scope metadata
  const systemMap: Record<string, unknown> = {};
  for (const system of systems) {
    systemMap[system.type] = system;
  }

  // Also include scope applicability info for each type
  const typeMeta = ALL_SYSTEM_TYPES.map((type) => ({
    type,
    scopeApplicable: isScopeApplicable(type, client.services_scope),
    generated: type in systemMap,
    system: systemMap[type] ?? null,
  }));

  res.status(200).json({ data: typeMeta });
});

// ── GET /api/systems/:clientId/:type ──────────────────────────────────────────

export const getSystem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId, type } = req.params;

  if (!isValidSystemType(type)) {
    res.status(400).json({ error: 'Bad Request', message: `Invalid system type: ${type}` });
    return;
  }

  const client = (await findClientById(clientId)) as ClientRow | null | undefined;
  if (!client) {
    res.status(404).json({ error: 'Not Found', message: 'Client not found' });
    return;
  }

  const systems = await findByClientAndType(clientId, type, null);
  const system = systems[0] ?? null;

  res.status(200).json({ data: system });
});

// ── POST /api/systems/:clientId/:type/generate ────────────────────────────────

export const generateSystem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId, type } = req.params;

  if (!isValidSystemType(type)) {
    res.status(400).json({ error: 'Bad Request', message: `Invalid system type: ${type}` });
    return;
  }

  const client = (await findClientById(clientId)) as ClientRow | null | undefined;
  if (!client) {
    res.status(404).json({ error: 'Not Found', message: 'Client not found' });
    return;
  }

  if (!isScopeApplicable(type, client.services_scope)) {
    res.status(403).json({
      error: 'Forbidden',
      message: `System type '${type}' is not applicable to client's services scope`,
    });
    return;
  }

  const { context, cohortDataList } = await buildContext(client, clientId);

  logger.info(`Generating strategic system '${type}' for client ${clientId}`);
  const contentJson = await generateStrategicSystem(context, type, cohortDataList);

  const saved = await upsertStrategicSystem({
    client_id: clientId,
    cohort_id: null,
    type,
    scope: (client.services_scope ?? []).join(',') || null,
    content_json: contentJson as Record<string, unknown>,
  });

  logger.info(`Saved strategic system '${type}' for client ${clientId}`);
  res.status(200).json({ data: saved });
});

// ── PATCH /api/systems/:clientId/:type ────────────────────────────────────────

export const updateSystem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId, type } = req.params;
  const body = req.body as Record<string, unknown>;

  if (!isValidSystemType(type)) {
    res.status(400).json({ error: 'Bad Request', message: `Invalid system type: ${type}` });
    return;
  }

  const client = (await findClientById(clientId)) as ClientRow | null | undefined;
  if (!client) {
    res.status(404).json({ error: 'Not Found', message: 'Client not found' });
    return;
  }

  if (!body.content_json || typeof body.content_json !== 'object') {
    res.status(400).json({ error: 'Bad Request', message: 'content_json is required and must be an object' });
    return;
  }

  const existing = await findByClientAndType(clientId, type, null);
  if (existing.length === 0) {
    res.status(404).json({ error: 'Not Found', message: `No '${type}' system found for this client` });
    return;
  }

  const saved = await upsertStrategicSystem({
    client_id: clientId,
    cohort_id: null,
    type,
    scope: (client.services_scope ?? []).join(',') || null,
    content_json: body.content_json as Record<string, unknown>,
  });

  res.status(200).json({ data: saved });
});

// ── POST /api/systems/:clientId/generate-all ─────────────────────────────────

export const generateAllSystems = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;

  const client = (await findClientById(clientId)) as ClientRow | null | undefined;
  if (!client) {
    res.status(404).json({ error: 'Not Found', message: 'Client not found' });
    return;
  }

  const { context, cohortDataList } = await buildContext(client, clientId);

  // Filter to applicable types only
  const applicableTypes = ALL_SYSTEM_TYPES.filter((type) =>
    isScopeApplicable(type, client.services_scope)
  );

  logger.info(
    `Generating all ${applicableTypes.length} strategic systems for client ${clientId} (scope: ${client.services_scope?.join(', ') ?? 'none'})`
  );

  const results: Array<{ type: string; status: 'success' | 'error'; system?: unknown; error?: string }> = [];

  // Run sequentially to avoid rate limits
  for (const type of applicableTypes) {
    try {
      logger.info(`Generating system '${type}' (${applicableTypes.indexOf(type) + 1}/${applicableTypes.length})`);
      const contentJson = await generateStrategicSystem(context, type, cohortDataList);

      const saved = await upsertStrategicSystem({
        client_id: clientId,
        cohort_id: null,
        type,
        scope: (client.services_scope ?? []).join(',') || null,
        content_json: contentJson as Record<string, unknown>,
      });

      results.push({ type, status: 'success', system: saved });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to generate system '${type}' for client ${clientId}: ${msg}`);
      results.push({ type, status: 'error', error: msg });
    }
  }

  const successCount = results.filter((r) => r.status === 'success').length;
  logger.info(`Generated ${successCount}/${applicableTypes.length} systems for client ${clientId}`);

  res.status(200).json({
    data: results,
    summary: {
      total: applicableTypes.length,
      success: successCount,
      error: results.filter((r) => r.status === 'error').length,
      skipped: ALL_SYSTEM_TYPES.length - applicableTypes.length,
    },
  });
});
