import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./gemini-client", () => ({
  SchemaType: {
    ARRAY: "ARRAY",
    OBJECT: "OBJECT",
    STRING: "STRING",
    NUMBER: "NUMBER",
    INTEGER: "INTEGER",
  },
  getGeminiModel: vi.fn(),
}));

import { generateFullWeeklyPlan } from "./generate-full-weekly-plan";
import { getGeminiModel } from "./gemini-client";

const baseInput = {
  student: {
    gender: "M" as const,
    age: 30,
    goal: "減脂",
    weeklyClassCount: 2,
    weeklyGymCount: 4,
  },
  inbody: {
    weightKg: 78,
    bodyFatPct: 22,
    skeletalMuscleKg: 33,
    bmrKcal: 1620,
    bmi: 25,
    visceralFatLevel: 8,
  },
  sessionSummary: "槓鈴臥推 3 組，最後一組 70kg×6 RPE9；啞鈴飛鳥 3 組，最後一組 12kg×10 RPE 8",
  inbodyDelta: "體重 -0.5kg、體脂 -0.5%、肌肉 +0.2kg",
  startDate: "2026-05-12",
  daySpecs: [
    { date: "2026-05-12", dayOfWeek: 1, isClassDay: false },
    { date: "2026-05-13", dayOfWeek: 2, isClassDay: true },
    { date: "2026-05-14", dayOfWeek: 3, isClassDay: false },
    { date: "2026-05-15", dayOfWeek: 4, isClassDay: false },
    { date: "2026-05-16", dayOfWeek: 5, isClassDay: true },
    { date: "2026-05-17", dayOfWeek: 6, isClassDay: false },
    { date: "2026-05-18", dayOfWeek: 0, isClassDay: false },
  ],
  promptTemplate: "test prompt for {{goal}}",
};

const fakeAiResponse = {
  overallMessage: "本週訓練表現穩定，繼續保持。",
  days: baseInput.daySpecs.map((d) => ({
    date: d.date,
    walkingStepsTarget: 9000,
    cardioMinutesTarget: 25,
    mealBreakfast: "燕麥+蛋白粉",
    mealLunch: "雞胸 150g + 糙米飯",
    mealDinner: "鮭魚 + 沙拉",
    mealSnacks: "希臘優格",
    waterTargetMl: 2800,
    sleepTargetHoursMin: 7,
    sleepTargetHoursMax: 9,
    extraExercises: [
      { name: "棒式", sets: 3, reps: 30 },
    ],
  })),
};

describe("generateFullWeeklyPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("沒有 API key 時 fallback", async () => {
    vi.mocked(getGeminiModel).mockReturnValue(null);
    const r = await generateFullWeeklyPlan(baseInput);
    expect(r.source).toBe("fallback");
    expect(r.data.days).toEqual([]);
    expect(r.data.overallMessage).toBe("");
  });

  it("AI 成功 source=ai，回傳全部 7 天", async () => {
    vi.mocked(getGeminiModel).mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => JSON.stringify(fakeAiResponse) },
      }),
    } as never);
    const r = await generateFullWeeklyPlan(baseInput);
    expect(r.source).toBe("ai");
    expect(r.data.days).toHaveLength(7);
    expect(r.data.overallMessage).toBe("本週訓練表現穩定，繼續保持。");
    expect(r.data.days[0].walkingStepsTarget).toBe(9000);
    expect(r.data.days[0].extraExercises[0].name).toBe("棒式");
  });

  it("AI 拋錯 fallback", async () => {
    vi.mocked(getGeminiModel).mockReturnValue({
      generateContent: vi.fn().mockRejectedValue(new Error("network")),
    } as never);
    const r = await generateFullWeeklyPlan(baseInput);
    expect(r.source).toBe("fallback");
    expect(r.error).toContain("network");
  });

  it("AI 回傳缺少 days 欄位 fallback", async () => {
    vi.mocked(getGeminiModel).mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => '{"overallMessage":"hi"}' },
      }),
    } as never);
    const r = await generateFullWeeklyPlan(baseInput);
    expect(r.source).toBe("fallback");
  });
});
