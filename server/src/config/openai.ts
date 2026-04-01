import OpenAI from 'openai';

export const OPENAI_MODELS = {
  GPT4O: 'gpt-4o',
  GPT4O_MINI: 'gpt-4o-mini',
  WHISPER: 'whisper-1',
} as const;

export type OpenAIModel = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS];

/**
 * Returns a configured OpenAI client, or null if OPENAI_API_KEY is not set.
 * Lazy-cached: first call creates the client, subsequent calls reuse it.
 */
let _cachedClient: OpenAI | null | undefined;

export function getOpenAIClient(): OpenAI | null {
  if (_cachedClient !== undefined) return _cachedClient;
  if (!process.env.OPENAI_API_KEY) {
    _cachedClient = null;
    return null;
  }
  _cachedClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _cachedClient;
}

/**
 * @deprecated Use getOpenAIClient() instead for lazy initialization.
 * Kept for backwards compatibility — delegates to getOpenAIClient().
 */
export const openaiClient: OpenAI | null = null;
