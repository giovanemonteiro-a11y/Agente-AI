import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { findClientById } from '../repositories/clients.repository';
import {
  findByClientId,
  findById,
  upsertAll,
  updateOne,
} from '../repositories/cohorts.repository';
import {
  findEmpathyMapByCohort,
  upsert as upsertStrategicSystem,
  deleteByClientAndType,
} from '../repositories/strategicSystems.repository';
import { findLatestByClientId } from '../repositories/strategies.repository';
import { findMeetingsByClientId } from '../repositories/meetings.repository';
import {
  generateCohorts as aiGenerateCohorts,
  generateEmpathyMap,
  PromptContext,
  CohortData,
} from '../services/ai/ai.service';
import { logger } from '../utils/logger';

// Services scope that enable cohorts
const COHORT_SCOPES = ['social_media', 'trafego'] as const;

function hasCohortsScope(servicesScope: string[] | undefined): boolean {
  if (!servicesScope?.length) return false;
  return servicesScope.some((s) => COHORT_SCOPES.includes(s as (typeof COHORT_SCOPES)[number]));
}

type ClientRow = {
  id: string;
  name: string;
  segment?: string | null;
  services_scope?: string[] | null;
};

// ── GET /api/cohorts/:clientId ────────────────────────────────────────────────

export const listCohorts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;

  const client = (await findClientById(clientId)) as ClientRow | null | undefined;
  if (!client) {
    res.status(404).json({ error: 'Not Found', message: 'Client not found' });
    return;
  }

  if (!hasCohortsScope(client.services_scope ?? undefined)) {
    res.status(200).json({ data: [], scopeNotApplicable: true });
    return;
  }

  const cohorts = await findByClientId(clientId);

  // Attach empathy maps
  const cohortsWithMaps = await Promise.all(
    cohorts.map(async (cohort) => {
      const empathyMap = await findEmpathyMapByCohort(clientId, cohort.id);
      return {
        ...cohort,
        empathy_map: empathyMap ? empathyMap.content_json : null,
      };
    })
  );

  res.status(200).json({ data: cohortsWithMaps, scopeNotApplicable: false });
});

// ── POST /api/cohorts/:clientId/generate ─────────────────────────────────────

export const generateCohortsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;

    const client = (await findClientById(clientId)) as ClientRow | null | undefined;
    if (!client) {
      res.status(404).json({ error: 'Not Found', message: 'Client not found' });
      return;
    }

    if (!hasCohortsScope(client.services_scope ?? undefined)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Client scope does not include social_media or trafego',
      });
      return;
    }

    // Fetch supporting data
    const strategy = await findLatestByClientId(clientId);
    const meetings = (await findMeetingsByClientId(clientId)) as Array<{
      transcript_text?: string | null;
    }>;
    const meetingTranscripts = meetings
      .filter((m) => m.transcript_text)
      .map((m) => m.transcript_text as string);

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
    };

    // Generate cohorts via AI
    const cohortData: CohortData[] = await aiGenerateCohorts(context);

    // Map AI output to DB schema
    const cohortsForDb = cohortData.map((c) => ({
      characteristic_phrase: c.characteristicPhrase,
      anthropological_description: c.anthropologicalDescription,
      demographic_profile_json: c.demographicProfile as unknown as Record<string, unknown>,
      behavior_lifestyle: c.behaviorLifestyle,
      audience_size: c.audienceSize,
      reach_potential: c.reachPotential,
      triggers: c.triggers,
      alternative_solutions: c.alternativeSolutions,
      indicators: c.indicators,
      editorial_lines: c.editorialLines,
    }));

    // Delete existing empathy maps then upsert cohorts atomically
    await deleteByClientAndType(clientId, 'empathy_map');
    const savedCohorts = await upsertAll(clientId, cohortsForDb);

    logger.info(
      `Generated ${savedCohorts.length} cohorts for client ${clientId}`
    );

    // Generate empathy maps for each cohort
    const cohortsWithMaps = await Promise.all(
      savedCohorts.map(async (savedCohort, idx) => {
        try {
          const empathyMapData = await generateEmpathyMap(cohortData[idx]);
          const savedMap = await upsertStrategicSystem({
            client_id: clientId,
            cohort_id: savedCohort.id,
            type: 'empathy_map',
            content_json: empathyMapData as unknown as Record<string, unknown>,
          });
          return { ...savedCohort, empathy_map: savedMap.content_json };
        } catch (err) {
          logger.error(`Failed to generate empathy map for cohort ${savedCohort.id}:`, err);
          return { ...savedCohort, empathy_map: null };
        }
      })
    );

    res.status(200).json({ data: cohortsWithMaps });
  }
);

// ── PATCH /api/cohorts/:clientId/:cohortId ────────────────────────────────────

export const updateCohort = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId, cohortId } = req.params;
  const body = req.body as Record<string, unknown>;

  const existing = await findById(cohortId);
  if (!existing || existing.client_id !== clientId) {
    res.status(404).json({ error: 'Not Found', message: 'Cohort not found' });
    return;
  }

  const allowedFields = [
    'characteristic_phrase',
    'anthropological_description',
    'demographic_profile_json',
    'behavior_lifestyle',
    'audience_size',
    'reach_potential',
    'triggers',
    'alternative_solutions',
    'indicators',
    'editorial_lines',
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'Bad Request', message: 'No valid fields to update' });
    return;
  }

  const updated = await updateOne(cohortId, updates as Parameters<typeof updateOne>[1]);
  res.status(200).json({ data: updated });
});

// ── GET /api/cohorts/:clientId/:cohortId/empathy-map ─────────────────────────

export const getEmpathyMap = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId, cohortId } = req.params;

  const cohort = await findById(cohortId);
  if (!cohort || cohort.client_id !== clientId) {
    res.status(404).json({ error: 'Not Found', message: 'Cohort not found' });
    return;
  }

  const empathyMap = await findEmpathyMapByCohort(clientId, cohortId);
  if (!empathyMap) {
    res.status(200).json({ data: null });
    return;
  }

  res.status(200).json({ data: empathyMap });
});

// ── POST /api/cohorts/:clientId/:cohortId/empathy-map/generate ────────────────

export const generateEmpathyMapHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { clientId, cohortId } = req.params;

    const cohort = await findById(cohortId);
    if (!cohort || cohort.client_id !== clientId) {
      res.status(404).json({ error: 'Not Found', message: 'Cohort not found' });
      return;
    }

    // Build CohortData from the DB row
    const cohortData: CohortData = {
      characteristicPhrase: cohort.characteristic_phrase,
      anthropologicalDescription: cohort.anthropological_description,
      demographicProfile: cohort.demographic_profile_json as unknown as CohortData['demographicProfile'],
      behaviorLifestyle: cohort.behavior_lifestyle,
      audienceSize: cohort.audience_size,
      reachPotential: cohort.reach_potential,
      triggers: cohort.triggers,
      alternativeSolutions: cohort.alternative_solutions,
      indicators: cohort.indicators,
      editorialLines: cohort.editorial_lines,
    };

    const empathyMapData = await generateEmpathyMap(cohortData);

    const saved = await upsertStrategicSystem({
      client_id: clientId,
      cohort_id: cohortId,
      type: 'empathy_map',
      content_json: empathyMapData as unknown as Record<string, unknown>,
    });

    logger.info(`Generated empathy map for cohort ${cohortId}`);

    res.status(200).json({ data: saved });
  }
);

// ── Legacy stubs ─────────────────────────────────────────────────────────────

export const createCohort = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST /generate instead' });
});

export const getCohortById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const cohort = await findById(id);
  if (!cohort) {
    res.status(404).json({ error: 'Not Found', message: 'Cohort not found' });
    return;
  }
  res.status(200).json({ data: cohort });
});

export const deleteCohort = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(405).json({ error: 'Method Not Allowed', message: 'Cohorts are managed via generate' });
});
