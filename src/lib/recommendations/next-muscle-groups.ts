export type Goal = "muscle_gain" | "fat_loss" | "fitness" | "custom";
export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulder"
  | "arm"
  | "core"
  | "small_muscles";

export interface NextMuscleInput {
  goal: Goal;
  sessionNumber: number;
  weeklyClassCount: number;
  lastSessionAvgRpe?: number | null;
}

const FIRST_THREE: Record<number, MuscleGroup[]> = {
  1: ["chest", "small_muscles"],
  2: ["legs", "small_muscles"],
  3: ["back", "small_muscles"],
};

const MUSCLE_GAIN_CYCLE: MuscleGroup[][] = [
  ["chest", "small_muscles"],
  ["legs", "small_muscles"],
  ["back", "small_muscles"],
];

const FAT_LOSS_CYCLE: MuscleGroup[][] = [
  ["chest", "arm"], // 推日
  ["back", "arm"], // 拉日
  ["legs", "core"],
];

/**
 * 規則 R1：依目標 + 一週次數 + 上次平均 RPE 決定下次訓練肌群
 *
 * - 前 3 堂硬編碼（胸/腿/背 + 小肌群）
 * - 一週 1 堂或 fitness 模式 → 全身
 * - 一週 2 堂 → 上下肢分化
 * - 一週 ≥ 3 堂 → 嚴格分化（單肌群循環）
 * - 上次平均 RPE > 8.5 → 跳到下一個循環項
 */
export function recommendNextMuscleGroups(
  input: NextMuscleInput
): MuscleGroup[] {
  // 前 3 堂硬編碼
  if (FIRST_THREE[input.sessionNumber]) {
    return FIRST_THREE[input.sessionNumber];
  }

  const goal: Goal = input.goal === "custom" ? "fitness" : input.goal;

  // 一週只 1 堂或體能模式 → 全身
  if (input.weeklyClassCount <= 1 || goal === "fitness") {
    return ["chest", "back", "legs"];
  }

  // 一週 2 堂 → 上下肢分化
  if (input.weeklyClassCount === 2) {
    // session 4, 6, 8... → 上肢；session 5, 7, 9... → 下肢
    const isUpperDay = (input.sessionNumber - 4) % 2 === 0;
    return isUpperDay ? ["chest", "back"] : ["legs", "core"];
  }

  // 一週 ≥ 3 堂：嚴格分化
  // 索引從 (sessionNumber - 4) % 3 開始
  let index = (input.sessionNumber - 4) % 3;
  if (index < 0) index = (index + 3) % 3;

  // 疲勞調整：上次平均 RPE > 8.5 → 跳到下一循環項
  if (input.lastSessionAvgRpe != null && input.lastSessionAvgRpe > 8.5) {
    index = (index + 1) % 3;
  }

  const cycle = goal === "fat_loss" ? FAT_LOSS_CYCLE : MUSCLE_GAIN_CYCLE;
  return cycle[index];
}
