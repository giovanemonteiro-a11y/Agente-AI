import { z } from 'zod';

const positiveNumber = z.number().nonnegative().optional();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const createReportSchema = z.object({
  campaign_name: z
    .string({ required_error: 'campaign_name is required' })
    .min(1)
    .max(255),
  period_start: dateString,
  period_end: dateString,
  roi: positiveNumber,
  roas: positiveNumber,
  cpa: positiveNumber,
  ctr: z.number().min(0).max(100).optional(),
  cpm: positiveNumber,
  impressions: z.number().int().nonnegative().optional(),
  conversions: z.number().int().nonnegative().optional(),
  spend: positiveNumber,
  extra_metrics_json: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.period_end >= data.period_start,
  { message: 'period_end must be on or after period_start', path: ['period_end'] }
);

export type CreateReportInput = z.infer<typeof createReportSchema>;
