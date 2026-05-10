export type Goal = "muscle_gain" | "fat_loss" | "fitness" | "custom";

// 從多目標陣列取優先順序最高的單一目標（減脂 > 增肌 > 體能 > 其他）
export function primaryGoal(goals: string | string[]): Goal {
  const arr = Array.isArray(goals) ? goals : [goals];
  if (arr.includes("fat_loss")) return "fat_loss";
  if (arr.includes("muscle_gain")) return "muscle_gain";
  if (arr.includes("fitness")) return "fitness";
  return "custom";
}

export interface DailyActivityInput {
  goal: Goal;
  isClassDay: boolean;
  bmi?: number | null;
  // 自訂閾值（不傳則用預設）
  muscleGainSteps?: [number, number];
  fatLossSteps?: [number, number];
  fitnessSteps?: [number, number];
}

export interface DailyActivityOutput {
  stepsTarget: number;
  cardioMinutesTarget: number;
}

const RANGES: Record<
  Exclude<Goal, "custom">,
  { steps: [number, number]; cardio: [number, number] }
> = {
  muscle_gain: { steps: [5000, 7000], cardio: [0, 15] },
  fat_loss: { steps: [8000, 12000], cardio: [20, 40] },
  fitness: { steps: [8000, 10000], cardio: [15, 30] },
};

export function recommendDailyActivity(
  input: DailyActivityInput
): DailyActivityOutput {
  const goalKey = input.goal === "custom" ? "fitness" : input.goal;
  const ranges: Record<
    "muscle_gain" | "fat_loss" | "fitness",
    { steps: [number, number]; cardio: [number, number] }
  > = {
    muscle_gain: {
      steps: input.muscleGainSteps ?? RANGES.muscle_gain.steps,
      cardio: RANGES.muscle_gain.cardio,
    },
    fat_loss: {
      steps: input.fatLossSteps ?? RANGES.fat_loss.steps,
      cardio: RANGES.fat_loss.cardio,
    },
    fitness: {
      steps: input.fitnessSteps ?? RANGES.fitness.steps,
      cardio: RANGES.fitness.cardio,
    },
  };
  const r = ranges[goalKey];

  // 預設取中間
  let steps = Math.round((r.steps[0] + r.steps[1]) / 2);
  let cardio = Math.round((r.cardio[0] + r.cardio[1]) / 2);

  // 減脂特殊邏輯：依 BMI 決定上限
  if (goalKey === "fat_loss") {
    if (input.bmi == null) steps = (r.steps[0] + r.steps[1]) / 2;
    else if (input.bmi >= 30) steps = r.steps[1];
    else if (input.bmi >= 25) steps = r.steps[1] - 1000;
    else steps = (r.steps[0] + r.steps[1]) / 2;
  }

  // 上課日：步數取下限、有氧 = 0
  if (input.isClassDay) {
    steps = r.steps[0];
    cardio = 0;
  }

  return { stepsTarget: Math.round(steps), cardioMinutesTarget: cardio };
}
