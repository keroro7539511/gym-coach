import { describe, it, expect } from "vitest";
import { studentInputSchema } from "./student";

describe("studentInputSchema", () => {
  const valid = {
    name: "王小明",
    gender: "M" as const,
    goal: "muscle_gain" as const,
    weeklyClassCount: 2,
    weeklyGymCount: 4,
  };

  it("接受有效輸入", () => {
    expect(() => studentInputSchema.parse(valid)).not.toThrow();
  });

  it("拒絕空姓名", () => {
    expect(() => studentInputSchema.parse({ ...valid, name: "" })).toThrow();
  });

  it("拒絕非法 goal", () => {
    expect(() =>
      studentInputSchema.parse({ ...valid, goal: "lazy" as never })
    ).toThrow();
  });

  it("goal=custom 時必須有 customGoal", () => {
    expect(() =>
      studentInputSchema.parse({ ...valid, goal: "custom" })
    ).toThrow();
    expect(() =>
      studentInputSchema.parse({
        ...valid,
        goal: "custom",
        customGoal: "增加爆發力",
      })
    ).not.toThrow();
  });

  it("拒絕 weeklyClassCount 為負或大於 7", () => {
    expect(() =>
      studentInputSchema.parse({ ...valid, weeklyClassCount: -1 })
    ).toThrow();
    expect(() =>
      studentInputSchema.parse({ ...valid, weeklyClassCount: 8 })
    ).toThrow();
  });
});
