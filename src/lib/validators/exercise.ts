import { z } from "zod";

export const exerciseInputSchema = z.object({
  name: z.string().min(1, "動作名必填"),
  nameEn: z.string().optional(),
  muscleGroup: z.enum([
    "chest",
    "back",
    "legs",
    "shoulder",
    "arm",
    "core",
    "small_muscles",
  ]),
  equipment: z.string().optional(),
  demoImageUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
});

export type ExerciseInput = z.infer<typeof exerciseInputSchema>;
