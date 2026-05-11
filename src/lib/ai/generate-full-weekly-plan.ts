import "server-only";
import { type Schema } from "@google/generative-ai";
import { getGeminiModel, SchemaType } from "./gemini-client";

export interface DaySpec {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0..6
  isClassDay: boolean;
}

export interface FullPlanInput {
  geminiApiKey?: string | null;
  student: {
    gender: "M" | "F";
    age: number | null;
    goal: string;
    weeklyClassCount: number;
    weeklyGymCount: number;
    dietaryRestrictions?: string | null;
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

export interface GymExercise {
  muscleGroup: string;
  sets: number;
  reps: number;
  weightKg: number | null;
  restSeconds: number;
  notes: string | null;
}

export interface FullDayPlan {
  date: string;
  isGymDay: boolean;
  gymWorkout: GymExercise[];
  walkingStepsTarget: number;
  cardioMinutesTarget: number;
  mealBreakfast: string;
  mealLunch: string;
  mealDinner: string;
  mealSnacks: string;
  waterTargetMl: number;
  sleepTargetHoursMin: number;
  sleepTargetHoursMax: number;
  nutritionCaloriesKcal: number;
  nutritionProteinG: number;
  nutritionCarbsG: number;
  nutritionFatG: number;
  nutritionFiberG: number;
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
          isGymDay: { type: SchemaType.BOOLEAN },
          gymWorkout: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                muscleGroup: { type: SchemaType.STRING },
                sets: { type: SchemaType.INTEGER },
                reps: { type: SchemaType.INTEGER },
                weightKg: { type: SchemaType.NUMBER },
                restSeconds: { type: SchemaType.INTEGER },
                notes: { type: SchemaType.STRING },
              },
              required: ["muscleGroup", "sets", "reps", "weightKg", "restSeconds", "notes"],
            },
          },
          walkingStepsTarget: { type: SchemaType.INTEGER },
          cardioMinutesTarget: { type: SchemaType.INTEGER },
          mealBreakfast: { type: SchemaType.STRING },
          mealLunch: { type: SchemaType.STRING },
          mealDinner: { type: SchemaType.STRING },
          mealSnacks: { type: SchemaType.STRING },
          waterTargetMl: { type: SchemaType.INTEGER },
          sleepTargetHoursMin: { type: SchemaType.INTEGER },
          sleepTargetHoursMax: { type: SchemaType.INTEGER },
          nutritionCaloriesKcal: { type: SchemaType.INTEGER },
          nutritionProteinG: { type: SchemaType.INTEGER },
          nutritionCarbsG: { type: SchemaType.INTEGER },
          nutritionFatG: { type: SchemaType.INTEGER },
          nutritionFiberG: { type: SchemaType.INTEGER },
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
          "isGymDay",
          "gymWorkout",
          "walkingStepsTarget",
          "cardioMinutesTarget",
          "mealBreakfast",
          "mealLunch",
          "mealDinner",
          "mealSnacks",
          "waterTargetMl",
          "sleepTargetHoursMin",
          "sleepTargetHoursMax",
          "nutritionCaloriesKcal",
          "nutritionProteinG",
          "nutritionCarbsG",
          "nutritionFatG",
          "nutritionFiberG",
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
  const model = getGeminiModel(input.geminiApiKey);
  if (!model) {
    return { data: FALLBACK, source: "fallback", error: "尚未設定 Gemini API Key，請至「設定」頁面填入" };
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
- 每週上課次數（有教練）：${input.student.weeklyClassCount}
- 每週可進健身房總次數：${input.student.weeklyGymCount}（其中 ${Math.max(0, input.student.weeklyGymCount - input.student.weeklyClassCount)} 天為自主訓練）
- 飲食限制：${input.student.dietaryRestrictions?.trim() || "無"}

最新 InBody：${inbody}
InBody 變化：${input.inbodyDelta}

本次訓練紀錄：${input.sessionSummary}

7 天區間：
${dayLines}

請輸出 JSON，包含：
1. overallMessage：100–150 字、純中文、給整週的話。要提到本次訓練亮點 + InBody 趨勢 + 下週重點。
2. days：對應 7 天，每一筆需要：
   - date：與輸入一致
   - isGymDay：當天是否去健身房（true/false）。上課日（isClassDay=true）一律設為 true；另外再從非上課日中安排（weeklyGymCount - weeklyClassCount）天自主訓練日，也設為 true。安排原則：自主訓練日避免連續兩天、至少間隔一天休息。
   - gymWorkout：
     * 上課日（isClassDay=true）：固定為空陣列，由教練現場指導，不預先安排
     * 自主健身日（isGymDay=true 且非上課日）：必填，每筆為一個「訓練部位區塊」，不指定特定動作名稱，讓學員自行選擇器械式或自由重量：
     * muscleGroup：訓練部位（例：胸、背、腿、肩、手臂、核心）
     * sets：組數（通常 3–4）
     * reps：每組次數（增肌 6–12、減脂 12–15、體能 15–20）
     * weightKg：建議重量（kg）。徒手或無法估計時填 null。依 InBody 骨骼肌量與目標估算，寧可偏保守
     * restSeconds：組間休息秒數（增肌 90–120、減脂 45–60、體能 30–45）
     * notes：給學員的簡短提示（例：「可選推胸機或啞鈴，保持肩胛收緊」、「深蹲或腿推機皆可，注意膝蓋不超過腳尖」），15–30 字。無特別提示填空字串。
     每個自主健身日安排 3–5 個部位區塊，避免連續兩天練同一部位（例：週二練胸肩 / 週四練背腿）
   - walkingStepsTarget：步數（依目標 + 體脂 + BMI 調整。上課日和健身日步數 = 平日的一半）
   - cardioMinutesTarget：有氧分鐘（增肌 0–15、減脂 20–40、體能 15–30；上課日和健身日 = 0）
   - mealBreakfast / mealLunch / mealDinner / mealSnacks：簡短可執行（例：「雞胸 150g + 糙米 1 碗 + 蔬菜」）
     - 【重要】嚴格遵守學員飲食限制，禁止出現任何被排除的食材
     - 上課日熱量比平日 +10%
     - 蛋白質維持 1.6g/kg 體重
   - waterTargetMl：水分目標（依體重、流汗高峰日酌量增減）
   - sleepTargetHoursMin / sleepTargetHoursMax：睡眠時數區間
   - nutritionCaloriesKcal：每日總熱量目標（kcal）。基礎為 BMR × 活動係數，再依目標調整（增肌 +200~300、減脂 -300~500、維持 ±0）。日類型加成：
     * 上課日（isClassDay）：比平日基礎再 +250~350 kcal（有教練帶訓，強度高）
     * 自主健身日（isGymDay=true）：比平日基礎再 +150~250 kcal（自主訓練消耗）
     * 休息日：基礎值不加成
   - nutritionProteinG：蛋白質目標（g）。基礎 1.6~2.0g × 體重 kg；訓練日（上課日或自主健身日）比休息日再 +10~15g，加速肌肉修復
   - nutritionCarbsG：碳水化合物目標（g）。總熱量扣除蛋白質與脂肪後換算；訓練日（上課日或自主健身日）比休息日 +25~40g 補充肌糖原
   - nutritionFatG：脂肪目標（g）。約佔總熱量 25~30%；訓練日脂肪量維持不變，熱量加成主要來自碳水與蛋白質
   - nutritionFiberG：膳食纖維目標（g）。一般建議 25~35g
   - extraExercises：補充小訓練（依本次訓練的薄弱點推 0–2 個動作；例：[{name:"棒式", sets:3, reps:30}]）。沒有就空陣列。

語氣專業簡潔。額外指示：${input.promptTemplate}`;
}
