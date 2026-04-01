import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { errorHandler, AppError } from '../middleware/errorHandler';

function mockRes() {
  const ctx = { statusCode: 0, body: null as unknown };
  const res = {
    status: (code: number) => { ctx.statusCode = code; return res; },
    json: (data: unknown) => { ctx.body = data; },
  } as unknown as Response;
  return { res, ctx };
}

const req = {} as Request;
const next = vi.fn() as unknown as NextFunction;

describe('errorHandler', () => {
  it('handles AppError with correct status code', () => {
    const { res, ctx } = mockRes();
    errorHandler(new AppError('Not found', 404), req, res, next);
    expect(ctx.statusCode).toBe(404);
    expect((ctx.body as Record<string, unknown>).error).toBe('Not found');
  });

  it('handles ZodError with 400 and field details', () => {
    const { res, ctx } = mockRes();
    const schema = z.object({ email: z.string().email() });
    const result = schema.safeParse({ email: 'bad' });
    expect(result.success).toBe(false);
    const zodErr = (result as { error: ZodError }).error;

    errorHandler(zodErr, req, res, next);
    expect(ctx.statusCode).toBe(400);
    const body = ctx.body as { error: string; details: Array<{ field: string; message: string }> };
    expect(body.error).toBe('Validation Error');
    expect(body.details.length).toBeGreaterThan(0);
    expect(body.details[0].field).toBe('email');
  });

  it('handles PostgreSQL unique constraint (23505) with 409', () => {
    const { res, ctx } = mockRes();
    const pgErr = Object.assign(new Error('duplicate key'), { code: '23505' });
    errorHandler(pgErr, req, res, next);
    expect(ctx.statusCode).toBe(409);
  });

  it('handles PostgreSQL FK violation (23503) with 409', () => {
    const { res, ctx } = mockRes();
    const pgErr = Object.assign(new Error('fk violation'), { code: '23503' });
    errorHandler(pgErr, req, res, next);
    expect(ctx.statusCode).toBe(409);
  });

  it('handles unknown error with 500', () => {
    const { res, ctx } = mockRes();
    errorHandler(new Error('boom'), req, res, next);
    expect(ctx.statusCode).toBe(500);
  });
});

describe('AppError', () => {
  it('sets statusCode and isOperational correctly', () => {
    const err = new AppError('Forbidden', 403);
    expect(err.statusCode).toBe(403);
    expect(err.isOperational).toBe(true);
    expect(err.message).toBe('Forbidden');
  });

  it('defaults statusCode to 500', () => {
    const err = new AppError('Oops');
    expect(err.statusCode).toBe(500);
  });
});
