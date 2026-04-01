import { query } from '../config/database';

export interface HandoffRow {
  id: string;
  created_by: string;
  // Step 1
  transcript: string | null;
  recording_url: string | null;
  // Step 2
  company_name: string | null;
  razao_social: string | null;
  stakeholders: unknown;
  project_start_date: string | null;
  project_scope: Record<string, unknown> | null;
  contract_url: string | null;
  whatsapp_group_id: string | null;
  // Step 3
  spiced_report: Record<string, unknown> | null;
  analyst_confirmed: boolean;
  analyst_confirmed_at: string | null;
  // Step 4
  observation: string | null;
  // Workflow
  status: string;
  current_step: number;
  send_attempts: number;
  pdf_downloaded: boolean;
  approvals: Record<string, unknown>[];
  // Forwarding
  forwarded_to_coordinator: string | null;
  forwarded_by: string | null;
  forwarded_at: string | null;
  // Trio
  assigned_trio_id: string | null;
  assigned_at: string | null;
  // Client link
  client_id: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateHandoffData {
  created_by: string;
  company_name?: string;
}

export async function createHandoff(data: CreateHandoffData): Promise<HandoffRow> {
  const result = await query<HandoffRow>(
    `INSERT INTO handoffs (created_by, company_name, status, current_step)
     VALUES ($1, $2, 'draft', 1)
     RETURNING *`,
    [data.created_by, data.company_name ?? null]
  );
  return result.rows[0];
}

export async function findById(id: string): Promise<HandoffRow | null> {
  const result = await query<HandoffRow>(
    'SELECT * FROM handoffs WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
}

export async function findByCreatedBy(userId: string): Promise<HandoffRow[]> {
  const result = await query<HandoffRow>(
    'SELECT * FROM handoffs WHERE created_by = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function findByStatus(status: string): Promise<HandoffRow[]> {
  const result = await query<HandoffRow>(
    'SELECT * FROM handoffs WHERE status = $1 ORDER BY created_at DESC',
    [status]
  );
  return result.rows;
}

export async function findForLeadership(): Promise<HandoffRow[]> {
  const result = await query<HandoffRow>(
    `SELECT * FROM handoffs
     WHERE status IN ('sent_to_leadership', 'approved_partial', 'approved_all', 'forwarded_to_coordinator')
     ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function findForCoordinator(coordinatorId: string): Promise<HandoffRow[]> {
  const result = await query<HandoffRow>(
    'SELECT * FROM handoffs WHERE forwarded_to_coordinator = $1 ORDER BY created_at DESC',
    [coordinatorId]
  );
  return result.rows;
}

export async function updateStep1(
  id: string,
  data: { transcript: string; recording_url: string }
): Promise<HandoffRow | null> {
  const result = await query<HandoffRow>(
    `UPDATE handoffs
     SET transcript = $1, recording_url = $2, current_step = GREATEST(current_step, 1), updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [data.transcript, data.recording_url, id]
  );
  return result.rows[0] ?? null;
}

export async function updateStep2(
  id: string,
  data: {
    company_name: string;
    razao_social: string;
    stakeholders: unknown;
    project_start_date: string;
    project_scope: unknown;
    contract_url: string;
    whatsapp_group_id: string;
  }
): Promise<HandoffRow | null> {
  const result = await query<HandoffRow>(
    `UPDATE handoffs
     SET company_name = $1, razao_social = $2, stakeholders = $3::jsonb,
         project_start_date = $4, project_scope = $5, contract_url = $6,
         whatsapp_group_id = $7, current_step = GREATEST(current_step, 2), updated_at = NOW()
     WHERE id = $8 RETURNING *`,
    [
      data.company_name, data.razao_social,
      JSON.stringify(data.stakeholders), data.project_start_date,
      JSON.stringify(data.project_scope), data.contract_url,
      data.whatsapp_group_id, id,
    ]
  );
  return result.rows[0] ?? null;
}

export async function updateSpicedReport(
  id: string,
  report: Record<string, unknown>
): Promise<HandoffRow | null> {
  const result = await query<HandoffRow>(
    `UPDATE handoffs SET spiced_report = $1, current_step = GREATEST(current_step, 3), updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [JSON.stringify(report), id]
  );
  return result.rows[0] ?? null;
}

export async function confirmAnalysis(id: string): Promise<HandoffRow | null> {
  const result = await query<HandoffRow>(
    `UPDATE handoffs SET analyst_confirmed = true, analyst_confirmed_at = NOW(), updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function updateObservation(id: string, observation: string): Promise<HandoffRow | null> {
  const result = await query<HandoffRow>(
    `UPDATE handoffs SET observation = $1, current_step = 4, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [observation, id]
  );
  return result.rows[0] ?? null;
}

export async function updateStatus(id: string, status: string): Promise<HandoffRow | null> {
  const sentAt = status === 'sent_to_leadership' ? ', sent_at = NOW()' : '';
  const result = await query<HandoffRow>(
    `UPDATE handoffs SET status = $1${sentAt}, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0] ?? null;
}

export async function updateApprovals(
  id: string,
  approvals: Record<string, unknown>[]
): Promise<HandoffRow | null> {
  const result = await query<HandoffRow>(
    'UPDATE handoffs SET approvals = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [JSON.stringify(approvals), id]
  );
  return result.rows[0] ?? null;
}

export async function updateForwarding(
  id: string,
  coordinatorId: string,
  forwardedBy: string
): Promise<HandoffRow | null> {
  const result = await query<HandoffRow>(
    `UPDATE handoffs
     SET forwarded_to_coordinator = $1, forwarded_by = $2, forwarded_at = NOW(),
         status = 'forwarded_to_coordinator', updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [coordinatorId, forwardedBy, id]
  );
  return result.rows[0] ?? null;
}

export async function updateTrioAssignment(
  id: string,
  trioId: string
): Promise<HandoffRow | null> {
  const result = await query<HandoffRow>(
    `UPDATE handoffs
     SET assigned_trio_id = $1, assigned_at = NOW(), status = 'assigned_to_trio', updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [trioId, id]
  );
  return result.rows[0] ?? null;
}

export async function incrementSendAttempts(id: string): Promise<HandoffRow | null> {
  const result = await query<HandoffRow>(
    'UPDATE handoffs SET send_attempts = send_attempts + 1, updated_at = NOW() WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] ?? null;
}

export async function markPdfDownloaded(id: string): Promise<HandoffRow | null> {
  const result = await query<HandoffRow>(
    'UPDATE handoffs SET pdf_downloaded = true, updated_at = NOW() WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] ?? null;
}
