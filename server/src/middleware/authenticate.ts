import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { JWTPayload } from '../types/index';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  // SSE connections cannot send headers — accept token as query param fallback
  const queryToken = req.query.token as string | undefined;

  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : queryToken ?? null;

  if (!rawToken) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid authorization header' });
    return;
  }

  const token = rawToken;

  try {
    const payload: JWTPayload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'TokenExpiredError'
        ? 'Token expired'
        : 'Invalid token';
    res.status(401).json({ error: 'Unauthorized', message });
  }
}
