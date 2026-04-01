import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { query } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

// ── GET /api/sprint/current?coordinator_id=xxx ───────────────────────────────
// Returns current week sprint + backlog for a coordinator
router.get('/current', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const coordinatorId = (req.query.coordinator_id as string) || req.user?.userId;
  if (!coordinatorId) { res.status(400).json({ error: 'coordinator_id required' }); return; }

  // Get current week boundaries (Monday-Friday)
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const weekStart = monday.toISOString().split('T')[0];

  // Get or create current sprint
  let sprintResult = await query(
    'SELECT * FROM sprints WHERE coordinator_id = $1 AND week_start = $2 AND is_backlog = false',
    [coordinatorId, weekStart]
  );

  if (sprintResult.rows.length === 0) {
    sprintResult = await query(
      `INSERT INTO sprints (coordinator_id, week_start, week_end, is_current, status)
       VALUES ($1, $2, $3, true, 'ativa') RETURNING *`,
      [coordinatorId, weekStart, friday.toISOString().split('T')[0]]
    );
  }

  const sprint = sprintResult.rows[0];

  // Get or create backlog
  let backlogResult = await query(
    'SELECT * FROM sprints WHERE coordinator_id = $1 AND is_backlog = true AND status != $2 ORDER BY created_at DESC LIMIT 1',
    [coordinatorId, 'concluida']
  );

  if (backlogResult.rows.length === 0) {
    backlogResult = await query(
      `INSERT INTO sprints (coordinator_id, week_start, week_end, is_backlog, status)
       VALUES ($1, $2, $3, true, 'ativa') RETURNING *`,
      [coordinatorId, weekStart, friday.toISOString().split('T')[0]]
    );
  }

  const backlog = backlogResult.rows[0];

  // Get tasks for both
  const tasksResult = await query(
    'SELECT * FROM sprint_tasks WHERE sprint_id IN ($1, $2) ORDER BY priority_date ASC, priority ASC, created_at ASC',
    [sprint.id, backlog.id]
  );

  // Get team members (from trios where coordinator manages)
  const trioMembers = await query(`
    SELECT DISTINCT u.id, u.name, u.role FROM trios t
    JOIN users u ON u.id IN (t.account_user_id, t.designer_user_id, t.gt_user_id, t.tech_user_id)
    WHERE t.id IN (SELECT trio_id FROM clients WHERE coordinator_id = $1 AND trio_id IS NOT NULL)
  `, [coordinatorId]);

  res.status(200).json({
    data: {
      sprint,
      backlog,
      tasks: tasksResult.rows,
      teamMembers: trioMembers.rows,
    }
  });
}));

// ── POST /api/sprint/tasks ───────────────────────────────────────────────────
router.post('/tasks', authorize('coordenador', 'account', 'super_admin'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const body = req.body as Record<string, unknown>;
  const result = await query(
    `INSERT INTO sprint_tasks (
      sprint_id, coordinator_id, client_id, client_name, task_type, task_type_custom,
      description, executor_id, executor_name, estimated_hours, priority,
      priority_date, status, is_planned, is_refracao, refracao_reason, from_backlog, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
    [
      body.sprint_id, body.coordinator_id ?? user.userId,
      body.client_id ?? null, body.client_name ?? '',
      body.task_type ?? 'personalizado', body.task_type_custom ?? null,
      body.description ?? '', body.executor_id ?? null, body.executor_name ?? '',
      body.estimated_hours ?? 1, body.priority ?? 'media',
      body.priority_date ?? null, body.status ?? 'pendente',
      body.is_planned ?? true, body.is_refracao ?? false,
      body.refracao_reason ?? null, body.from_backlog ?? false, user.userId,
    ]
  );

  logger.info(`Sprint task created by ${user.userId}: ${body.description}`);
  res.status(201).json({ data: result.rows[0] });
}));

// ── PATCH /api/sprint/tasks/:id ──────────────────────────────────────────────
router.patch('/tasks/:id', authorize('coordenador', 'account', 'super_admin'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;

  const allowedFields = [
    'client_name', 'task_type', 'task_type_custom', 'description',
    'executor_id', 'executor_name', 'estimated_hours', 'actual_hours',
    'priority', 'priority_date', 'status', 'is_planned', 'is_refracao',
    'refracao_reason', 'sprint_id',
  ];

  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${idx++}`);
      values.push(body[field]);
    }
  }

  // Auto-set completed_at
  if (body.status === 'concluida') {
    updates.push(`completed_at = NOW()`);
  }

  if (updates.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }

  updates.push('updated_at = NOW()');
  values.push(id);

  const result = await query(
    `UPDATE sprint_tasks SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  if (!result.rows[0]) { res.status(404).json({ error: 'Task not found' }); return; }
  res.status(200).json({ data: result.rows[0] });
}));

// ── DELETE /api/sprint/tasks/:id ─────────────────────────────────────────────
router.delete('/tasks/:id', authorize('coordenador', 'super_admin'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await query('DELETE FROM sprint_tasks WHERE id = $1', [req.params.id]);
  res.status(200).json({ data: { deleted: true } });
}));

// ── GET /api/sprint/metrics?coordinator_id=xxx ───────────────────────────────
// Returns aggregated metrics for past/present/future analysis
router.get('/metrics', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const coordinatorId = (req.query.coordinator_id as string) || req.user?.userId;
  if (!coordinatorId) { res.status(400).json({ error: 'coordinator_id required' }); return; }

  // Current week tasks stats
  const currentStats = await query(`
    SELECT
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE status = 'concluida') as completed,
      COUNT(*) FILTER (WHERE status = 'em_andamento') as in_progress,
      COUNT(*) FILTER (WHERE status = 'pendente') as pending,
      COUNT(*) FILTER (WHERE status = 'bloqueada') as blocked,
      COUNT(*) FILTER (WHERE is_refracao = true) as refracoes,
      COUNT(*) FILTER (WHERE is_planned = false) as unplanned,
      COALESCE(SUM(estimated_hours), 0) as total_estimated_hours,
      COALESCE(SUM(actual_hours), 0) as total_actual_hours,
      COALESCE(SUM(estimated_hours) FILTER (WHERE status = 'concluida'), 0) as completed_hours
    FROM sprint_tasks
    WHERE coordinator_id = $1
    AND sprint_id IN (SELECT id FROM sprints WHERE coordinator_id = $1 AND is_current = true)
  `, [coordinatorId]);

  // Hours per executor
  const hoursPerExecutor = await query(`
    SELECT executor_name,
      COALESCE(SUM(estimated_hours), 0) as estimated,
      COALESCE(SUM(actual_hours), 0) as actual,
      COUNT(*) as task_count,
      COUNT(*) FILTER (WHERE status = 'concluida') as completed
    FROM sprint_tasks
    WHERE coordinator_id = $1
    AND sprint_id IN (SELECT id FROM sprints WHERE coordinator_id = $1 AND is_current = true)
    GROUP BY executor_name
  `, [coordinatorId]);

  // Hours per client
  const hoursPerClient = await query(`
    SELECT client_name,
      COALESCE(SUM(estimated_hours), 0) as estimated,
      COUNT(*) as task_count
    FROM sprint_tasks
    WHERE coordinator_id = $1
    AND sprint_id IN (SELECT id FROM sprints WHERE coordinator_id = $1 AND is_current = true)
    GROUP BY client_name
  `, [coordinatorId]);

  // Historical (past 4 weeks)
  const historical = await query(`
    SELECT
      s.week_start,
      COUNT(st.*) as total_tasks,
      COUNT(st.*) FILTER (WHERE st.status = 'concluida') as completed,
      COUNT(st.*) FILTER (WHERE st.is_refracao = true) as refracoes,
      COALESCE(SUM(st.estimated_hours), 0) as estimated_hours
    FROM sprints s
    LEFT JOIN sprint_tasks st ON st.sprint_id = s.id
    WHERE s.coordinator_id = $1 AND s.is_backlog = false
    GROUP BY s.id, s.week_start
    ORDER BY s.week_start DESC
    LIMIT 4
  `, [coordinatorId]);

  res.status(200).json({
    data: {
      current: currentStats.rows[0],
      hoursPerExecutor: hoursPerExecutor.rows,
      hoursPerClient: hoursPerClient.rows,
      historical: historical.rows,
    }
  });
}));

export default router;
