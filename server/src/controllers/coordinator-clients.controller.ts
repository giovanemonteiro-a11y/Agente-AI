import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { insertNotification } from '../repositories/notifications.repository';
import { findUsersByRole } from '../repositories/users.repository';

// ── GET /api/coordinator/clients ─────────────────────────────────────────────

export const listCoordinatorClients = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { status, client_type, in_tratativa } = req.query;
  let sql = 'SELECT * FROM clients WHERE coordinator_id = $1';
  const params: unknown[] = [user.userId];
  let idx = 2;

  if (status) { sql += ` AND status = $${idx++}`; params.push(status); }
  if (client_type) { sql += ` AND client_type = $${idx++}`; params.push(client_type); }
  if (in_tratativa === 'true') { sql += ' AND in_tratativa = true'; }

  sql += ' ORDER BY created_at DESC';

  const result = await query(sql, params);
  res.status(200).json({ data: result.rows });
});

// ── POST /api/coordinator/clients ────────────────────────────────────────────

export const createBaseClient = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const body = req.body as Record<string, unknown>;
  const name = body.name as string;
  if (!name) { res.status(400).json({ error: 'name is required' }); return; }

  const ltDays = (body.lt_days as number) ?? 0;
  const startDate = (body.start_date as string) || null;
  const source = (body.source as string) || 'base';

  // Calculate new_until (15 days from now)
  const newUntil = new Date();
  newUntil.setDate(newUntil.getDate() + 15);

  const fields = [
    'name', 'coordinator_id', 'source', 'is_new', 'new_until', 'status',
    'razao_social', 'cnpj', 'stakeholders', 'stakeholder_name', 'niche',
    'start_date', 'lt_days', 'lt_start_date',
    'services_scope', 'designer_scope', 'contract_url',
    'whatsapp_group_id', 'drive_folder_url',
    'client_type', 'fee_value', 'media_investment', 'expected_margin', 'contract_period',
    'client_goals', 'roi_target', 'roi_achieved', 'roi_achieved_flag',
    'stakeholder_updated', 'planning_up_to_date', 'fee_payment_up_to_date', 'churn_probability',
    'team_allocation', 'decision_maker', 'trio_id',
    'monetization_history', 'project_costs',
  ];

  const stakeholders = (body.stakeholders as string[]) ?? [];
  const values = [
    name, user.userId, source, true, newUntil.toISOString(), 'active',
    body.razao_social ?? null, body.cnpj ?? null,
    stakeholders, stakeholders[0] ?? null, body.niche ?? null,
    startDate, ltDays, startDate || new Date().toISOString().split('T')[0],
    body.services_scope ?? '{}', body.designer_scope ?? '{}', body.contract_url ?? null,
    body.whatsapp_group_id ?? null, body.drive_folder_url ?? null,
    body.client_type ?? 'recorrente', body.fee_value ?? null, body.media_investment ?? null,
    body.expected_margin ?? null, body.contract_period ?? null,
    JSON.stringify(body.client_goals ?? []), body.roi_target ?? null,
    body.roi_achieved ?? null, body.roi_achieved_flag ?? false,
    body.stakeholder_updated ?? false, body.planning_up_to_date ?? true,
    body.fee_payment_up_to_date ?? true, body.churn_probability ?? 'baixa',
    JSON.stringify(body.team_allocation ?? {}), body.decision_maker ?? null,
    body.trio_id ?? null,
    JSON.stringify(body.monetization_history ?? []), JSON.stringify(body.project_costs ?? []),
  ];

  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const result = await query(
    `INSERT INTO clients (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values
  );

  const client = result.rows[0];
  logger.info(`Coordinator ${user.userId} created base client "${name}" (id: ${client.id})`);

  // Notify trio members if trio assigned
  try {
    if (body.trio_id) {
      const trioResult = await query('SELECT * FROM trios WHERE id = $1', [body.trio_id]);
      const trio = trioResult.rows[0];
      if (trio) {
        const memberIds = [trio.account_user_id, trio.designer_user_id, trio.gt_user_id, trio.tech_user_id].filter(Boolean);
        for (const memberId of memberIds) {
          await insertNotification({
            user_id: memberId,
            type: 'client:created',
            title: `Novo cliente: ${name}`,
            message: `${name} foi cadastrado na sua carteira pelo coordenador.`,
          });
        }
      }
    }
    // Notify leadership
    const leaders = await findUsersByRole('lideranca');
    for (const leader of leaders) {
      await insertNotification({
        user_id: leader.id,
        type: 'client:created',
        title: `Novo cliente: ${name}`,
        message: `${name} (${source === 'base' ? 'base' : 'portfólio'}) foi cadastrado pelo coordenador.`,
      });
    }
  } catch (err) {
    logger.warn('Failed to send notifications for new client:', err);
  }

  res.status(201).json({ data: client });
});

// ── PATCH /api/coordinator/clients/:id/churn ─────────────────────────────────

export const churnClient = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;

  const reason = body.churn_reason as string;
  const severity = body.churn_severity as string;
  const detail = body.churn_detail as string;

  if (!reason || !severity) {
    res.status(400).json({ error: 'churn_reason and churn_severity are required' });
    return;
  }

  const result = await query(
    `UPDATE clients SET
      status = 'churned', churned_at = NOW(),
      churn_reason = $1, churn_severity = $2, churn_detail = $3,
      in_tratativa = false, tratativa_reason = NULL, tratativa_deadline = NULL
    WHERE id = $4 RETURNING *`,
    [reason, severity, detail ?? null, id]
  );

  if (!result.rows[0]) { res.status(404).json({ error: 'Client not found' }); return; }
  const client = result.rows[0];
  logger.info(`Client ${id} churned: ${severity} - ${reason}`);

  // Notify leadership + trio
  try {
    const leaders = await findUsersByRole('lideranca');
    for (const leader of leaders) {
      await insertNotification({
        user_id: leader.id,
        type: 'client:churned',
        title: `Churn: ${client.name}`,
        message: `${client.name} deu churn (${severity}). Motivo: ${reason}`,
      });
    }
    if (client.trio_id) {
      const trioResult = await query('SELECT * FROM trios WHERE id = $1', [client.trio_id]);
      const trio = trioResult.rows[0];
      if (trio) {
        const memberIds = [trio.account_user_id, trio.designer_user_id, trio.gt_user_id, trio.tech_user_id].filter(Boolean);
        for (const memberId of memberIds) {
          await insertNotification({
            user_id: memberId,
            type: 'client:churned',
            title: `Churn: ${client.name}`,
            message: `${client.name} deu churn (${severity}). Motivo: ${reason}`,
          });
        }
      }
    }
  } catch (err) {
    logger.warn('Failed to send churn notifications:', err);
  }

  res.status(200).json({ data: client });
});

// ── PATCH /api/coordinator/clients/:id/tratativa ─────────────────────────────

export const startTratativa = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;

  const reason = body.tratativa_reason as string;
  const deadline = body.tratativa_deadline as string;

  if (!reason || !deadline) {
    res.status(400).json({ error: 'tratativa_reason and tratativa_deadline are required' });
    return;
  }

  const result = await query(
    `UPDATE clients SET
      in_tratativa = true, tratativa_reason = $1, tratativa_deadline = $2, tratativa_started_at = NOW()
    WHERE id = $3 RETURNING *`,
    [reason, deadline, id]
  );

  if (!result.rows[0]) { res.status(404).json({ error: 'Client not found' }); return; }
  const client = result.rows[0];
  logger.info(`Client ${id} entered tratativa until ${deadline}`);

  // Notify leadership + trio
  try {
    const leaders = await findUsersByRole('lideranca');
    for (const leader of leaders) {
      await insertNotification({
        user_id: leader.id,
        type: 'client:tratativa',
        title: `Em tratativa: ${client.name}`,
        message: `${client.name} entrou em tratativa. Prazo: ${new Date(deadline).toLocaleDateString('pt-BR')}`,
      });
    }
    if (client.trio_id) {
      const trioResult = await query('SELECT * FROM trios WHERE id = $1', [client.trio_id]);
      const trio = trioResult.rows[0];
      if (trio) {
        const memberIds = [trio.account_user_id, trio.designer_user_id, trio.gt_user_id, trio.tech_user_id].filter(Boolean);
        for (const memberId of memberIds) {
          await insertNotification({
            user_id: memberId,
            type: 'client:tratativa',
            title: `Em tratativa: ${client.name}`,
            message: `${client.name} entrou em tratativa. Prazo: ${new Date(deadline).toLocaleDateString('pt-BR')}`,
          });
        }
      }
    }
  } catch (err) {
    logger.warn('Failed to send tratativa notifications:', err);
  }

  res.status(200).json({ data: client });
});

// ── PATCH /api/coordinator/clients/:id/save ──────────────────────────────────

export const saveClient = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await query(
    `UPDATE clients SET
      in_tratativa = false, tratativa_reason = NULL, tratativa_deadline = NULL, tratativa_started_at = NULL
    WHERE id = $1 RETURNING *`,
    [id]
  );

  if (!result.rows[0]) { res.status(404).json({ error: 'Client not found' }); return; }
  const client = result.rows[0];
  logger.info(`Client ${id} saved from tratativa`);

  // Notify leadership + trio
  try {
    const leaders = await findUsersByRole('lideranca');
    for (const leader of leaders) {
      await insertNotification({
        user_id: leader.id,
        type: 'client:saved',
        title: `Cliente salvo: ${client.name}`,
        message: `${client.name} foi salvo da tratativa e continua ativo!`,
      });
    }
    if (client.trio_id) {
      const trioResult = await query('SELECT * FROM trios WHERE id = $1', [client.trio_id]);
      const trio = trioResult.rows[0];
      if (trio) {
        const memberIds = [trio.account_user_id, trio.designer_user_id, trio.gt_user_id, trio.tech_user_id].filter(Boolean);
        for (const memberId of memberIds) {
          await insertNotification({
            user_id: memberId,
            type: 'client:saved',
            title: `Cliente salvo: ${client.name}`,
            message: `${client.name} foi salvo da tratativa e continua ativo!`,
          });
        }
      }
    }
  } catch (err) {
    logger.warn('Failed to send save notifications:', err);
  }

  res.status(200).json({ data: client });
});

// ── GET /api/coordinator/clients/dashboard ────────────────────────────────────

export const getCoordinatorDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const uid = user.userId;

  // 1. All coordinator clients
  const clientsResult = await query('SELECT * FROM clients WHERE coordinator_id = $1 ORDER BY created_at DESC', [uid]);
  const clients = clientsResult.rows;

  const active = clients.filter((c: Record<string, unknown>) => c.status === 'active');
  const churned = clients.filter((c: Record<string, unknown>) => c.status === 'churned');
  const inTratativa = clients.filter((c: Record<string, unknown>) => c.in_tratativa === true);
  const newClients = active.filter((c: Record<string, unknown>) => {
    const created = new Date(c.created_at as string);
    const diff = Date.now() - created.getTime();
    return diff < 15 * 24 * 60 * 60 * 1000;
  });

  // 2. Trios managed by this coordinator
  const triosResult = await query(`
    SELECT t.*,
      u1.name as account_name, u2.name as designer_name, u3.name as gt_name, u4.name as tech_name
    FROM trios t
    LEFT JOIN users u1 ON t.account_user_id = u1.id
    LEFT JOIN users u2 ON t.designer_user_id = u2.id
    LEFT JOIN users u3 ON t.gt_user_id = u3.id
    LEFT JOIN users u4 ON t.tech_user_id = u4.id
  `);
  const trios = triosResult.rows;

  // Clients per trio
  const trioClients: Record<string, number> = {};
  for (const t of trios) {
    const tc = active.filter((c: Record<string, unknown>) => c.trio_id === t.id);
    trioClients[t.id as string] = tc.length;
  }

  // 3. Financial summary
  const totalMRR = active.reduce((sum: number, c: Record<string, unknown>) => sum + (Number(c.fee_value) || 0), 0);
  const totalMediaInvestment = active.reduce((sum: number, c: Record<string, unknown>) => sum + (Number(c.media_investment) || 0), 0);
  const avgExpectedMargin = active.length > 0
    ? active.reduce((sum: number, c: Record<string, unknown>) => sum + (Number(c.expected_margin) || 0), 0) / active.length
    : 0;

  // 4. ROI analysis
  const clientsWithRoi = active.filter((c: Record<string, unknown>) => c.roi_target != null);
  const roiAbove1 = clientsWithRoi.filter((c: Record<string, unknown>) => Number(c.roi_achieved) >= 1).length;
  const roiOnTarget = clientsWithRoi.filter((c: Record<string, unknown>) => Number(c.roi_achieved) >= Number(c.roi_target)).length;

  // 5. Churn risk analysis
  const churnRisk = {
    baixa: active.filter((c: Record<string, unknown>) => c.churn_probability === 'baixa').length,
    media: active.filter((c: Record<string, unknown>) => c.churn_probability === 'media').length,
    alta: active.filter((c: Record<string, unknown>) => c.churn_probability === 'alta').length,
    critica: active.filter((c: Record<string, unknown>) => c.churn_probability === 'critica').length,
  };

  // 6. Sprint data
  let sprintSummary = null;
  try {
    const sprintResult = await query(
      "SELECT * FROM sprints WHERE coordinator_id = $1 AND is_current = true AND is_backlog = false LIMIT 1",
      [uid]
    );
    if (sprintResult.rows[0]) {
      const sprint = sprintResult.rows[0];
      const tasksResult = await query('SELECT * FROM sprint_tasks WHERE sprint_id = $1', [sprint.id]);
      const tasks = tasksResult.rows;
      const totalTasks = tasks.length;
      const completed = tasks.filter((t: Record<string, unknown>) => t.status === 'concluida').length;
      const totalHours = tasks.reduce((s: number, t: Record<string, unknown>) => s + (Number(t.estimated_hours) || 0), 0);
      const refractions = tasks.filter((t: Record<string, unknown>) => t.is_refraction === true).length;
      sprintSummary = {
        weekStart: sprint.week_start,
        weekEnd: sprint.week_end,
        totalTasks,
        completed,
        completionRate: totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0,
        totalHours,
        refractions,
        refractionRate: totalTasks > 0 ? Math.round((refractions / totalTasks) * 100) : 0,
      };
    }
  } catch { /* sprint table may not exist */ }

  // 7. Handoffs pending
  let pendingHandoffs = 0;
  try {
    const hResult = await query(
      "SELECT COUNT(*) FROM handoffs WHERE assigned_to_coordinator = $1 AND status = 'forwarded_to_coordinator'",
      [uid]
    );
    pendingHandoffs = parseInt(hResult.rows[0].count, 10);
  } catch { /* ignore */ }

  // 8. Board of Head summary
  let boardSummary = null;
  try {
    const boardResult = await query(
      'SELECT data FROM board_of_head WHERE coordinator_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [uid]
    );
    if (boardResult.rows[0]?.data) {
      const rows = boardResult.rows[0].data.rows || [];
      const totalRows = rows.length;
      const withGoalMet = rows.filter((r: Record<string, unknown>) => r.goalMet === true).length;
      const avgCsat = rows.length > 0
        ? rows.reduce((s: number, r: Record<string, unknown>) => s + (Number(r.csatDesign) || 0), 0) / rows.length
        : 0;
      boardSummary = { totalRows, withGoalMet, avgCsat: Math.round(avgCsat * 10) / 10 };
    }
  } catch { /* ignore */ }

  // 9. AI insights (simple rules-based)
  const insights: Array<{ type: 'warning' | 'success' | 'info' | 'action'; title: string; message: string }> = [];

  if (churnRisk.alta + churnRisk.critica > 0) {
    insights.push({
      type: 'warning',
      title: 'Risco de Churn Elevado',
      message: `${churnRisk.alta + churnRisk.critica} cliente(s) com probabilidade alta/crítica de churn. Atenção urgente necessária.`,
    });
  }

  if (inTratativa.length > 0) {
    const expiringSoon = inTratativa.filter((c: Record<string, unknown>) => {
      const deadline = new Date(c.tratativa_deadline as string);
      return deadline.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
    });
    if (expiringSoon.length > 0) {
      insights.push({
        type: 'action',
        title: 'Tratativas Expirando',
        message: `${expiringSoon.length} tratativa(s) vencem em menos de 7 dias. Decisão urgente: salvar ou churn.`,
      });
    }
  }

  if (roiOnTarget > 0 && clientsWithRoi.length > 0) {
    const pct = Math.round((roiOnTarget / clientsWithRoi.length) * 100);
    if (pct >= 70) {
      insights.push({ type: 'success', title: 'ROI Saudável', message: `${pct}% dos clientes estão atingindo a meta de ROI.` });
    } else if (pct < 50) {
      insights.push({ type: 'warning', title: 'ROI Abaixo da Meta', message: `Apenas ${pct}% dos clientes atingem a meta de ROI. Rever estratégias de tráfego.` });
    }
  }

  if (sprintSummary && sprintSummary.refractionRate > 30) {
    insights.push({
      type: 'warning',
      title: 'Taxa de Refração Alta',
      message: `${sprintSummary.refractionRate}% das tarefas são refrações. Avalie a qualidade dos briefings.`,
    });
  }

  if (newClients.length > 0) {
    insights.push({
      type: 'info',
      title: 'Novos Clientes',
      message: `${newClients.length} cliente(s) novo(s) nos últimos 15 dias. Acompanhe de perto o onboarding.`,
    });
  }

  const avgLT = active.length > 0
    ? active.reduce((sum: number, c: Record<string, unknown>) => sum + (Number(c.lt_days) || 0), 0) / active.length
    : 0;

  if (avgLT > 365) {
    insights.push({ type: 'success', title: 'Retenção Forte', message: `LT médio de ${Math.round(avgLT)} dias — excelente retenção de carteira.` });
  }

  // 10. Forecasting
  const churnRate = clients.length > 0 ? churned.length / clients.length : 0;
  const projectedChurn3m = Math.round(active.length * churnRate * 100) / 100;
  const mrrAtRisk = active
    .filter((c: Record<string, unknown>) => c.churn_probability === 'alta' || c.churn_probability === 'critica')
    .reduce((s: number, c: Record<string, unknown>) => s + (Number(c.fee_value) || 0), 0);

  res.status(200).json({
    data: {
      overview: {
        totalClients: clients.length,
        activeClients: active.length,
        churnedClients: churned.length,
        inTratativa: inTratativa.length,
        newClients: newClients.length,
        pendingHandoffs,
      },
      financial: { totalMRR, totalMediaInvestment, avgExpectedMargin: Math.round(avgExpectedMargin * 10) / 10, mrrAtRisk },
      roi: { clientsTracked: clientsWithRoi.length, roiAbove1, roiOnTarget },
      churnRisk,
      trios: trios.map((t: Record<string, unknown>) => ({
        id: t.id,
        name: t.name,
        accountName: t.account_name,
        designerName: t.designer_name,
        gtName: t.gt_name,
        techName: t.tech_name,
        clientCount: trioClients[t.id as string] || 0,
      })),
      sprint: sprintSummary,
      board: boardSummary,
      insights,
      forecast: {
        churnRate: Math.round(churnRate * 100),
        projectedChurn3m,
        mrrAtRisk,
        avgLT: Math.round(avgLT),
      },
    },
  });
});

// ── PATCH /api/coordinator/clients/:id ───────────────────────────────────────

export const updateCoordinatorClient = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;

  const allowedFields = [
    'name', 'razao_social', 'cnpj', 'stakeholders', 'stakeholder_name', 'niche',
    'segment', 'services_scope', 'designer_scope', 'contract_url',
    'whatsapp_group_id', 'drive_folder_url', 'drive_folder_id',
    'client_type', 'fee_value', 'media_investment', 'expected_margin', 'contract_period',
    'client_goals', 'roi_target', 'roi_achieved', 'roi_achieved_flag',
    'stakeholder_updated', 'planning_up_to_date', 'fee_payment_up_to_date', 'churn_probability',
    'team_allocation', 'decision_maker', 'trio_id',
    'monetization_history', 'project_costs', 'status',
  ];

  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      const val = ['client_goals', 'team_allocation', 'monetization_history', 'project_costs'].includes(field)
        ? JSON.stringify(body[field])
        : body[field];
      updates.push(`${field} = $${idx++}`);
      values.push(val);
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  values.push(id);
  const result = await query(
    `UPDATE clients SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
    values
  );

  if (!result.rows[0]) { res.status(404).json({ error: 'Client not found' }); return; }
  res.status(200).json({ data: result.rows[0] });
});
