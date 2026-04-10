import { query } from '../config/database';
import { getOpenAIClient, OPENAI_MODELS } from '../config/openai';
import { HYPOTHESIS_GENERATION_PROMPT, HYPOTHESIS_VALIDATION_PROMPT } from './ai/prompts/hypothesis.prompt';
import { assembleFullClientContext, contextToText } from './knowledge/context-assembler.service';
import { logger } from '../utils/logger';

export interface Hypothesis {
  category: string;
  title: string;
  description: string;
  rationale: string;
  expectedImpact: string;
  confidence: number;
  actionItems: Array<{ step: number; action: string; owner: string }>;
  targetRole: string;
}

/**
 * Generate hypotheses for a client using AI + full context.
 */
export async function generateHypotheses(clientId: string): Promise<{
  hypotheses: Hypothesis[];
  priorityMatrix: Record<string, string[]>;
  summary: string;
}> {
  const client = getOpenAIClient();
  if (!client) throw new Error('AI not configured');

  // Assemble full client context
  const context = await assembleFullClientContext(clientId);
  const contextText = contextToText(context);

  // Add health score if available
  const healthResult = await query(
    'SELECT overall_score, dimension_scores, recommendations FROM health_scores WHERE client_id = $1 ORDER BY calculated_at DESC LIMIT 1',
    [clientId]
  );
  const health = healthResult.rows[0] as Record<string, unknown> | undefined;

  let fullContext = contextText;
  if (health) {
    fullContext += `\n\n## Health Score\nScore: ${health.overall_score}\nDimensoes: ${JSON.stringify(health.dimension_scores)}\nRecomendacoes: ${JSON.stringify(health.recommendations)}`;
  }

  logger.info(`Generating hypotheses for client ${clientId} (~${Math.ceil(fullContext.length / 4)} tokens)`);

  // Truncate if too long for Groq
  const maxChars = 400000;
  const truncated = fullContext.length > maxChars
    ? fullContext.substring(0, maxChars) + '\n\n[... truncado]'
    : fullContext;

  const response = await client.chat.completions.create({
    model: OPENAI_MODELS.GPT4O,
    messages: [
      { role: 'system', content: HYPOTHESIS_GENERATION_PROMPT },
      { role: 'user', content: `Dados completos do cliente:\n\n${truncated}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.6,
  });

  const content = response.choices[0]?.message?.content ?? '{}';
  const result = JSON.parse(content) as {
    hypotheses?: Hypothesis[];
    priorityMatrix?: Record<string, string[]>;
    summary?: string;
  };

  const hypotheses = result.hypotheses ?? [];

  // Save to database
  for (const h of hypotheses) {
    await query(
      `INSERT INTO hypotheses (client_id, category, title, description, rationale, expected_impact, confidence, action_items, source_documents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        clientId,
        h.category,
        h.title,
        h.description,
        h.rationale,
        h.expectedImpact,
        h.confidence,
        JSON.stringify(h.actionItems),
        JSON.stringify([{ type: 'full_context', clientId }]),
      ]
    );
  }

  logger.info(`Generated ${hypotheses.length} hypotheses for client ${clientId}`);

  return {
    hypotheses,
    priorityMatrix: result.priorityMatrix ?? {},
    summary: result.summary ?? '',
  };
}

/**
 * Get hypotheses for a client with optional filters.
 */
export async function getHypothesesByClient(
  clientId: string,
  filters?: { status?: string; category?: string }
): Promise<unknown[]> {
  let sql = 'SELECT * FROM hypotheses WHERE client_id = $1';
  const params: unknown[] = [clientId];

  if (filters?.status) {
    sql += ` AND status = $${params.length + 1}`;
    params.push(filters.status);
  }
  if (filters?.category) {
    sql += ` AND category = $${params.length + 1}`;
    params.push(filters.category);
  }

  sql += ' ORDER BY confidence DESC, created_at DESC';

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Update hypothesis status.
 */
export async function updateHypothesisStatus(
  id: string,
  status: string,
  testResults?: Record<string, unknown>
): Promise<unknown> {
  const result = await query(
    `UPDATE hypotheses SET status = $1, test_results = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [status, testResults ? JSON.stringify(testResults) : null, id]
  );
  return result.rows[0];
}

/**
 * Validate a hypothesis against test results using AI.
 */
export async function validateHypothesis(
  id: string,
  testResultsText: string
): Promise<Record<string, unknown>> {
  const client = getOpenAIClient();
  if (!client) throw new Error('AI not configured');

  // Get hypothesis
  const hResult = await query('SELECT * FROM hypotheses WHERE id = $1', [id]);
  const hypothesis = hResult.rows[0] as Record<string, unknown> | undefined;
  if (!hypothesis) throw new Error('Hypothesis not found');

  const response = await client.chat.completions.create({
    model: OPENAI_MODELS.GPT4O,
    messages: [
      { role: 'system', content: HYPOTHESIS_VALIDATION_PROMPT },
      {
        role: 'user',
        content: `Hipotese:\nTitulo: ${hypothesis.title}\nDescricao: ${hypothesis.description}\nImpacto esperado: ${hypothesis.expected_impact}\n\nResultados do teste:\n${testResultsText}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content ?? '{}';
  const validation = JSON.parse(content) as Record<string, unknown>;

  // Update hypothesis with validation
  const newStatus = validation.validated ? 'validated' : 'rejected';
  await query(
    'UPDATE hypotheses SET status = $1, test_results = $2, updated_at = NOW() WHERE id = $3',
    [newStatus, JSON.stringify(validation), id]
  );

  return validation;
}
