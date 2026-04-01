import OpenAI from 'openai';

export const OPENAI_MODELS = {
  GPT4O: 'gpt-4o',
  GPT4O_MINI: 'gpt-4o-mini',
  WHISPER: 'whisper-1',
} as const;

export type OpenAIModel = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS];

/**
 * Returns a configured OpenAI client, or null if OPENAI_API_KEY is not set.
 * Callers must handle the null case (e.g., use a mock response).
 */
export function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Cached singleton — use this everywhere except in tests.
 * May be null when OPENAI_API_KEY is absent.
 */
export const openaiClient: OpenAI | null = getOpenAIClient();
