import { query } from '../../config/database';
import { logger } from '../../utils/logger';

/**
 * Assembled context for a client — all data needed for AI knowledge generation.
 */
export interface ClientContext {
  clientId: string;
  clientName: string;
  segment?: string;
  servicesScope?: string[];

  // Handoff & SPICED
  handoff?: {
    companyName: string;
    razaoSocial?: string;
    stakeholders: string[];
    projectStartDate?: string;
    projectScope?: string[];
    spicedReport?: Record<string, unknown>;
    transcript?: string;
  };

  // Strategy
  strategy?: {
    objectives?: string;
    positioning?: string;
    differentials?: string;
    tone?: string;
    products?: string;
    expectedResults?: string;
  };

  // Meetings (kickoffs + check-ins)
  meetings: Array<{
    type: string;
    recordedAt?: string;
    transcript?: string;
  }>;

  // Cohorts
  cohorts: Array<{
    name: string;
    demographicProfile?: Record<string, unknown>;
  }>;

  // WhatsApp messages
  whatsappMessages: Array<{
    sender: string;
    text: string;
    sentAt: string;
  }>;

  // Summary
  summary?: {
    summaryJson?: Record<string, unknown>;
    brandProfileJson?: Record<string, unknown>;
  };

  // Estimated token count
  estimatedTokens: number;
}

/**
 * Assemble the FULL context for a client — pulls data from all tables.
 * Used for comprehensive AI analysis (Gemini deep analysis).
 */
export async function assembleFullClientContext(clientId: string): Promise<ClientContext> {
  logger.info(`Assembling full context for client ${clientId}`);

  // 1. Client basic info
  const clientResult = await query(
    'SELECT id, name, segment, services_scope FROM clients WHERE id = $1',
    [clientId]
  );
  const client = clientResult.rows[0] as { id: string; name: string; segment?: string; services_scope?: string[] } | undefined;
  if (!client) throw new Error(`Client ${clientId} not found`);

  // 2. Handoff data (linked via client_id or matching company)
  const handoffResult = await query(
    'SELECT * FROM handoffs WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1',
    [clientId]
  );
  let handoff = handoffResult.rows[0] as Record<string, unknown> | undefined;

  // Fallback: find by forwarded_to_coordinator matching the client's coordinator
  if (!handoff) {
    const hResult = await query(
      "SELECT * FROM handoffs WHERE company_name ILIKE $1 ORDER BY created_at DESC LIMIT 1",
      [`%${client.name}%`]
    );
    handoff = hResult.rows[0] as Record<string, unknown> | undefined;
  }

  // 3. Strategy
  const stratResult = await query(
    'SELECT * FROM strategies WHERE client_id = $1 ORDER BY version DESC LIMIT 1',
    [clientId]
  );
  const strat = stratResult.rows[0] as Record<string, unknown> | undefined;

  // 4. Meetings (kickoffs + check-ins)
  const meetingsResult = await query(
    'SELECT type, recorded_at, transcript_text FROM meetings WHERE client_id = $1 ORDER BY recorded_at DESC LIMIT 10',
    [clientId]
  );

  // 5. Cohorts
  const cohortsResult = await query(
    'SELECT name, demographic_profile_json FROM cohorts WHERE client_id = $1',
    [clientId]
  );

  // 6. WhatsApp messages (last 100)
  const whatsappResult = await query(
    'SELECT sender, message_text, sent_at FROM whatsapp_messages WHERE client_id = $1 ORDER BY sent_at DESC LIMIT 100',
    [clientId]
  );

  // 7. Summary
  const summaryResult = await query(
    'SELECT summary_json, brand_profile_json FROM summaries WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1',
    [clientId]
  );
  const summary = summaryResult.rows[0] as { summary_json?: Record<string, unknown>; brand_profile_json?: Record<string, unknown> } | undefined;

  const context: ClientContext = {
    clientId,
    clientName: client.name,
    segment: client.segment,
    servicesScope: client.services_scope,

    handoff: handoff ? {
      companyName: handoff.company_name as string,
      razaoSocial: handoff.razao_social as string,
      stakeholders: Array.isArray(handoff.stakeholders)
        ? (handoff.stakeholders as unknown[]).map(s => typeof s === 'string' ? s : (s as { name: string }).name)
        : [],
      projectStartDate: handoff.project_start_date as string,
      projectScope: handoff.project_scope as string[],
      spicedReport: handoff.spiced_report as Record<string, unknown>,
      transcript: (handoff.transcript as string)?.substring(0, 50000), // Limit to ~12k tokens
    } : undefined,

    strategy: strat ? {
      objectives: strat.objectives as string,
      positioning: strat.positioning as string,
      differentials: strat.differentials as string,
      tone: strat.tone as string,
      products: strat.products as string,
      expectedResults: strat.expected_results as string,
    } : undefined,

    meetings: (meetingsResult.rows as Array<{ type: string; recorded_at?: string; transcript_text?: string }>).map(m => ({
      type: m.type,
      recordedAt: m.recorded_at,
      transcript: m.transcript_text?.substring(0, 20000), // Limit each
    })),

    cohorts: (cohortsResult.rows as Array<{ name: string; demographic_profile_json?: Record<string, unknown> }>).map(c => ({
      name: c.name,
      demographicProfile: c.demographic_profile_json,
    })),

    whatsappMessages: (whatsappResult.rows as Array<{ sender: string; message_text: string; sent_at: string }>).map(m => ({
      sender: m.sender,
      text: m.message_text,
      sentAt: m.sent_at,
    })),

    summary: summary ? {
      summaryJson: summary.summary_json,
      brandProfileJson: summary.brand_profile_json,
    } : undefined,

    estimatedTokens: 0,
  };

  // Estimate tokens
  const fullText = JSON.stringify(context);
  context.estimatedTokens = Math.ceil(fullText.length / 4);
  logger.info(`Context assembled: ${context.estimatedTokens} estimated tokens for ${client.name}`);

  return context;
}

/**
 * Convert client context to a readable text format for AI prompts.
 */
export function contextToText(ctx: ClientContext): string {
  const sections: string[] = [];

  sections.push(`# Cliente: ${ctx.clientName}`);
  if (ctx.segment) sections.push(`Segmento: ${ctx.segment}`);
  if (ctx.servicesScope?.length) sections.push(`Servicos: ${ctx.servicesScope.join(', ')}`);

  if (ctx.handoff) {
    sections.push('\n## Handoff / SPICED');
    sections.push(`Empresa: ${ctx.handoff.companyName}`);
    if (ctx.handoff.razaoSocial) sections.push(`Razao Social: ${ctx.handoff.razaoSocial}`);
    if (ctx.handoff.stakeholders.length) sections.push(`Stakeholders: ${ctx.handoff.stakeholders.join(', ')}`);
    if (ctx.handoff.projectScope?.length) sections.push(`Escopo: ${ctx.handoff.projectScope.join(', ')}`);
    if (ctx.handoff.spicedReport) {
      sections.push('\n### SPICED Report');
      for (const [k, v] of Object.entries(ctx.handoff.spicedReport)) {
        sections.push(`**${k}:** ${v}`);
      }
    }
    if (ctx.handoff.transcript) {
      sections.push(`\n### Transcricao de Venda (trecho)\n${ctx.handoff.transcript.substring(0, 10000)}`);
    }
  }

  if (ctx.strategy) {
    sections.push('\n## Estrategia');
    if (ctx.strategy.objectives) sections.push(`Objetivos: ${ctx.strategy.objectives}`);
    if (ctx.strategy.positioning) sections.push(`Posicionamento: ${ctx.strategy.positioning}`);
    if (ctx.strategy.differentials) sections.push(`Diferenciais: ${ctx.strategy.differentials}`);
    if (ctx.strategy.tone) sections.push(`Tom de voz: ${ctx.strategy.tone}`);
    if (ctx.strategy.products) sections.push(`Produtos: ${ctx.strategy.products}`);
  }

  if (ctx.meetings.length) {
    sections.push('\n## Reunioes');
    ctx.meetings.forEach(m => {
      sections.push(`\n### ${m.type} (${m.recordedAt ?? 'sem data'})`);
      if (m.transcript) sections.push(m.transcript.substring(0, 5000));
    });
  }

  if (ctx.cohorts.length) {
    sections.push('\n## Cohorts');
    ctx.cohorts.forEach(c => {
      sections.push(`- ${c.name}: ${JSON.stringify(c.demographicProfile ?? {})}`);
    });
  }

  if (ctx.whatsappMessages.length) {
    sections.push(`\n## WhatsApp (ultimas ${ctx.whatsappMessages.length} msgs)`);
    ctx.whatsappMessages.slice(0, 30).forEach(m => {
      sections.push(`[${m.sentAt}] ${m.sender}: ${m.text}`);
    });
  }

  if (ctx.summary) {
    sections.push('\n## Summary Existente');
    if (ctx.summary.summaryJson) sections.push(JSON.stringify(ctx.summary.summaryJson, null, 2));
  }

  return sections.join('\n');
}
