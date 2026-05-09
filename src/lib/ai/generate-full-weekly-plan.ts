import "server-only";
import { type Schema } from "@google/generative-ai";
import { getGeminiModel, SchemaType } from "./gemini-client";

export interface DaySpec {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0..6
  isClassDay: boolean;
}

export interface FullPlanInput {
  student: {
    gender: "M" | "F";
    age: number | null;
    goal: string;
    weeklyClassCount: number;
  };
  inbody: {
    weightKg: number | null;
    bodyFatPct: number | null;
    skeletalMuscleKg: number | null;
    bmrKcal: number | null;
    bmi: number | null;
    visceralFatLevel: number | null;
  } | null;
  sessionSummary: string;
  inbodyDelta: string;
  startDate: string;
  daySpecs: DaySpec[];
  promptTemplate: string;
}

export interface FullDayPlan {
  date: string;
  walkingStepsTarget: number;
  cardioMinutesTarget: number;
  mealBreakfast: string;
  mealLunch: string;
  mealDinner: string;
  mealSnacks: string;
  waterTargetMl: number;
  sleepTargetHoursMin: number;
  sleepTargetHoursMax: number;
  extraExercises: { name: string; sets: number; reps: number }[];
}

export interface FullPlanOutput {
  overallMessage: string;
  days: FullDayPlan[];
}

const FALLBACK: FullPlanOutput = { overallMessage: "", days: [] };

const SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    overallMessage: { type: SchemaType.STRING },
    days: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          date: { type: SchemaType.STRING },
          walkingStepsTarget: { type: SchemaType.INTEGER },
          cardioMinutesTarget: { type: SchemaType.INTEGER },
          mealBreakfast: { type: SchemaType.STRING },
          mealLunch: { type: SchemaType.STRING },
          mealDinner: { type: SchemaType.STRING },
          mealSnacks: { type: SchemaType.STRING },
          waterTargetMl: { type: SchemaType.INTEGER },
          sleepTargetHoursMin: { type: SchemaType.INTEGER },
          sleepTargetHoursMax: { type: SchemaType.INTEGER },
          extraExercises: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                sets: { type: SchemaType.INTEGER },
                reps: { type: SchemaType.INTEGER },
              },
              required: ["name", "sets", "reps"],
            },
          },
        },
        required: [
          "date",
          "walkingStepsTarget",
          "cardioMinutesTarget",
          "mealBreakfast",
          "mealLunch",
          "mealDinner",
          "mealSnacks",
          "waterTargetMl",
          "sleepTargetHoursMin",
          "sleepTargetHoursMax",
          "extraExercises",
        ],
      },
    },
  },
  required: ["overallMessage", "days"],
};

export async function generateFullWeeklyPlan(
  input: FullPlanInput
): Promise<{ data: FullPlanOutput; source: "ai" | "fallback"; error?: string }> {
  const model = getGeminiModel();
  if (!model) {
    return { data: FALLBACK, source: "fallback", error: "GEMINI_API_KEY not set" };
  }

  const prompt = buildPrompt(input);

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
      },
    });
    const json = result.response.text();
    const parsed = JSON.parse(json) as FullPlanOutput;
    if (!Array.isArray(parsed.days) || parsed.days.length === 0) {
      throw new Error("AI returned no days");
    }
    return { data: parsed, source: "ai" };
  } catch (err) {
    console.warn("[ai] full weekly plan generation failed:", err);
    return {
      data: FALLBACK,
      source: "fallback",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function buildPrompt(input: FullPlanInput): string {
  const inbody = input.inbody
    ? [
        `體重 ${input.inbody.weightKg ?? "?"}kg`,
        `體脂率 ${input.inbody.bodyFatPct ?? "?"}%`,
        `骨骼肌 ${input.inbody.skeletalMuscleKg ?? "?"}kg`,
        `BMR ${input.inbody.bmrKcal ?? "?"} kcal`,
        `BMI ${input.inbody.bmi ?? "?"}`,
        `內臟脂肪 ${input.inbody.visceralFatLevel ?? "?"}`,
      ].join("、")
    : "暫無 InBody 紀錄";

  const dayLines = input.daySpecs
    .map(
      (d) =>
        `${d.date}（星期${["日", "一", "二", "三", "四", "五", "六"][d.dayOfWeek]}${d.isClassDay ? " · 上課日" : ""}）`
    )
    .join("\n");

  return `你是專業健身教練 + 營養師。請根據以下單一學員的「本次訓練紀錄」與「InBody 現況」，量身打造下一週的每日計劃。

學員：
- 性別：${input.student.gender === "M" ? "男" : "女"}
- 年齡：${input.student.age ?? "未知"}
- 目標：${input.student.goal}
- 每週上課次數：${input.student.weeklyClassCount}

最新 InBody：${inbody}
InBody 變化：${input.inbodyDelta}

本次訓練紀錄：${input.sessionSummary}

7 天區間：
${dayLines}

請輸出 JSON，包含：
1. overallMessage：100–150 字、純中文、給整週的話。要提到本次訓練亮點 + InBody 趨勢 + 下週重點。
2. days：對應 7 天，每一筆需要：
   - date：與輸入一致
   - walkingStepsTarget：步數（依目標 + 體脂 + BMI 調整。上課日步數 = 平日的一半）
   - cardioMinutesTarget：有氧分鐘（增肌 0–15、減脂 20–40、體能 15–30；上課日 = 0）
   - mealBreakfast / mealLunch / mealDinner / mealSnacks：簡短可執行（例：「雞胸 150g + 糙米 1 碗 + 蔬菜」）
     - 上課日熱量比平日 +10%
     - 蛋白質維持 1.6g/kg 體重
   - waterTargetMl：水分目標（依體重、流汗高峰日酌量增減）
   - sleepTargetHoursMin / sleepTargetHoursMax：睡眠時數區間
   - extraExercises：補充小訓練（依本次訓練的薄弱點推 0–2 個動作；例：[{name:"棒式", sets:3, reps:30}]）。沒有就空陣列。

語氣專業簡潔。額外指示：${input.promptTemplate}`;
}
