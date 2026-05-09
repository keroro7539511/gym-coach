import { z } from "zod";

const num = (max?: number) => {
  let s = z.number().nonnegative();
  if (max !== undefined) s = s.max(max);
  return s.optional();
};

export const inbodyInputSchema = z.object({
  studentId: z.number().int().positive(),
  measuredAt: z.string().min(1),

  weightKg: num(500),
  bodyFatPct: num(100),
  skeletalMuscleKg: num(200),
  bodyFatKg: num(500),
  visceralFatLevel: num(30),
  bodyAge: num(120),
  bmi: num(100),

  bmrKcal: num(5000),
  totalWaterL: num(200),
  proteinKg: num(100),

  muscleLeftArm: num(50),
  muscleRightArm: num(50),
  muscleTrunk: num(100),
  muscleLeftLeg: num(80),
  muscleRightLeg: num(80),

  fatLeftArm: num(50),
  fatRightArm: num(50),
  fatTrunk: num(100),
  fatLeftLeg: num(80),
  fatRightLeg: num(80),

  coachNotes: z.string().optional(),
});

export type InBodyInput = z.infer<typeof inbodyInputSchema>;
