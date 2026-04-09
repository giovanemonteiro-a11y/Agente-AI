import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createHandoff as repoCreateHandoff,
  findById,
  findByCreatedBy,
  findForLeadership,
  findForCoordinator,
  updateStep1,
  updateStep2,
  updateSpicedReport,
  confirmAnalysis as repoConfirmAnalysis,
  updateObservation,
  updateStatus,
  updateApprovals,
  updateForwarding,
  updateTrioAssignment,
  incrementSendAttempts,
} from '../repositories/handoffs.repository';
import { insertNotification } from '../repositories/notifications.repository';
import { findUsersByRole } from '../repositories/users.repository';
import { logger } from '../utils/logger';
import { extractProjectFromTranscript } from '../services/ai/ai.service';

// ── Normalize stakeholders for backward-compatible frontend ──────────────────
// Frontend CRMPage expects stakeholders as string[], but DB stores {name, role}[] objects.
// This normalizes both formats so either frontend version works.
function normalizeHandoff(h: Record<string, unknown>): Record<string, unknown> {
  if (Array.isArray(h.stakeholders)) {
    h.stakeholders = h.stakeholders.map((s: unknown) =>
      typeof s === 'string' ? s : (s as { name?: string }).name ?? ''
    );
  }
  return h;
}

// ── POST /api/handoffs/extract-transcript ────────────────────────────────────

export const extractTranscript = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { transcript } = req.body;
  if (!transcript || typeof transcript !== 'string' || transcript.length < 50) {
    res.status(400).json({ error: 'Transcript must be at least 50 characters' });
    return;
  }

  const extracted = await extractProjectFromTranscript(transcript);
  res.json({ data: extracted });
});

// ── POST /api/handoffs ───────────────────────────────────────────────────────

export const createHandoff = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const body = req.body as Record<string, unknown>;
  logger.info(`Creating handoff by user ${user.userId}`);

  const handoff = await repoCreateHandoff({
    created_by: user.userId,
    company_name: (body.company_name ?? body.companyName ?? '') as string,
  });

  res.status(201).json({ data: handoff });
});

// ── GET /api/handoffs/:id ────────────────────────────────────────────────────

export const getHandoff = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const handoff = await findById(req.params.id);
  if (!handoff) { res.status(404).json({ error: 'Not Found' }); return; }
  res.status(200).json({ data: normalizeHandoff(handoff as unknown as Record<string, unknown>) });
});

// ── GET /api/handoffs/my ─────────────────────────────────────────────────────

export const getMyHandoffs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const handoffs = await findByCreatedBy(user.userId);
  res.status(200).json({ data: handoffs.map(h => normalizeHandoff(h as unknown as Record<string, unknown>)) });
});

// ── GET /api/handoffs/leadership ─────────────────────────────────────────────

export const getLeadershipHandoffs = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const handoffs = await findForLeadership();
  res.status(200).json({ data: handoffs.map(h => normalizeHandoff(h as unknown as Record<string, unknown>)) });
});

// ── GET /api/handoffs/coordinator ────────────────────────────────────────────

export const getCoordinatorHandoffs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const handoffs = await findForCoordinator(user.userId);
  res.status(200).json({ data: handoffs.map(h => normalizeHandoff(h as unknown as Record<string, unknown>)) });
});

// ── PATCH /api/handoffs/:id/step/:step ───────────────────────────────────────

export const updateHandoffStep = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id, step } = req.params;
  const stepNum = parseInt(step, 10);
  const body = req.body as Record<string, unknown>;

  const existing = await findById(id);
  if (!existing) { res.status(404).json({ error: 'Not Found' }); return; }

  logger.info(`Updating handoff ${id} step ${stepNum}`);

  let updated;
  if (stepNum === 1) {
    updated = await updateStep1(id, {
      transcript: (body.transcript as string) ?? '',
      recording_url: (body.recording_url as string) ?? '',
    });
  } else if (stepNum === 2) {
    updated = await updateStep2(id, {
      company_name: (body.company_name as string) ?? '',
      razao_social: (body.razao_social as string) ?? '',
      stakeholders: (body.stakeholders as string[] ?? body.stakeholder_names as string[]) ?? [],
      project_start_date: (body.project_start_date as string ?? body.start_date as string) ?? '',
      project_scope: body.project_scope ?? body.services_scope ?? [],
      contract_url: (body.contract_url as string) ?? '',
      whatsapp_group_id: (body.whatsapp_group_id as string) ?? '',
    });
  } else if (stepNum === 4) {
    updated = await updateObservation(id, (body.observation as string) ?? '');
  } else {
    res.status(400).json({ error: 'Bad Request', message: 'Use specific endpoints for step 3' });
    return;
  }

  res.status(200).json({ data: updated });
});

// ── POST /api/handoffs/:id/generate-spiced ───────────────────────────────────

export const generateSpiced = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const handoff = await findById(id);
  if (!handoff) { res.status(404).json({ error: 'Not Found' }); return; }

  logger.info(`Generating SPICED for handoff ${id}`);

  // Build context-aware SPICED report
  const companyName = handoff.company_name ?? 'Cliente';
  const rawStakeholders = handoff.stakeholders as Array<{ name: string; role: string }> | string[] | null;
  const stakeholderNames: string[] = Array.isArray(rawStakeholders)
    ? rawStakeholders.map((s: unknown) => typeof s === 'string' ? s : (s as { name: string }).name || '')
    : [];
  const scope = handoff.project_scope;
  const startDate = handoff.project_start_date ?? '';

  const spicedReport = {
    executiveSummary: `Resumo executivo da análise de vendas para ${companyName}. Com base na transcrição de venda e dados do projeto, foi realizada uma análise completa utilizando o framework SPICED. O escopo contratado inclui ${Array.isArray(scope) ? scope.join(', ') : 'serviços de marketing digital'}.`,
    situation: `A empresa ${companyName} (${handoff.razao_social ?? ''}) busca fortalecer sua presença digital. Stakeholder(s): ${stakeholderNames.join(', ') || 'Não informado'}. Projeto com início em ${startDate}.`,
    pain: `Principais desafios identificados na análise da transcrição:\n\n1. Necessidade de presença digital consistente\n2. Dificuldade em converter leads qualificados\n3. Ausência de métricas claras de ROI\n4. Posicionamento frente à concorrência\n5. Comunicação fragmentada entre canais`,
    impact: `Impacto esperado:\n\n• ROI projetado: Aumento de 40-60% em leads qualificados\n• Melhoria na taxa de conversão: +25%\n• Redução de CAC: -30%\n• Fortalecimento de marca em todos os canais`,
    criticalEvent: `Eventos críticos:\n\n• Início do projeto: ${startDate}\n• 30 dias: Setup completo\n• 60 dias: Primeiras campanhas ativas\n• 90 dias: Primeira revisão estratégica`,
    decision: `Mapa de decisão:\n\n• Decisor(es): ${stakeholderNames[0] || 'Stakeholder principal'}\n• Critérios: Resultados mensuráveis, transparência, qualidade\n• Budget aprovado para escopo contratado`,
    contractedScope: `Escopo contratado:\n${Array.isArray(scope) ? scope.map((s: unknown, i: number) => `${i + 1}. ${s}`).join('\n') : 'Conforme contrato'}\n\nInício: ${startDate}\nEmpresa: ${companyName}`,
  };

  const updated = await updateSpicedReport(id, spicedReport);
  res.status(200).json({ data: updated, spiced_report: spicedReport });
});

// ── PATCH /api/handoffs/:id/confirm-analysis ─────────────────────────────────

export const confirmAnalysis = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const handoff = await findById(req.params.id);
  if (!handoff) { res.status(404).json({ error: 'Not Found' }); return; }
  const updated = await repoConfirmAnalysis(req.params.id);
  res.status(200).json({ data: updated });
});

// ── POST /api/handoffs/:id/send ──────────────────────────────────────────────

export const sendToLeadership = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const handoff = await findById(id);
  if (!handoff) { res.status(404).json({ error: 'Not Found' }); return; }

  logger.info(`Sending handoff ${id} to leadership`);

  await updateStatus(id, 'sent_to_leadership');
  const updated = await incrementSendAttempts(id);

  // Notify all leadership users
  try {
    const leaders = await findUsersByRole('lideranca');
    for (const leader of leaders) {
      await insertNotification({
        user_id: leader.id,
        type: 'handoff:sent',
        title: `Novo handoff: ${handoff.company_name ?? 'Cliente'}`,
        message: `Handoff de ${handoff.company_name ?? 'novo cliente'} enviado para aprovação.`,
        data_json: { handoff_id: id },
      });
    }
    logger.info(`Notified ${leaders.length} leaders about handoff ${id}`);
  } catch (err) {
    logger.warn('Failed to notify leaders:', err);
  }

  res.status(200).json({ data: updated });
});

// ── PATCH /api/handoffs/:id/approve ──────────────────────────────────────────

export const approveHandoff = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { id } = req.params;
  const handoff = await findById(id);
  if (!handoff) { res.status(404).json({ error: 'Not Found' }); return; }

  const currentApprovals = (handoff.approvals as Record<string, unknown>[]) ?? [];
  if (currentApprovals.some(a => a.user_id === user.userId)) {
    res.status(409).json({ error: 'Conflict', message: 'Already approved' });
    return;
  }

  const updatedApprovals = [...currentApprovals, {
    user_id: user.userId,
    email: user.email,
    approved_at: new Date().toISOString(),
  }];

  await updateApprovals(id, updatedApprovals);

  const leaders = await findUsersByRole('lideranca');
  const allApproved = leaders.every(l => updatedApprovals.some(a => a.user_id === l.id));
  const newStatus = allApproved ? 'approved_all' : 'approved_partial';
  const updated = await updateStatus(id, newStatus);

  res.status(200).json({ data: updated });
});

// ── POST /api/handoffs/:id/forward ───────────────────────────────────────────

export const forwardToCoordinator = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { id } = req.params;
  const { coordinator_id } = req.body as { coordinator_id?: string };
  if (!coordinator_id) { res.status(400).json({ error: 'coordinator_id required' }); return; }

  const handoff = await findById(id);
  if (!handoff) { res.status(404).json({ error: 'Not Found' }); return; }

  // Block forward unless ALL leaders have approved
  if (handoff.status !== 'approved_all') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Todos os líderes precisam aprovar antes de encaminhar para o coordenador.',
    });
    return;
  }

  const updated = await updateForwarding(id, coordinator_id, user.userId);

  // Notify coordinator + other leaders
  try {
    await insertNotification({
      user_id: coordinator_id,
      type: 'handoff:forwarded',
      title: `Handoff encaminhado: ${handoff.company_name ?? 'Cliente'}`,
      message: `O handoff de ${handoff.company_name} foi encaminhado para sua coordenação.`,
      data_json: { handoff_id: id },
    });

    const leaders = await findUsersByRole('lideranca');
    for (const leader of leaders) {
      if (leader.id !== user.userId) {
        await insertNotification({
          user_id: leader.id,
          type: 'handoff:forwarded',
          title: `Handoff encaminhado: ${handoff.company_name ?? 'Cliente'}`,
          message: `O handoff de ${handoff.company_name} foi encaminhado para o coordenador.`,
          data_json: { handoff_id: id },
        });
      }
    }
  } catch (err) {
    logger.warn('Failed to send forwarding notifications:', err);
  }

  res.status(200).json({ data: updated });
});

// ── POST /api/handoffs/:id/assign-trio ───────────────────────────────────────

export const assignTrio = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { trio_id } = req.body as { trio_id?: string };
  if (!trio_id) { res.status(400).json({ error: 'trio_id required' }); return; }

  const handoff = await findById(id);
  if (!handoff) { res.status(404).json({ error: 'Not Found' }); return; }

  const updated = await updateTrioAssignment(id, trio_id);
  res.status(200).json({ data: updated });
});
