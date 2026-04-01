import { query } from '../config/database';
import { UserRole } from '../types/index';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  must_reset_password: boolean;
  modules: string[];
  created_at: Date;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    'SELECT id, name, email, password_hash, role, must_reset_password, modules, created_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    'SELECT id, name, email, password_hash, role, must_reset_password, modules, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
  role: UserRole
): Promise<UserRow> {
  const result = await query<UserRow>(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, email, passwordHash, role]
  );
  return result.rows[0];
}

export async function updateUser(
  id: string,
  fields: Partial<Pick<UserRow, 'name' | 'email' | 'role' | 'password_hash'>>
): Promise<UserRow | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (updates.length === 0) return null;

  values.push(id);
  const result = await query<UserRow>(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await query('DELETE FROM users WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function listUsers(limit: number = 50, offset: number = 0): Promise<UserRow[]> {
  const result = await query<UserRow>(
    'SELECT id, name, email, role, must_reset_password, modules, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return result.rows;
}

export async function countUsers(): Promise<number> {
  const result = await query<{ count: string }>('SELECT COUNT(*) as count FROM users');
  return parseInt(result.rows[0].count, 10);
}

export async function updatePasswordAndResetFlag(
  userId: string,
  passwordHash: string
): Promise<void> {
  await query(
    'UPDATE users SET password_hash = $1, must_reset_password = false WHERE id = $2',
    [passwordHash, userId]
  );
}

export async function findUsersByRole(role: string): Promise<UserRow[]> {
  const result = await query<UserRow>(
    'SELECT id, name, email, password_hash, role, must_reset_password, modules, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
    [role]
  );
  return result.rows;
}
