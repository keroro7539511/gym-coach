import { describe, it, expect } from "vitest";
import { recommendDailyActivity } from "./daily-activity";

describe("recommendDailyActivity", () => {
  it("增肌目標非上課日：步數 5000-7000，有氧 0-15", () => {
    const r = recommendDailyActivity({
      goal: "muscle_gain",
      isClassDay: false,
      bmi: 22,
    });
    expect(r.stepsTarget).toBeGreaterThanOrEqual(5000);
    expect(r.stepsTarget).toBeLessThanOrEqual(7000);
    expect(r.cardioMinutesTarget).toBeLessThanOrEqual(15);
  });

  it("增肌目標上課日：步數打對折、有氧 = 0", () => {
    const nonClass = recommendDailyActivity({
      goal: "muscle_gain",
      isClassDay: false,
      bmi: 22,
    });
    const classDay = recommendDailyActivity({
      goal: "muscle_gain",
      isClassDay: true,
      bmi: 22,
    });
    expect(classDay.stepsTarget).toBeLessThan(nonClass.stepsTarget);
    expect(classDay.cardioMinutesTarget).toBe(0);
  });

  it("減脂 + 高 BMI（≥30）→ 步數取上限", () => {
    const r = recommendDailyActivity({
      goal: "fat_loss",
      isClassDay: false,
      bmi: 32,
    });
    expect(r.stepsTarget).toBe(12000);
  });

  it("減脂 + 中 BMI（25–30）→ 步數取上限 −1000", () => {
    const r = recommendDailyActivity({
      goal: "fat_loss",
      isClassDay: false,
      bmi: 27,
    });
    expect(r.stepsTarget).toBe(11000);
  });

  it("減脂 + 低 BMI（<25）→ 取中間", () => {
    const r = recommendDailyActivity({
      goal: "fat_loss",
      isClassDay: false,
      bmi: 22,
    });
    expect(r.stepsTarget).toBe(10000);
  });

  it("體能目標", () => {
    const r = recommendDailyActivity({
      goal: "fitness",
      isClassDay: false,
      bmi: 22,
    });
    expect(r.stepsTarget).toBeGreaterThanOrEqual(8000);
    expect(r.stepsTarget).toBeLessThanOrEqual(10000);
    expect(r.cardioMinutesTarget).toBeGreaterThanOrEqual(15);
    expect(r.cardioMinutesTarget).toBeLessThanOrEqual(30);
  });

  it("custom 目標 fallback 到 fitness", () => {
    const custom = recommendDailyActivity({
      goal: "custom",
      isClassDay: false,
      bmi: 22,
    });
    const fitness = recommendDailyActivity({
      goal: "fitness",
      isClassDay: false,
      bmi: 22,
    });
    expect(custom).toEqual(fitness);
  });

  it("BMI 未提供（null）時，減脂取中間", () => {
    const r = recommendDailyActivity({
      goal: "fat_loss",
      isClassDay: false,
      bmi: null,
    });
    expect(r.stepsTarget).toBe(10000);
  });
});
