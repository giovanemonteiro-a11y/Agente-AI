import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../config/jwt';
import { findUserByEmail, findUserById, updatePasswordAndResetFlag, UserRow } from '../repositories/users.repository';
import { JWTPayload, UserRole } from '../types/index';
import { AppError } from '../middleware/errorHandler';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    must_reset_password: boolean;
    modules: string[];
    created_at: Date;
  };
  accessToken: string;
  refreshToken: string;
}

export async function loginUser(credentials: LoginCredentials): Promise<AuthResult> {
  const { email, password } = credentials;

  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const passwordValid = await bcrypt.compare(password, user.password_hash);
  if (!passwordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    modules: user.modules ?? [],
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      must_reset_password: user.must_reset_password ?? false,
      modules: user.modules ?? [],
      created_at: user.created_at,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshUserToken(token: string): Promise<AuthTokens> {
  let payload: JWTPayload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Verify user still exists
  const user = await findUserById(payload.userId);
  if (!user) {
    throw new AppError('User not found', 401);
  }

  const newPayload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    modules: user.modules ?? [],
  };

  return {
    accessToken: signAccessToken(newPayload),
    refreshToken: signRefreshToken(newPayload),
  };
}

export async function getMeById(userId: string): Promise<Omit<UserRow, 'password_hash'>> {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const { password_hash: _ph, ...safeUser } = user;
  return safeUser;
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    throw new AppError('Current password is incorrect', 400);
  }

  const hash = await bcrypt.hash(newPassword, 12);

  // Update password_hash and clear must_reset_password flag
  await updatePasswordAndResetFlag(userId, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function buildTokenPair(payload: JWTPayload): AuthTokens {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export { verifyRefreshToken };
