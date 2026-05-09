import "server-only";
import type { Schema } from "@google/generative-ai";
import { getGeminiModel, SchemaType } from "./gemini-client";

export interface DietPromptInput {
  gender: "M" | "F";
  age: number | null;
  goal: string; // 增肌 / 減脂 / 體能 / 其他
  weightKg: number | null;
  bodyFatPct: number | null;
  bmrKcal: number | null;
  classDays: string[]; // ['Mon', 'Thu']
  gymDays: string[];
}

export interface DailyMeal {
  date: string; // YYYY-MM-DD
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
}

export type DietPlanOutput = DailyMeal[];

const FALLBACK: DietPlanOutput = []; // 空陣列 → UI 顯示「待手動填」

const DIET_SCHEMA: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      date: { type: SchemaType.STRING },
      breakfast: { type: SchemaType.STRING },
      lunch: { type: SchemaType.STRING },
      dinner: { type: SchemaType.STRING },
      snacks: { type: SchemaType.STRING },
    },
    required: ["date", "breakfast", "lunch", "dinner", "snacks"],
  },
};

export async function generateDietPlan(
  input: DietPromptInput,
  startDate: string,
  promptTemplate: string
): Promise<{ data: DietPlanOutput; source: "ai" | "fallback"; error?: string }> {
  const model = getGeminiModel();
  if (!model) {
    return { data: FALLBACK, source: "fallback", error: "GEMINI_API_KEY not set" };
  }

  const filled = promptTemplate
    .replace("{{gender}}", input.gender === "M" ? "男" : "女")
    .replace("{{age}}", input.age?.toString() ?? "未知")
    .replace("{{goal}}", input.goal)
    .replace("{{weight}}", input.weightKg?.toString() ?? "未知")
    .replace("{{bodyFatPct}}", input.bodyFatPct?.toString() ?? "未知")
    .replace("{{bmr}}", input.bmrKcal?.toString() ?? "未知")
    .replace("{{classDays}}", input.classDays.join(", ") || "無")
    .replace("{{gymDays}}", input.gymDays.join(", ") || "無");

  const fullPrompt = `${filled}\n\n起始日期：${startDate}（共 7 天，每天一筆，date 用 YYYY-MM-DD）`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: DIET_SCHEMA,
      },
    });
    const json = result.response.text();
    const parsed = JSON.parse(json) as DietPlanOutput;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Empty diet plan");
    }
    return { data: parsed, source: "ai" };
  } catch (err) {
    console.warn("[ai] diet generation failed:", err);
    return {
      data: FALLBACK,
      source: "fallback",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
