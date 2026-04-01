import { z } from 'zod';

const MEETING_TYPES = ['kickoff', 'checkin'] as const;

export const createMeetingSchema = z.object({
  type: z.enum(MEETING_TYPES, { required_error: 'Meeting type is required' }),
  recorded_at: z
    .string()
    .datetime({ message: 'recorded_at must be an ISO 8601 datetime' })
    .optional(),
  participants: z.array(z.string().max(255)).max(50).optional().default([]),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
