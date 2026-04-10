import { query } from '../config/database';
import { getOpenAIClient, OPENAI_MODELS } from '../config/openai';
import { CLIENT_HEALTH_PROMPT, PORTFOLIO_BI_PROMPT } from './ai/prompts/health.prompt';
import { logger } from '../utils/logger';

export interface HealthScore {
  overallScore: number;
  dimensions: Record<string, { score: number; reason: string }>;
  classification: string;
  signals: Array<{ type: string; description: string }>;
  recommendations: Array<{ priority: string; action: string; impact: string }>;
  summary: string;
}

/**
 * Gather health signals for a client from multiple data sources.
 */
async function gatherSignals(clientId: string): Promise<string> {
  const signals: string[] = [];

  // Client basic info
  const clientResult = await query(
    'SELECT name, segment, services_scope, created_at FROM clients WHERE id = $1', [clientId]
  );
  const client = clientResult.rows[0] as Record<string, unknown> | undefined;
  if (!client) throw new Error(`Client ${clientId} not found`);

  signals.push(`Cliente: ${client.name} | Segmento: ${client.segment ?? 'N/A'}`);

  // Meeting frequency (last 90 days)
  const meetingsResult = await query(
    `SELECT type, COUNT(*) as count FROM meetings WHERE client_id = $1 AND recorded_at > NOW() - INTERVAL '90 days' GROUP BY type`,
    [clientId]
  );
  const meetings = meetingsResult.rows as Array<{ type: string; count: string }>;
  signals.push(`Reunioes (90 dias): ${meetings.map(m => `${m.type}: ${m.count}`).join(', ') || 'nenhuma'}`);

  // WhatsApp activity (last 30 days)
  const whatsappResult = await query(
    `SELECT COUNT(*) as count FROM whatsapp_messages WHERE client_id = $1 AND sent_at > NOW() - INTERVAL '30 days'`,
    [clientId]
  );
  const msgCount = (whatsappResult.rows[0] as { count: string })?.count ?? '0';
  signals.push(`Mensagens WhatsApp (30 dias): ${msgCount}`);

  // Pending demands
  const demandsResult = await query(
    `SELECT urgency, COUNT(*) as count FROM demand_detections WHERE client_id = $1 AND status IN ('detected', 'briefing_created') GROUP BY urgency`,
    [clientId]
  );
  const demands = demandsResult.rows as Array<{ urgency: string; count: string }>;
  signals.push(`Demandas pendentes: ${demands.map(d => `${d.urgency}: ${d.count}`).join(', ') || 'nenhuma'}`);

  // Strategy exists?
  const stratResult = await query(
    'SELECT COUNT(*) as count FROM strategies WHERE client_id = $1', [clientId]
  );
  signals.push(`Estrategia definida: ${Number((stratResult.rows[0] as { count: string }).count) > 0 ? 'Sim' : 'Nao'}`);

  // Briefings completed (last 30 days)
  const briefResult = await query(
    `SELECT COUNT(*) as count FROM briefings WHERE client_id = $1 AND sent_at IS NOT NULL AND created_at > NOW() - INTERVAL '30 days'`,
    [clientId]
  );
  signals.push(`Briefings enviados (30 dias): ${(briefResult.rows[0] as { count: string }).count}`);

  // Days since last meeting
  const lastMeetingResult = await query(
    'SELECT MAX(recorded_at) as last_meeting FROM meetings WHERE client_id = $1', [clientId]
  );
  const lastMeeting = (lastMeetingResult.rows[0] as { last_meeting: string | null })?.last_meeting;
  if (lastMeeting) {
    const days = Math.floor((Date.now() - new Date(lastMeeting).getTime()) / (1000 * 60 * 60 * 24));
    signals.push(`Dias desde ultima reuniao: ${days}`);
  } else {
    signals.push('Dias desde ultima reuniao: nunca teve');
  }

  return signals.join('\n');
}

/**
 * Calculate health score for a single client.
 */
export async function calculateClientHealth(clientId: string): Promise<HealthScore> {
  const client = getOpenAIClient();
  if (!client) throw new Error('AI not configured');

  const signalsText = await gatherSignals(clientId);

  logger.info(`Calculating health for client ${clientId}`);

  const response = await client.chat.completions.create({
    model: OPENAI_MODELS.GPT4O,
    messages: [
      { role: 'system', content: CLIENT_HEALTH_PROMPT },
      { role: 'user', content: `Sinais do cliente:\n\n${signalsText}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content ?? '{}';
  const health = JSON.parse(content) as HealthScore;

  // Save to database
  await query(
    `INSERT INTO health_scores (client_id, overall_score, dimension_scores, signals, recommendations)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      clientId,
      health.overallScore,
      JSON.stringify(health.dimensions),
      JSON.stringify(health.signals),
      JSON.stringify(health.recommendations),
    ]
  );

  // Update client health_score
  await query(
    'UPDATE clients SET health_score = $1, health_updated_at = NOW() WHERE id = $2',
    [health.overallScore, clientId]
  );

  logger.info(`Health calculated for ${clientId}: ${health.overallScore} (${health.classification})`);
  return health;
}

/**
 * Calculate health for ALL active clients.
 */
export async function calculateAllClientHealth(): Promise<Array<{ clientId: string; name: string; score: number }>> {
  const result = await query("SELECT id, name FROM clients WHERE status = 'active'");
  const clients = result.rows as Array<{ id: string; name: string }>;

  const results: Array<{ clientId: string; name: string; score: number }> = [];

  for (const c of clients) {
    try {
      const health = await calculateClientHealth(c.id);
      results.push({ clientId: c.id, name: c.name, score: health.overallScore });
    } catch (err) {
      logger.error(`Health calc failed for ${c.name}:`, err);
      results.push({ clientId: c.id, name: c.name, score: -1 });
    }
  }

  return results;
}

/**
 * Generate portfolio BI snapshot.
 */
export async function generatePortfolioSnapshot(): Promise<Record<string, unknown>> {
  const client = getOpenAIClient();
  if (!client) throw new Error('AI not configured');

  // Get all health scores
  const healthResult = await query(
    `SELECT c.name, c.segment, h.overall_score, h.dimension_scores, h.recommendations
     FROM clients c
     LEFT JOIN LATERAL (
       SELECT * FROM health_scores WHERE client_id = c.id ORDER BY calculated_at DESC LIMIT 1
     ) h ON true
     WHERE c.status = 'active'`
  );

  const clientsData = healthResult.rows as Array<Record<string, unknown>>;

  if (clientsData.length === 0) {
    return { message: 'No active clients with health data' };
  }

  const dataText = clientsData.map(c =>
    `${c.name} (${c.segment ?? 'N/A'}): Score ${c.overall_score ?? 'N/A'} | ${JSON.stringify(c.dimension_scores ?? {})}`
  ).join('\n');

  const response = await client.chat.completions.create({
    model: OPENAI_MODELS.GPT4O,
    messages: [
      { role: 'system', content: PORTFOLIO_BI_PROMPT },
      { role: 'user', content: `Dados dos clientes da carteira:\n\n${dataText}\n\nTotal: ${clientsData.length} clientes ativos` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content ?? '{}';
  const portfolio = JSON.parse(content) as Record<string, unknown>;

  // Save snapshot
  await query(
    `INSERT INTO portfolio_snapshots (snapshot_date, total_clients, avg_health_score, health_distribution, top_risks, top_performers, data_json)
     VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6)
     ON CONFLICT (snapshot_date) DO UPDATE SET
       total_clients = EXCLUDED.total_clients,
       avg_health_score = EXCLUDED.avg_health_score,
       health_distribution = EXCLUDED.health_distribution,
       top_risks = EXCLUDED.top_risks,
       top_performers = EXCLUDED.top_performers,
       data_json = EXCLUDED.data_json`,
    [
      clientsData.length,
      portfolio.avgHealthScore ?? 0,
      JSON.stringify(portfolio.healthDistribution ?? {}),
      JSON.stringify(portfolio.topRisks ?? []),
      JSON.stringify(portfolio.topPerformers ?? []),
      JSON.stringify(portfolio),
    ]
  );

  logger.info(`Portfolio snapshot generated: ${clientsData.length} clients, avg score: ${portfolio.avgHealthScore}`);
  return portfolio;
}

/**
 * Get health trend for a client over time.
 */
export async function getHealthTrend(clientId: string, days: number = 30): Promise<Array<{ date: string; score: number }>> {
  const result = await query(
    `SELECT DATE(calculated_at) as date, overall_score as score
     FROM health_scores
     WHERE client_id = $1 AND calculated_at > NOW() - INTERVAL '1 day' * $2
     ORDER BY calculated_at ASC`,
    [clientId, days]
  );
  return result.rows as Array<{ date: string; score: number }>;
}
