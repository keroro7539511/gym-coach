import { z } from "zod";

export const sessionStartInputSchema = z.object({
  studentId: z.number().int().positive(),
  scheduledAt: z.string().optional(),
  // 開課時可選擇覆寫 muscle group（第 4 堂以後使用建議引擎，slice 3 才實作）
  targetMuscleGroups: z.array(z.string()).min(1).optional(),
});

export type SessionStartInput = z.infer<typeof sessionStartInputSchema>;

export const setLogInputSchema = z.object({
  sessionExerciseId: z.number().int().positive(),
  setNumber: z.number().int().positive(),
  weightKg: z.number().nonnegative().max(1000).nullable().optional(),
  reps: z.number().int().min(0).max(500).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  toFailure: z.boolean().optional(),
  heartRateBpm: z.number().int().min(0).max(300).nullable().optional(),
  notes: z.string().optional(),
});

export type SetLogInput = z.infer<typeof setLogInputSchema>;
