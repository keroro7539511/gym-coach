import { describe, it, expect } from "vitest";
import { recommendNextMuscleGroups } from "./next-muscle-groups";

const baseInput = {
  goal: "muscle_gain" as const,
  sessionNumber: 4,
  weeklyClassCount: 3,
  lastSessionAvgRpe: 7,
};

describe("recommendNextMuscleGroups", () => {
  it("第 1 堂 → 胸 + 小肌群（硬編碼）", () => {
    const r = recommendNextMuscleGroups({ ...baseInput, sessionNumber: 1 });
    expect(r).toEqual(["chest", "small_muscles"]);
  });

  it("第 2 堂 → 腿 + 小肌群", () => {
    const r = recommendNextMuscleGroups({ ...baseInput, sessionNumber: 2 });
    expect(r).toEqual(["legs", "small_muscles"]);
  });

  it("第 3 堂 → 背 + 小肌群", () => {
    const r = recommendNextMuscleGroups({ ...baseInput, sessionNumber: 3 });
    expect(r).toEqual(["back", "small_muscles"]);
  });

  it("一週 1 堂課 → 全身性課表", () => {
    const r = recommendNextMuscleGroups({
      ...baseInput,
      sessionNumber: 5,
      weeklyClassCount: 1,
    });
    expect(r).toContain("chest");
    expect(r).toContain("back");
    expect(r).toContain("legs");
  });

  it("增肌一週 3 堂 → 第 4 堂 chest 開始三分化", () => {
    expect(
      recommendNextMuscleGroups({ ...baseInput, sessionNumber: 4 })
    ).toEqual(["chest", "small_muscles"]);
    expect(
      recommendNextMuscleGroups({ ...baseInput, sessionNumber: 5 })
    ).toEqual(["legs", "small_muscles"]);
    expect(
      recommendNextMuscleGroups({ ...baseInput, sessionNumber: 6 })
    ).toEqual(["back", "small_muscles"]);
    expect(
      recommendNextMuscleGroups({ ...baseInput, sessionNumber: 7 })
    ).toEqual(["chest", "small_muscles"]); // 循環回來
  });

  it("增肌一週 2 堂 → 上下肢分化", () => {
    const r1 = recommendNextMuscleGroups({
      ...baseInput,
      sessionNumber: 4,
      weeklyClassCount: 2,
    });
    expect(r1).toContain("chest");
    expect(r1).toContain("back"); // 上肢日

    const r2 = recommendNextMuscleGroups({
      ...baseInput,
      sessionNumber: 5,
      weeklyClassCount: 2,
    });
    expect(r2).toContain("legs"); // 下肢日
  });

  it("上次平均 RPE > 8.5 → 跳到下一個循環項", () => {
    // 原本 session 4 該練 chest，但 RPE 太累 → 跳到 legs
    const r = recommendNextMuscleGroups({
      ...baseInput,
      sessionNumber: 4,
      lastSessionAvgRpe: 9,
    });
    expect(r[0]).not.toBe("chest");
  });

  it("custom 目標 fallback 到 fitness", () => {
    const r = recommendNextMuscleGroups({
      ...baseInput,
      goal: "custom",
      sessionNumber: 4,
    });
    // fitness 模式預期是全身
    expect(r.length).toBeGreaterThanOrEqual(2);
  });

  it("體能模式 → 全身（非單肌群）", () => {
    const r = recommendNextMuscleGroups({
      ...baseInput,
      goal: "fitness",
      sessionNumber: 4,
    });
    expect(r).toContain("chest");
    expect(r).toContain("back");
    expect(r).toContain("legs");
  });
});
