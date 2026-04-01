import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  loginUser,
  refreshUserToken,
  getMeById,
  changeUserPassword,
} from '../services/auth.service';
import { updatePasswordAndResetFlag } from '../repositories/users.repository';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  try {
    const result = await loginUser({ email, password });
    res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    // Re-throw AppErrors (auth failures) as-is
    if (err instanceof AppError) throw err;
    // DB connection errors → friendly message
    const msg = (err as Error).message || '';
    if (msg === '' || msg.includes('connect') || msg.includes('ECONNREFUSED')) {
      throw new AppError('Service temporarily unavailable. Database not reachable.', 503);
    }
    throw err;
  }
});

export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Refresh token is required', 400);
  }

  const tokens = await refreshUserToken(token);

  res.status(200).json(tokens);
});

export const logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  // Stateless JWT — client just discards tokens
  // If using a token blacklist/redis, add invalidation here
  res.status(200).json({ message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const user = await getMeById(req.user.userId);
  res.status(200).json(user);
});

export const changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('currentPassword and newPassword are required', 400);
  }

  await changeUserPassword(req.user.userId, currentPassword, newPassword);
  res.status(200).json({ message: 'Password changed successfully' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const { newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new AppError('newPassword is required and must be at least 8 characters', 400);
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await updatePasswordAndResetFlag(req.user.userId, hash);

  res.status(200).json({ message: 'Password reset successfully' });
});

export const googleAuthUrl = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ error: 'Google OAuth not implemented' });
});

export const googleCallback = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ error: 'Google OAuth not implemented' });
});
