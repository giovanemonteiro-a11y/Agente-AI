import { z } from 'zod';

const DemographicProfileSchema = z.object({
  ageRange: z.string(),
  gender: z.string(),
  location: z.string(),
  income: z.string(),
  education: z.string(),
  occupation: z.string(),
  familySituation: z.string(),
});

const CohortSchema = z.object({
  characteristicPhrase: z.string(),
  anthropologicalDescription: z.string(),
  demographicProfile: DemographicProfileSchema,
  behaviorLifestyle: z.string(),
  audienceSize: z.string(),
  reachPotential: z.string(),
  triggers: z.array(z.string()).min(1),
  alternativeSolutions: z.array(z.string()),
  indicators: z.array(z.string()),
  editorialLines: z.array(z.string()),
});

export const CohortsOutputSchema = z.object({
  cohorts: z.array(CohortSchema).min(3),
});

export type CohortItem = z.infer<typeof CohortSchema>;
export type CohortsOutput = z.infer<typeof CohortsOutputSchema>;
