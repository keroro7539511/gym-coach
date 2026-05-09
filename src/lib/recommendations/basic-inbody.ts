export type Gender = "M" | "F";
export type Goal = "muscle_gain" | "fat_loss" | "fitness" | "custom";

export interface InBodySnapshot {
  weightKg?: number | null;
  bodyFatPct?: number | null;
  bmrKcal?: number | null;
  visceralFatLevel?: number | null;
}

export interface Recommendation {
  key: string;
  text: string;
  severity: "info" | "warn" | "alert";
}

export interface RecommendationContext {
  gender: Gender;
  goal: Goal;
  inbody: InBodySnapshot;
  // 預設閾值，未來改由 coach_settings 注入
  bodyFatWarnMale?: number;
  bodyFatWarnFemale?: number;
}

export function generateBasicRecommendations(
  ctx: RecommendationContext
): Recommendation[] {
  const result: Recommendation[] = [];
  const fatThreshold =
    ctx.gender === "M"
      ? ctx.bodyFatWarnMale ?? 25
      : ctx.bodyFatWarnFemale ?? 30;

  const { bodyFatPct, bmrKcal, visceralFatLevel } = ctx.inbody;

  if (
    bodyFatPct != null &&
    bodyFatPct > fatThreshold &&
    ctx.goal === "muscle_gain"
  ) {
    result.push({
      key: "fat_loss_first",
      severity: "warn",
      text: `體脂率 ${bodyFatPct}% 高於 ${fatThreshold}%，建議先以減脂為主，再進入增肌期。`,
    });
  }

  if (bmrKcal != null && bmrKcal < 1300) {
    result.push({
      key: "low_bmr",
      severity: "warn",
      text: `基礎代謝率 ${bmrKcal} kcal 偏低，建議透過肌力訓練提升肌肉量、進而提升代謝。`,
    });
  }

  if (visceralFatLevel != null && visceralFatLevel > 10) {
    result.push({
      key: "high_visceral_fat",
      severity: "alert",
      text: `內臟脂肪等級 ${visceralFatLevel} 偏高，建議優先處理內臟脂肪（規律有氧 + 飲食控制）。`,
    });
  }

  if (result.length === 0) {
    result.push({
      key: "default_ok",
      severity: "info",
      text: "目前各項數值在合理區間，依目標規劃訓練即可。",
    });
  }

  return result;
}
