import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export const GEMINI_MODELS = {
  FLASH: 'gemini-2.0-flash',
  PRO: 'gemini-1.5-pro',
} as const;

export type GeminiModel = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS];

/**
 * Returns a configured Google Generative AI client, or null if GEMINI_API_KEY is not set.
 * Lazy-cached: first call creates the client, subsequent calls reuse it.
 */
let _cachedClient: GoogleGenerativeAI | null | undefined;

export function getGeminiClient(): GoogleGenerativeAI | null {
  if (_cachedClient !== undefined) return _cachedClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    _cachedClient = null;
    return null;
  }

  _cachedClient = new GoogleGenerativeAI(apiKey);
  return _cachedClient;
}

/**
 * Returns a GenerativeModel instance for the given model name.
 * Defaults to gemini-2.0-flash (fast, good for most tasks).
 */
export function getGeminiModel(model: GeminiModel = GEMINI_MODELS.FLASH): GenerativeModel | null {
  const client = getGeminiClient();
  if (!client) return null;
  return client.getGenerativeModel({ model });
}
