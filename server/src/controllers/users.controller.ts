import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  listUsers as listUsersRepo,
  countUsers,
  createUser as createUserRepo,
  findUserById,
  updateUser as updateUserRepo,
  deleteUser as deleteUserRepo,
  findUserByEmail,
} from '../repositories/users.repository';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

export const listUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const role = req.query.role as string | undefined;

  let users;
  if (role) {
    const { findUsersByRole } = await import('../repositories/users.repository');
    users = await findUsersByRole(role);
  } else {
    users = await listUsersRepo(limit, offset);
  }

  const total = await countUsers();

  // Remove password_hash from response
  const safeUsers = users.map(({ password_hash: _ph, ...u }) => u);

  res.status(200).json({ data: safeUsers, total, limit, offset });
});

export const createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body;

  // Check if email already exists
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUserRepo(name, email, passwordHash, role);

  // Set must_reset_password for new users
  const { query } = await import('../config/database');
  await query('UPDATE users SET must_reset_password = true WHERE id = $1', [user.id]);

  // Send welcome email with temporary password (non-blocking)
  import('../services/email/welcomeEmail').then(({ sendWelcomeEmail }) => {
    sendWelcomeEmail(name, email, password).catch(() => {/* logged internally */});
  });

  const { password_hash: _ph, ...safeUser } = user;
  res.status(201).json({ data: { ...safeUser, must_reset_password: true } });
});

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await findUserById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { password_hash: _ph, ...safeUser } = user;
  res.status(200).json({ data: safeUser });
});

export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;

  const existing = await findUserById(id);
  if (!existing) {
    throw new AppError('User not found', 404);
  }

  // If email is changing, check uniqueness
  if (email && email !== existing.email) {
    const emailTaken = await findUserByEmail(email);
    if (emailTaken) {
      throw new AppError('Email already in use', 409);
    }
  }

  const fields: Record<string, unknown> = {};
  if (name) fields.name = name;
  if (email) fields.email = email;
  if (role) fields.role = role;
  if (password) fields.password_hash = await bcrypt.hash(password, 12);

  const updated = await updateUserRepo(id, fields as never);
  if (!updated) {
    throw new AppError('No changes applied', 400);
  }

  const { password_hash: _ph, ...safeUser } = updated;
  res.status(200).json({ data: safeUser });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Prevent deleting yourself
  if (req.user?.userId === id) {
    throw new AppError('Cannot delete your own account', 400);
  }

  const deleted = await deleteUserRepo(id);
  if (!deleted) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({ message: 'User deleted successfully' });
});
