import OpenAI from 'openai';

export const OPENAI_MODELS = {
  GPT4O: 'llama-3.3-70b-versatile',
  GPT4O_MINI: 'llama-3.1-8b-instant',
  WHISPER: 'whisper-large-v3',
} as const;

export type OpenAIModel = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS];

/**
 * Returns a configured OpenAI client, or null if OPENAI_API_KEY is not set.
 * Lazy-cached: first call creates the client, subsequent calls reuse it.
 */
let _cachedClient: OpenAI | null | undefined;

export function getOpenAIClient(): OpenAI | null {
  if (_cachedClient !== undefined) return _cachedClient;

  // Support Groq (GROQ_API_KEY) or OpenAI (OPENAI_API_KEY)
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (groqKey) {
    _cachedClient = new OpenAI({
      apiKey: groqKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
    return _cachedClient;
  }

  if (openaiKey) {
    _cachedClient = new OpenAI({ apiKey: openaiKey });
    return _cachedClient;
  }

  _cachedClient = null;
  return null;
}

/**
 * @deprecated Use getOpenAIClient() instead for lazy initialization.
 * Kept for backwards compatibility — delegates to getOpenAIClient().
 */
export const openaiClient: OpenAI | null = null;
