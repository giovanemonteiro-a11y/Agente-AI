import { z } from 'zod';

// ─── Goals ────────────────────────────────────────────────────────────────────

export const createGoalSchema = z.object({
  title: z.string().min(1).max(100),
  period_type: z.enum(['monthly', 'quarterly']),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  total_goal: z.number().min(0),
  expansion_goal: z.number().min(0),
  drx_goal: z.number().min(0),
  activation_goal: z.number().min(0),
  referral_goal: z.number().min(0),
});

export const updateGoalSchema = createGoalSchema.partial();

// ─── Commission Rules ──────────────────────────────────────────────────────────

export const updateCommissionRuleSchema = z.object({
  fixed_pct: z.number().min(0).max(100).optional(),
  fixed_value: z.number().min(0).optional(),
  coordinator_pct: z.number().min(0).max(100).optional(),
  is_active: z.boolean().optional(),
});

export const updateCommissionTierSchema = z.object({
  tier_name: z.string().min(1).max(50).optional(),
  min_pct: z.number().min(0).optional(),
  max_pct: z.number().min(0).nullable().optional(),
  commission_pct: z.number().min(0).max(100).optional(),
});

// ─── Monetizations ────────────────────────────────────────────────────────────

export const createMonetizationSchema = z.object({
  client_name: z.string().min(1).max(255),
  client_id: z.string().uuid().optional(),
  account_user_id: z.string().uuid(),
  monetization_type: z.enum(['expansao', 'drx', 'ativacao', 'indicacao']),
  product_service: z.string().min(1).max(255),
  value: z.number().min(0),
  temperature: z.enum(['quente', 'morno', 'frio']).default('frio'),
  status: z.enum(['proposta', 'fechada', 'perdida']).default('proposta'),
  reference_month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD (primeiro dia do mes)'),
  notes: z.string().optional(),
});

export const updateMonetizationSchema = z.object({
  client_name: z.string().min(1).max(255).optional(),
  monetization_type: z.enum(['expansao', 'drx', 'ativacao', 'indicacao']).optional(),
  product_service: z.string().min(1).max(255).optional(),
  value: z.number().min(0).optional(),
  temperature: z.enum(['quente', 'morno', 'frio']).optional(),
  status: z.enum(['proposta', 'fechada', 'perdida']).optional(),
  notes: z.string().optional(),
  closed_at: z.string().datetime().optional(),
});

// ─── Commissions ──────────────────────────────────────────────────────────────

export const calculateCommissionsSchema = z.object({
  reference_month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD (primeiro dia do mes)'),
});

export const approveCommissionSchema = z.object({
  status: z.enum(['approved', 'paid']),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateMonetizationInput = z.infer<typeof createMonetizationSchema>;
export type UpdateMonetizationInput = z.infer<typeof updateMonetizationSchema>;
export type CalculateCommissionsInput = z.infer<typeof calculateCommissionsSchema>;
