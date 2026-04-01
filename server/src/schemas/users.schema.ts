import { z } from 'zod';

const USER_ROLES = ['super_admin', 'lideranca', 'aquisicao', 'coordenador', 'account', 'designer', 'gestor_trafego', 'tech_crm'] as const;

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).transform((v) => v.trim()),
  email: z.string().email('Invalid email').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(USER_ROLES, { required_error: 'role is required' }),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).transform((v) => v.trim()).optional(),
  email: z.string().email('Invalid email').max(255).optional(),
  role: z.enum(USER_ROLES).optional(),
  password: z.string().min(8).max(128).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
