import { assembleFullClientContext, contextToText } from './context-assembler.service';
import { KNOWLEDGE_PROMPTS } from '../ai/prompts/knowledge.prompt';
import { generateWithGemini, shouldUseGemini } from '../ai/gemini.service';
import { getOpenAIClient, OPENAI_MODELS } from '../../config/openai';
import { upsert } from '../../repositories/knowledge.repository';
import { renderVaultDocument } from '../vault/vault.service';
import { logger } from '../../utils/logger';

/** All doc types that can be generated */
export const GENERABLE_DOC_TYPES = [
  'one_page_summary',
  'cohort_analysis',
  'empathy_map',
  'business_canvas',
  'persona',
  'archetype',
  'copy_manual',
  'competitive_scenario',
  'market_analysis',
  'benchmarking',
];

/**
 * Generate a single knowledge document for a client.
 * Routes to Groq or Gemini based on data size and doc type.
 */
export async function generateDocument(
  clientId: string,
  docType: string
): Promise<{ id: string; docType: string; vaultPath: string }> {
  logger.info(`Generating ${docType} for client ${clientId}`);

  // 1. Assemble context
  const context = await assembleFullClientContext(clientId);
  const contextText = contextToText(context);

  // 2. Get prompt for this doc type
  const systemPrompt = KNOWLEDGE_PROMPTS[docType];
  if (!systemPrompt) {
    throw new Error(`No prompt defined for doc type: ${docType}`);
  }

  // 3. Route to Groq or Gemini
  let generatedData: Record<string, unknown>;
  let generatedBy: string;

  const useGemini = shouldUseGemini(contextText.length, docType);

  if (useGemini) {
    logger.info(`Using Gemini for ${docType} (${context.estimatedTokens} tokens)`);
    generatedData = await generateWithGemini<Record<string, unknown>>(
      systemPrompt,
      `Dados do cliente:\n\n${contextText}`
    );
    generatedBy = 'gemini';
  } else {
    logger.info(`Using Groq for ${docType} (${context.estimatedTokens} tokens)`);
    generatedData = await generateWithGroq(systemPrompt, contextText);
    generatedBy = 'groq';
  }

  // 4. Render to markdown
  const { markdown, vaultPath } = renderVaultDocument({
    clientName: context.clientName,
    docType,
    data: generatedData,
  });

  // 5. Save to database
  const title = docType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const saved = await upsert({
    client_id: clientId,
    doc_type: docType,
    title: `${title} — ${context.clientName}`,
    content_md: markdown,
    content_json: generatedData,
    vault_path: vaultPath,
    generated_by: generatedBy,
  });

  logger.info(`Generated ${docType} for ${context.clientName} (${generatedBy}), saved as ${saved.id}`);

  return {
    id: saved.id,
    docType,
    vaultPath,
  };
}

/**
 * Generate ALL knowledge documents for a client.
 */
export async function generateAllDocuments(
  clientId: string
): Promise<Array<{ id: string; docType: string; vaultPath: string; error?: string }>> {
  const results: Array<{ id: string; docType: string; vaultPath: string; error?: string }> = [];

  for (const docType of GENERABLE_DOC_TYPES) {
    try {
      const result = await generateDocument(clientId, docType);
      results.push(result);
    } catch (err) {
      logger.error(`Failed to generate ${docType} for client ${clientId}:`, err);
      results.push({
        id: '',
        docType,
        vaultPath: '',
        error: (err as Error).message,
      });
    }
  }

  const success = results.filter(r => !r.error).length;
  const failed = results.filter(r => r.error).length;
  logger.info(`Generated ${success}/${GENERABLE_DOC_TYPES.length} docs for client ${clientId} (${failed} failed)`);

  return results;
}

/**
 * Generate via Groq (OpenAI-compatible API).
 */
async function generateWithGroq(
  systemPrompt: string,
  userContent: string
): Promise<Record<string, unknown>> {
  const client = getOpenAIClient();
  if (!client) throw new Error('Groq/OpenAI not configured');

  // Truncate if too long for Groq (128k context ~ 512k chars)
  const maxChars = 400000;
  const truncated = userContent.length > maxChars
    ? userContent.substring(0, maxChars) + '\n\n[... conteudo truncado por limite de contexto]'
    : userContent;

  const response = await client.chat.completions.create({
    model: OPENAI_MODELS.GPT4O,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Dados do cliente:\n\n${truncated}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const text = response.choices[0]?.message?.content ?? '{}';
  return JSON.parse(text) as Record<string, unknown>;
}
