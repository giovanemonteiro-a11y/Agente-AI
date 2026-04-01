// Global test setup — runs before every test file.
// Keep env vars predictable for tests.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.DATABASE_URL = 'postgresql://localhost:5432/ai_sici_test';
process.env.OPENAI_API_KEY = 'sk-test-key';
process.env.REDIS_URL = 'redis://localhost:6379';
