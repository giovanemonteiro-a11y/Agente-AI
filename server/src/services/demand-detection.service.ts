import { getOpenAIClient, OPENAI_MODELS } from '../config/openai';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { insertNotification } from '../repositories/notifications.repository';

export interface DetectedDemand {
  description: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  demandType: string;
  context: string;
}

/**
 * Detect demands from a batch of WhatsApp messages for a client.
 * Uses AI to analyze messages in context with the client's strategy.
 */
export async function detectDemands(
  clientId: string,
  messages: Array<{ sender: string; text: string; sentAt: string }>
): Promise<DetectedDemand[]> {
  if (messages.length === 0) return [];

  const client = getOpenAIClient();
  if (!client) {
    logger.warn('detectDemands: AI not configured');
    return [];
  }

  // Get client strategy for context
  const stratResult = await query(
    'SELECT objectives, positioning, products FROM strategies WHERE client_id = $1 ORDER BY version DESC LIMIT 1',
    [clientId]
  );
  const strategy = stratResult.rows[0] as Record<string, string> | undefined;

  const messagesText = messages
    .map(m => `[${m.sentAt}] ${m.sender}: ${m.text}`)
    .join('\n');

  const systemPrompt = `Voce e um analista de demandas da V4 Company. Analise mensagens de WhatsApp de um grupo de cliente e identifique demandas acioaveis.

${strategy ? `CONTEXTO DA ESTRATEGIA DO CLIENTE:
- Objetivos: ${strategy.objectives ?? 'N/A'}
- Posicionamento: ${strategy.positioning ?? 'N/A'}
- Produtos: ${strategy.products ?? 'N/A'}` : ''}

CLASSIFIQUE cada demanda:
- demand_type: design_request, campaign_change, content_need, copy_revision, meeting_request, report_request, strategy_change, budget_change, technical_issue, other
- urgency: critical (bloqueador/prazo imediato), high (urgente/reclamacao), medium (normal), low (sugestao/duvida)

Retorne JSON:
{
  "demands": [
    {
      "description": "Descricao clara e acionavel da demanda",
      "urgency": "critical|high|medium|low",
      "demandType": "tipo da demanda",
      "context": "Trecho relevante da conversa que originou a demanda"
    }
  ]
}

Regras:
- Agrupe mensagens relacionadas em uma unica demanda
- Ignore saudacoes, conversas pessoais e mensagens sem demanda concreta
- Foque em acoes que a equipe V4 precisa executar
- Se nao houver demandas, retorne {"demands": []}`;

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODELS.GPT4O,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Mensagens do grupo:\n\n${messagesText}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content) as { demands?: DetectedDemand[] };
    const demands = parsed.demands ?? [];

    logger.info(`detectDemands: found ${demands.length} demands for client ${clientId}`);
    return demands;
  } catch (err) {
    logger.error('detectDemands error:', err);
    return [];
  }
}

/**
 * Save detected demands to the database and notify relevant users.
 */
export async function saveDemands(
  clientId: string,
  demands: DetectedDemand[],
  source: string = 'whatsapp',
  sourceId?: string
): Promise<string[]> {
  const savedIds: string[] = [];

  for (const demand of demands) {
    const result = await query<{ id: string }>(
      `INSERT INTO demand_detections (client_id, source, source_id, description, urgency, demand_type, context_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        clientId,
        source,
        sourceId ?? null,
        demand.description,
        demand.urgency,
        demand.demandType,
        JSON.stringify({ context: demand.context }),
      ]
    );
    savedIds.push(result.rows[0].id);
  }

  // Notify coordinator and account about new demands
  if (demands.length > 0) {
    try {
      const clientResult = await query<{ name: string }>(
        'SELECT name FROM clients WHERE id = $1', [clientId]
      );
      const clientName = clientResult.rows[0]?.name ?? 'Cliente';

      // Get trio users for this client
      const trioResult = await query<{ account_user_id: string; designer_user_id: string; gt_user_id: string }>(
        `SELECT t.account_user_id, t.designer_user_id, t.gt_user_id
         FROM trios t JOIN clients c ON c.trio_id = t.id
         WHERE c.id = $1`,
        [clientId]
      );

      const trio = trioResult.rows[0];
      const usersToNotify = trio
        ? [trio.account_user_id, trio.designer_user_id, trio.gt_user_id].filter(Boolean)
        : [];

      const highPriority = demands.filter(d => d.urgency === 'critical' || d.urgency === 'high');

      for (const userId of usersToNotify) {
        await insertNotification({
          user_id: userId,
          type: 'demand:detected',
          title: `${demands.length} demanda(s) detectada(s): ${clientName}`,
          message: highPriority.length > 0
            ? `${highPriority.length} urgente(s): ${highPriority[0].description}`
            : `Nova demanda: ${demands[0].description}`,
          data_json: { client_id: clientId, demand_ids: savedIds },
        });
      }
    } catch (err) {
      logger.warn('Failed to send demand notifications:', err);
    }
  }

  return savedIds;
}

/**
 * Process incoming WhatsApp messages: detect demands and save them.
 */
export async function processMessagesForDemands(
  clientId: string,
  messages: Array<{ id: string; sender: string; text: string; sentAt: string }>
): Promise<void> {
  const demands = await detectDemands(clientId, messages);
  if (demands.length > 0) {
    await saveDemands(clientId, demands, 'whatsapp', messages[0]?.id);
    logger.info(`Saved ${demands.length} demands from WhatsApp for client ${clientId}`);
  }
}
