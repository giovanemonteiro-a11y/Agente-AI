import { z } from 'zod';

const SERVICES_SCOPE = ['social_media', 'trafego', 'site_lp'] as const;
const DESIGNER_SCOPE = [
  'social_media',
  'campanha',
  'landing_page',
  'site',
  'ecommerce',
  'branding',
  'miv',
] as const;
const CLIENT_STATUS = ['active', 'inactive', 'paused'] as const;

export const createClientSchema = z.object({
  name: z
    .string({ required_error: 'Client name is required' })
    .min(1, 'Client name cannot be empty')
    .max(255)
    .transform((v) => v.trim()),
  segment: z.string().max(255).optional(),
  services_scope: z
    .array(z.enum(SERVICES_SCOPE))
    .default([]),
  designer_scope: z
    .array(z.enum(DESIGNER_SCOPE))
    .default([]),
  contact_name: z.string().max(255).optional(),
  contact_email: z.string().email('Invalid contact email').max(255).optional().or(z.literal('')),
  contact_phone: z.string().max(50).optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD')
    .optional(),
  monday_board_id: z.string().max(100).optional(),
  sheets_sprint_url: z.string().url('Invalid Sheets URL').optional().or(z.literal('')),
  whatsapp_group_id: z.string().max(100).optional(),
});

export const updateClientSchema = createClientSchema
  .partial()
  .extend({
    status: z.enum(CLIENT_STATUS).optional(),
  });

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
