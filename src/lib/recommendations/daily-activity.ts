export type Goal = "muscle_gain" | "fat_loss" | "fitness" | "custom";

export interface DailyActivityInput {
  goal: Goal;
  isClassDay: boolean;
  bmi?: number | null;
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
  const r = RANGES[goalKey];

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
