import { getGeminiModel, GEMINI_MODELS, GeminiModel } from '../../config/gemini';
import { logger } from '../../utils/logger';

/**
 * Generate structured JSON output via Google Gemini API.
 * Mirrors the generateWithRetry() pattern from ai.service.ts but uses Gemini's 1M+ context.
 */
export async function generateWithGemini<T>(
  systemInstruction: string,
  userPrompt: string,
  model: GeminiModel = GEMINI_MODELS.FLASH
): Promise<T> {
  const geminiModel = getGeminiModel(model);
  if (!geminiModel) {
    throw new Error('Gemini API not configured. Set GEMINI_API_KEY in environment.');
  }

  const maxAttempts = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { role: 'model', parts: [{ text: systemInstruction }] },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = result.response.text();
      const parsed = JSON.parse(text) as T;
      return parsed;
    } catch (err) {
      lastError = err as Error;
      logger.warn(`Gemini attempt ${attempt}/${maxAttempts} failed: ${lastError.message}`);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }

  throw new Error(`Gemini generation failed after ${maxAttempts} attempts: ${lastError?.message}`);
}

/**
 * Deep analysis using Gemini's large context window.
 * Concatenates all documents and sends as a single prompt for cross-document analysis.
 */
export async function generateDeepAnalysis<T>(
  systemPrompt: string,
  documents: string[],
  model: GeminiModel = GEMINI_MODELS.PRO
): Promise<T> {
  const combinedDocs = documents.map((doc, i) => `--- Document ${i + 1} ---\n${doc}`).join('\n\n');
  const userPrompt = `Analyze the following ${documents.length} documents:\n\n${combinedDocs}`;

  logger.info(`Gemini deep analysis: ${documents.length} docs, ~${Math.round(combinedDocs.length / 4)} tokens`);
  return generateWithGemini<T>(systemPrompt, userPrompt, model);
}

/**
 * Estimate token count for text (rough: ~4 chars per token).
 * Used to decide Groq vs Gemini routing.
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Decide whether to use Gemini based on data size and doc type.
 * Returns true if Gemini should be used.
 */
export function shouldUseGemini(dataSize: number, docType?: string): boolean {
  // Always use Gemini for cross-document analysis types
  const geminiDocTypes = [
    'portfolio_bi', 'hypothesis_report', 'competitive_scenario',
    'benchmarking', 'market_analysis', 'client_health',
  ];
  if (docType && geminiDocTypes.includes(docType)) return true;

  // Use Gemini when data exceeds Groq's practical limit (~100k tokens)
  const tokens = estimateTokenCount(dataSize.toString().length > 10 ? '' : ''.padEnd(dataSize));
  return dataSize > 400000; // ~100k tokens worth of chars
}
