import { z } from 'zod';

const BRIEFING_TYPES = ['designer', 'traffic', 'account', 'site'] as const;
const DESIGNER_SCOPES = [
  'social_media',
  'campanha',
  'landing_page',
  'site',
  'ecommerce',
  'branding',
  'miv',
] as const;

export const generateBriefingSchema = z.object({
  type: z.enum(BRIEFING_TYPES, {
    required_error: 'type is required',
    invalid_type_error: `type must be one of: ${BRIEFING_TYPES.join(', ')}`,
  }),
  designerScope: z.enum(DESIGNER_SCOPES).optional(),
});

export const pushMondaySchema = z.object({
  boardId: z.string().max(100).optional(),
  groupId: z.string().max(100).optional(),
});

export type GenerateBriefingInput = z.infer<typeof generateBriefingSchema>;
