import { z } from "zod";

export const settingsInputSchema = z.object({
  muscleGainStepsMin: z.number().int().min(0).max(50000),
  muscleGainStepsMax: z.number().int().min(0).max(50000),
  fatLossStepsMin: z.number().int().min(0).max(50000),
  fatLossStepsMax: z.number().int().min(0).max(50000),
  fitnessStepsMin: z.number().int().min(0).max(50000),
  fitnessStepsMax: z.number().int().min(0).max(50000),
  weightAdjustPct: z.number().min(0).max(50),
  bodyFatWarnMale: z.number().min(0).max(100),
  bodyFatWarnFemale: z.number().min(0).max(100),
  aiDietPromptTemplate: z.string().min(0),
  aiMessagePromptTemplate: z.string().min(0),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
