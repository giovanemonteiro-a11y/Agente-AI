import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';

function mockReqRes(body: unknown) {
  const req = { body } as Request;
  const res = {} as Response;
  const errors: unknown[] = [];
  const next: NextFunction = (err?: unknown) => {
    if (err !== undefined) errors.push(err);
  };
  return { req, res, next, errors };
}

describe('validate middleware', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  });

  it('passes valid body through and calls next()', () => {
    const { req, res, next, errors } = mockReqRes({ name: 'Alice', age: 30 });
    validate(schema)(req, res, next);
    expect(errors).toHaveLength(0);
    expect(req.body).toEqual({ name: 'Alice', age: 30 });
  });

  it('calls next(ZodError) when body is invalid', () => {
    const { req, res, next, errors } = mockReqRes({ name: '', age: -1 });
    validate(schema)(req, res, next);
    expect(errors).toHaveLength(1);
    const err = errors[0] as z.ZodError;
    expect(err).toBeInstanceOf(z.ZodError);
    expect(err.errors.length).toBeGreaterThan(0);
  });

  it('calls next(ZodError) when required field is missing', () => {
    const { req, res, next, errors } = mockReqRes({ name: 'Bob' });
    validate(schema)(req, res, next);
    expect(errors).toHaveLength(1);
  });

  it('strips unknown fields (Zod default behaviour)', () => {
    const { req, res, next, errors } = mockReqRes({
      name: 'Alice',
      age: 25,
      unknown: 'field',
    });
    validate(schema)(req, res, next);
    expect(errors).toHaveLength(0);
    // Zod strips unknown keys by default
    expect((req.body as Record<string, unknown>).unknown).toBeUndefined();
  });
});
