import { describe, it, expect, beforeEach, vi } from "vitest";

// mock server-only marker (otherwise it throws at import time)
vi.mock("server-only", () => ({}));

// mock 整個 gemini-client
vi.mock("./gemini-client", () => ({
  SchemaType: { ARRAY: "ARRAY", OBJECT: "OBJECT", STRING: "STRING" },
  getGeminiModel: vi.fn(),
}));

import { generateDietPlan } from "./generate-diet";
import { getGeminiModel } from "./gemini-client";

const baseInput = {
  gender: "M" as const,
  age: 30,
  goal: "減脂",
  weightKg: 78,
  bodyFatPct: 22,
  bmrKcal: 1620,
  classDays: ["Mon", "Thu"],
  gymDays: [],
};
const promptTemplate = "test prompt {{gender}}";

describe("generateDietPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("沒有 API key 時 fallback", async () => {
    vi.mocked(getGeminiModel).mockReturnValue(null);
    const r = await generateDietPlan(baseInput, "2026-05-12", promptTemplate);
    expect(r.source).toBe("fallback");
    expect(r.data).toEqual([]);
  });

  it("AI 成功時 source=ai", async () => {
    const fakeData = [
      {
        date: "2026-05-12",
        breakfast: "燕麥",
        lunch: "雞胸 150g",
        dinner: "鮭魚 120g",
        snacks: "希臘優格",
      },
    ];
    vi.mocked(getGeminiModel).mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => JSON.stringify(fakeData) },
      }),
    } as never);
    const r = await generateDietPlan(baseInput, "2026-05-12", promptTemplate);
    expect(r.source).toBe("ai");
    expect(r.data).toHaveLength(1);
    expect(r.data[0].breakfast).toBe("燕麥");
  });

  it("AI 回傳空陣列時 fallback", async () => {
    vi.mocked(getGeminiModel).mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => "[]" },
      }),
    } as never);
    const r = await generateDietPlan(baseInput, "2026-05-12", promptTemplate);
    expect(r.source).toBe("fallback");
  });

  it("AI 拋錯時 fallback", async () => {
    vi.mocked(getGeminiModel).mockReturnValue({
      generateContent: vi.fn().mockRejectedValue(new Error("network")),
    } as never);
    const r = await generateDietPlan(baseInput, "2026-05-12", promptTemplate);
    expect(r.source).toBe("fallback");
    expect(r.error).toContain("network");
  });
});
