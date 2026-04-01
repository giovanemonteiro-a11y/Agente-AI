import { z } from 'zod';

export const createStrategySchema = z.object({
  objectives: z.string().min(1, 'Objectives are required').max(5000),
  positioning: z.string().min(1, 'Positioning is required').max(5000),
  differentials: z.string().min(1, 'Differentials are required').max(5000),
  tone: z.string().min(1, 'Tone is required').max(2000),
  products: z.string().max(5000).optional().default(''),
  expected_results: z.string().max(5000).optional().default(''),
});

export const strategyHighlightSchema = z.object({
  fieldName: z.string().min(1).max(100),
});

export type CreateStrategyInput = z.infer<typeof createStrategySchema>;
