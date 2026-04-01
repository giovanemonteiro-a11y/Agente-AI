import { z } from 'zod';

const SmartObjectiveSchema = z.object({
  objective: z.string(),
  metric: z.string(),
  deadline: z.string(),
  currentBaseline: z.string().optional(),
});

const ToneOfVoiceSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  avoid: z.string(),
});

export const SummaryOutputSchema = z.object({
  summary: z.object({
    clientOverview: z.string(),
    mainObjective: z.string(),
    smartObjectives: z.array(SmartObjectiveSchema),
    positioningStatement: z.string(),
    uniqueValueProposition: z.string(),
    differentials: z.array(z.string()),
    mainChallenges: z.array(z.string()),
    targetAudienceOverview: z.string(),
    competitiveContext: z.string(),
    keyInsights: z.array(z.string()),
  }),
  brandProfile: z.object({
    toneOfVoice: ToneOfVoiceSchema,
    brandPersonality: z.array(z.string()),
    brandValues: z.array(z.string()),
    communicationStyle: z.string(),
    visualIdentityNotes: z.string().optional(),
    doList: z.array(z.string()),
    dontList: z.array(z.string()),
  }),
});

export type SummaryOutput = z.infer<typeof SummaryOutputSchema>;
