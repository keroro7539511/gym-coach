import { describe, it, expect } from "vitest";
import { generateBasicRecommendations } from "./basic-inbody";

const baseInbody = {
  weightKg: 70,
  bodyFatPct: 20,
  bmrKcal: 1500,
  visceralFatLevel: 8,
};

describe("generateBasicRecommendations", () => {
  it("男性體脂 > 25% + 增肌目標 → 建議先減脂", () => {
    const result = generateBasicRecommendations({
      gender: "M",
      goal: "muscle_gain",
      inbody: { ...baseInbody, bodyFatPct: 28 },
    });
    expect(result).toContainEqual(
      expect.objectContaining({ key: "fat_loss_first" })
    );
  });

  it("女性體脂 > 30% + 增肌目標 → 建議先減脂", () => {
    const result = generateBasicRecommendations({
      gender: "F",
      goal: "muscle_gain",
      inbody: { ...baseInbody, bodyFatPct: 32 },
    });
    expect(result).toContainEqual(
      expect.objectContaining({ key: "fat_loss_first" })
    );
  });

  it("男性體脂 22% + 增肌目標 → 不觸發先減脂", () => {
    const result = generateBasicRecommendations({
      gender: "M",
      goal: "muscle_gain",
      inbody: { ...baseInbody, bodyFatPct: 22 },
    });
    expect(result).not.toContainEqual(
      expect.objectContaining({ key: "fat_loss_first" })
    );
  });

  it("BMR < 1300 → 提醒基礎代謝偏低", () => {
    const result = generateBasicRecommendations({
      gender: "M",
      goal: "fitness",
      inbody: { ...baseInbody, bmrKcal: 1200 },
    });
    expect(result).toContainEqual(
      expect.objectContaining({ key: "low_bmr" })
    );
  });

  it("內臟脂肪 > 10 → 觸發優先處理", () => {
    const result = generateBasicRecommendations({
      gender: "M",
      goal: "fat_loss",
      inbody: { ...baseInbody, visceralFatLevel: 12 },
    });
    expect(result).toContainEqual(
      expect.objectContaining({ key: "high_visceral_fat" })
    );
  });

  it("健康體型 + 體能目標 → 回傳一條鼓勵性訊息", () => {
    const result = generateBasicRecommendations({
      gender: "M",
      goal: "fitness",
      inbody: baseInbody,
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContainEqual(
      expect.objectContaining({ key: "default_ok" })
    );
  });
});
