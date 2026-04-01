import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { rateLimiter } from '../middleware/rateLimiter';

function makeMockReq(ip = '127.0.0.1'): Request {
  return { ip, socket: { remoteAddress: ip } } as unknown as Request;
}

interface MockResResult {
  res: Response;
  ctx: { statusCode: number | null; body: unknown; headers: Record<string, unknown> };
  /** Shorthand accessor — reads ctx.statusCode */
  get statusCode(): number | null;
}

function makeMockRes(): MockResResult {
  const ctx = {
    statusCode: null as number | null,
    body: null as unknown,
    headers: {} as Record<string, unknown>,
  };

  const res = {
    setHeader: (key: string, value: unknown) => { ctx.headers[key] = value; },
    status: (code: number) => { ctx.statusCode = code; return res; },
    json: (data: unknown) => { ctx.body = data; },
  } as unknown as Response;

  return {
    res,
    ctx,
    get statusCode() { return ctx.statusCode; },
  };
}

describe('rateLimiter middleware', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests under the limit', () => {
    const limiter = rateLimiter({ windowMs: 60_000, maxRequests: 5, keyPrefix: 'test1' });
    const req = makeMockReq('10.0.0.1');
    let nextCalled = false;
    const next: NextFunction = () => { nextCalled = true; };

    for (let i = 0; i < 5; i++) {
      const { res } = makeMockRes();
      nextCalled = false;
      limiter(req, res, next);
      expect(nextCalled).toBe(true);
    }
  });

  it('blocks requests over the limit with 429', () => {
    const limiter = rateLimiter({ windowMs: 60_000, maxRequests: 2, keyPrefix: 'test2' });
    const req = makeMockReq('10.0.0.2');
    const next: NextFunction = () => {};

    // Exhaust limit
    const m1 = makeMockRes();
    limiter(req, m1.res, next);
    const m2 = makeMockRes();
    limiter(req, m2.res, next);

    // 3rd request should be blocked
    const m3 = makeMockRes();
    let nextCalledAfterLimit = false;
    limiter(req, m3.res, () => { nextCalledAfterLimit = true; });

    expect(m3.statusCode).toBe(429);
    expect(nextCalledAfterLimit).toBe(false);
  });

  it('sets rate limit headers', () => {
    const limiter = rateLimiter({ windowMs: 60_000, maxRequests: 10, keyPrefix: 'test3' });
    const req = makeMockReq('10.0.0.3');
    const m = makeMockRes();
    limiter(req, m.res, () => {});

    expect(m.ctx.headers['X-RateLimit-Limit']).toBe(10);
    expect(typeof m.ctx.headers['X-RateLimit-Remaining']).toBe('number');
    expect(typeof m.ctx.headers['X-RateLimit-Reset']).toBe('number');
  });

  it('resets counter after window expires', () => {
    const limiter = rateLimiter({ windowMs: 1_000, maxRequests: 1, keyPrefix: 'test4' });
    const req = makeMockReq('10.0.0.4');
    const next: NextFunction = () => {};

    // First request — passes
    const { res: r1 } = makeMockRes();
    limiter(req, r1, next);

    // Second request — blocked
    const m2 = makeMockRes();
    limiter(req, m2.res, next);
    expect(m2.statusCode).toBe(429);

    // Advance time past window
    vi.advanceTimersByTime(1_100);

    // Should pass again after reset
    let nextCalledAfterReset = false;
    const { res: r3 } = makeMockRes();
    limiter(req, r3, () => { nextCalledAfterReset = true; });
    expect(nextCalledAfterReset).toBe(true);
  });
});
