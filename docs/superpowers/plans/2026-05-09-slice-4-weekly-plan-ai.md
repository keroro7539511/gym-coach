# Slice 4：WeeklyPlan + AI 整合 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** 在課程完成時，自動產生「下週每日計劃」（7 天 × 飲食 + 走路步數 + 有氧 + 補充訓練 + 水分 + 睡眠 + 教練的話），結合 R3 規則 + Gemini AI 飲食生成 + Gemini AI 教練建議文。教練可以編輯任何欄位後存檔。為下個 slice 的 PDF 鋪路。

**Architecture:** 新增 `weekly_plans`、`daily_plans`、`coach_settings` 三個表。AI 呼叫透過獨立 module，含 fallback；diet 用結構化輸出（responseSchema）保證 JSON。Session 完成時觸發 WeeklyPlan 自動建立 + AI 生成草稿；UI 提供 7 天 tab 編輯。

**Tech additions:**
- `@google/generative-ai` (Gemini SDK)
- `dotenv` 已透過 Next.js 內建支援（不需另裝）

**Spec reference:** §4 weekly_plans/daily_plans/coach_settings, §6 R3 + AI 1 + AI 2, §5 情境 3

**前置依賴：** Slice 3 完成（規則 R1/R2/R3 + 19+27=46 unit tests）

---

## Slice 4 共 6 個 Tasks

| # | Task | 重點 |
|---|------|------|
| 1 | Schema：weekly_plans / daily_plans / coach_settings + migration | 資料層 |
| 2 | Coach settings seed（預設規則參數 + Gemini key 從 env） | 主檔 |
| 3 | Gemini API wrapper + 飲食生成 + 教練建議文（含 fallback） | AI |
| 4 | WeeklyPlan server actions（generate / get / update DailyPlan） | API |
| 5 | Session 完成時自動產生 WeeklyPlan | 整合 |
| 6 | WeeklyPlan 編輯 UI（7 天 tab） | UI |

---

## Task 1：新增 schema

**Files:**
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1：append schema**

加在 `src/lib/db/schema.ts` 後面：

```ts
// ─── 週計劃相關 ─────────────────────────────────────────

export const weeklyPlans = sqliteTable("weekly_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  sourceSessionId: integer("source_session_id")
    .notNull()
    .references(() => sessions.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  coachOverallMessage: text("coach_overall_message"),
  pdfPath: text("pdf_path"),
  status: text("status", { enum: ["draft", "approved"] })
    .notNull()
    .default("draft"),
  generatedAt: text("generated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const dailyPlans = sqliteTable("daily_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weeklyPlanId: integer("weekly_plan_id")
    .notNull()
    .references(() => weeklyPlans.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sun ... 6=Sat
  isClassDay: integer("is_class_day", { mode: "boolean" }).notNull().default(false),
  walkingStepsTarget: integer("walking_steps_target"),
  cardioMinutesTarget: integer("cardio_minutes_target"),
  mealBreakfast: text("meal_breakfast"),
  mealLunch: text("meal_lunch"),
  mealDinner: text("meal_dinner"),
  mealSnacks: text("meal_snacks"),
  waterTargetMl: integer("water_target_ml"),
  sleepTargetHoursMin: integer("sleep_target_hours_min"),
  sleepTargetHoursMax: integer("sleep_target_hours_max"),
  extraExercises: text("extra_exercises", { mode: "json" }).$type<
    { exerciseId: number | null; name: string; sets: number; reps: number }[]
  >(),
  coachMessage: text("coach_message"),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const coachSettings = sqliteTable("coach_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // 規則參數
  muscleGainStepsMin: integer("muscle_gain_steps_min").notNull().default(5000),
  muscleGainStepsMax: integer("muscle_gain_steps_max").notNull().default(7000),
  fatLossStepsMin: integer("fat_loss_steps_min").notNull().default(8000),
  fatLossStepsMax: integer("fat_loss_steps_max").notNull().default(12000),
  fitnessStepsMin: integer("fitness_steps_min").notNull().default(8000),
  fitnessStepsMax: integer("fitness_steps_max").notNull().default(10000),
  weightAdjustPct: real("weight_adjust_pct").notNull().default(5),
  bodyFatWarnMale: real("body_fat_warn_male").notNull().default(25),
  bodyFatWarnFemale: real("body_fat_warn_female").notNull().default(30),
  // AI prompts
  aiDietPromptTemplate: text("ai_diet_prompt_template"),
  aiMessagePromptTemplate: text("ai_message_prompt_template"),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export type WeeklyPlan = typeof weeklyPlans.$inferSelect;
export type NewWeeklyPlan = typeof weeklyPlans.$inferInsert;
export type DailyPlan = typeof dailyPlans.$inferSelect;
export type NewDailyPlan = typeof dailyPlans.$inferInsert;
export type CoachSettings = typeof coachSettings.$inferSelect;
```

- [ ] **Step 2：migration**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

- [ ] **Step 3：commit**

```bash
git add .
git commit -m "feat: add weekly_plans, daily_plans, coach_settings schema"
```

---

## Task 2：Coach settings 預設值 + 載入函式

**Files:**
- Create: `src/lib/db/seed-coach-settings.ts`
- Create: `src/lib/coach-settings.ts`（讀取 helper）
- Modify: `scripts/seed-exercises.ts`（順便也跑 coach settings seed）

- [ ] **Step 1：寫 seed function**

`src/lib/db/seed-coach-settings.ts`：

```ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DEFAULT_DIET_PROMPT = `你是專業健身營養師。為以下學員產生 7 天飲食建議。

學員資料：
- 性別：{{gender}}
- 年齡：{{age}}
- 目標：{{goal}}
- 體重：{{weight}}kg / 體脂率：{{bodyFatPct}}%
- BMR：{{bmr}} kcal
- 上課日：{{classDays}}
- 健身房日（自主）：{{gymDays}}

請輸出 JSON，每天 4 餐（早午晚 + 點心），每餐用簡短中文描述食物與份量。
- 上課日當天熱量比平日多 10%
- 蛋白質維持每公斤體重 1.6g
- 用詞：簡單、可執行（例：「雞胸 150g + 糙米飯 1 碗 + 蔬菜」）`;

const DEFAULT_MESSAGE_PROMPT = `你是專業健身教練。依以下訓練紀錄與 InBody 趨勢，
寫一段 100-150 字的話給學員。

語氣：專業、鼓勵、具體。
務必：
- 提到本次表現的一個亮點
- 提到 InBody 數字的變化趨勢（如有）
- 給下週要注意的一個重點
- 純中文、無 emoji

訓練紀錄摘要：
{{sessionSummary}}

InBody 變化：
{{inbodyDelta}}

目標進度：{{goal}}`;

export function seedCoachSettings(dbPath = "./data/gym.db"): {
  inserted: boolean;
} {
  const sqlite = new Database(dbPath);
  try {
    const db = drizzle(sqlite, { schema });
    const existing = db.select().from(schema.coachSettings).all();
    if (existing.length > 0) {
      // 已存在但若 prompt template 為 null，補上預設
      const row = existing[0];
      if (!row.aiDietPromptTemplate || !row.aiMessagePromptTemplate) {
        db.update(schema.coachSettings)
          .set({
            aiDietPromptTemplate:
              row.aiDietPromptTemplate ?? DEFAULT_DIET_PROMPT,
            aiMessagePromptTemplate:
              row.aiMessagePromptTemplate ?? DEFAULT_MESSAGE_PROMPT,
          })
          .run();
      }
      return { inserted: false };
    }
    db.insert(schema.coachSettings)
      .values({
        aiDietPromptTemplate: DEFAULT_DIET_PROMPT,
        aiMessagePromptTemplate: DEFAULT_MESSAGE_PROMPT,
      })
      .run();
    return { inserted: true };
  } finally {
    sqlite.close();
  }
}
```

- [ ] **Step 2：寫運行時讀取 helper**

`src/lib/coach-settings.ts`：

```ts
import "server-only";
import { db } from "@/lib/db/client";
import { coachSettings, type CoachSettings } from "@/lib/db/schema";

let cached: CoachSettings | null = null;

export function getCoachSettings(): CoachSettings {
  if (cached) return cached;
  const row = db.select().from(coachSettings).limit(1).get();
  if (!row) {
    throw new Error(
      "coach_settings 尚未初始化，請執行 `npm run db:seed`"
    );
  }
  cached = row;
  return row;
}

export function clearCoachSettingsCache() {
  cached = null;
}
```

- [ ] **Step 3：在 seed 腳本一併呼叫**

修改 `scripts/seed-exercises.ts`：

```ts
import { seedExercises } from "../src/lib/db/seed-exercises";
import { seedCoachSettings } from "../src/lib/db/seed-coach-settings";

(async () => {
  const r1 = await seedExercises();
  console.log(`Seeded ${r1.inserted} exercises from ${r1.source}`);
  const r2 = seedCoachSettings();
  console.log(
    r2.inserted
      ? "Seeded coach_settings with defaults"
      : "coach_settings already exists (prompts back-filled if missing)"
  );
  process.exit(0);
})();
```

- [ ] **Step 4：跑 seed 確認**

```bash
npm run db:seed
```

Expected: 印出兩行訊息，第二次跑時 coach_settings 顯示「already exists」。

```bash
sqlite3 data/gym.db "SELECT * FROM coach_settings;"
```

應該有一筆資料。

- [ ] **Step 5：commit**

```bash
git add .
git commit -m "feat: coach_settings seed with default rule params and AI prompts"
```

---

## Task 3：Gemini wrapper + AI 生成函式

**Files:**
- Create: `src/lib/ai/gemini-client.ts`
- Create: `src/lib/ai/generate-diet.ts`
- Create: `src/lib/ai/generate-coach-message.ts`
- Create: `src/lib/ai/generate-diet.test.ts`（mock 測試）
- Create: `.env.example`
- Modify: `.gitignore`（確保 `.env.local` 被忽略）

- [ ] **Step 1：安裝套件**

```bash
npm install @google/generative-ai
```

- [ ] **Step 2：寫 Gemini client**

`src/lib/ai/gemini-client.ts`：

```ts
import "server-only";
import {
  GoogleGenerativeAI,
  type GenerativeModel,
  SchemaType,
} from "@google/generative-ai";

let cachedModel: GenerativeModel | null = null;

export function getGeminiModel(): GenerativeModel | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (cachedModel) return cachedModel;
  const genAI = new GoogleGenerativeAI(apiKey);
  cachedModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });
  return cachedModel;
}

export { SchemaType };
```

- [ ] **Step 3：寫 generate-diet**

`src/lib/ai/generate-diet.ts`：

```ts
import "server-only";
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

const DIET_SCHEMA = {
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
} as const;

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
```

- [ ] **Step 4：寫 generate-coach-message**

`src/lib/ai/generate-coach-message.ts`：

```ts
import "server-only";
import { getGeminiModel } from "./gemini-client";

export interface CoachMessageInput {
  sessionSummary: string;
  inbodyDelta: string;
  goal: string;
}

export async function generateCoachMessage(
  input: CoachMessageInput,
  promptTemplate: string
): Promise<{ text: string; source: "ai" | "fallback"; error?: string }> {
  const model = getGeminiModel();
  if (!model) {
    return { text: "", source: "fallback", error: "GEMINI_API_KEY not set" };
  }

  const prompt = promptTemplate
    .replace("{{sessionSummary}}", input.sessionSummary)
    .replace("{{inbodyDelta}}", input.inbodyDelta)
    .replace("{{goal}}", input.goal);

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = result.response.text().trim();
    if (!text) throw new Error("Empty message");
    return { text, source: "ai" };
  } catch (err) {
    console.warn("[ai] coach message generation failed:", err);
    return {
      text: "",
      source: "fallback",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
```

- [ ] **Step 5：簡單 mock 測試**

`src/lib/ai/generate-diet.test.ts`：

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";

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
```

- [ ] **Step 6：寫 .env.example**

`.env.example`：

```
# Gemini API key（用於 AI 飲食/教練建議文）
# 沒設也能跑，只是 AI 欄位會留空，需手動填寫
GEMINI_API_KEY=
```

- [ ] **Step 7：確保 .gitignore 已含 .env.local**

檢查 `.gitignore` 應該已經有 `.env`、`.env.local` 之類的 entry（slice 1 加過）。沒有的話加上。

- [ ] **Step 8：跑測試**

```bash
npm test
```

Expected: 49 passed（45 + 4 個 AI mock 測試）

- [ ] **Step 9：type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 10：commit**

```bash
git add .
git commit -m "feat: gemini AI wrapper for diet plan and coach message with fallback"
```

---

## Task 4：WeeklyPlan server actions

**Files:**
- Create: `src/lib/actions/weekly-plans.ts`

- [ ] **Step 1：寫 actions**

`src/lib/actions/weekly-plans.ts`：

```ts
"use server";

import { db } from "@/lib/db/client";
import {
  weeklyPlans,
  dailyPlans,
  sessions,
  students,
  inbodyRecords,
  setLogs,
  sessionExercises,
  exercises,
} from "@/lib/db/schema";
import { eq, desc, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { recommendDailyActivity } from "@/lib/recommendations/daily-activity";
import { generateDietPlan } from "@/lib/ai/generate-diet";
import { generateCoachMessage } from "@/lib/ai/generate-coach-message";
import { getCoachSettings } from "@/lib/coach-settings";

// ──────────────────────────────────────────────────
// 從 Session.endedAt 推下週的 7 天
function nextSevenDays(fromDate: string): { date: string; dayOfWeek: number }[] {
  const start = new Date(fromDate);
  start.setDate(start.getDate() + 1); // 隔天起算
  const out: { date: string; dayOfWeek: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dayOfWeek = d.getDay();
    out.push({
      date: d.toISOString().slice(0, 10),
      dayOfWeek,
    });
  }
  return out;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const GOAL_LABEL: Record<string, string> = {
  muscle_gain: "增肌",
  fat_loss: "減脂",
  fitness: "體能",
  custom: "自訂",
};

// ──────────────────────────────────────────────────
export async function generateWeeklyPlan(sessionId: number): Promise<number> {
  const session = db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get();
  if (!session) throw new Error("Session not found");
  if (session.status !== "completed")
    throw new Error("Session not completed");

  // 已存在 weeklyPlan 就回傳既有 id
  const existing = db
    .select()
    .from(weeklyPlans)
    .where(eq(weeklyPlans.sourceSessionId, sessionId))
    .get();
  if (existing) return existing.id;

  const student = db
    .select()
    .from(students)
    .where(eq(students.id, session.studentId))
    .get();
  if (!student) throw new Error("Student not found");

  const settings = getCoachSettings();

  // 7 天起訖
  const sessionDate = (session.endedAt ?? session.startedAt ?? new Date().toISOString()).slice(0, 10);
  const days = nextSevenDays(sessionDate);
  const startDate = days[0].date;
  const endDate = days[6].date;

  // 學員 InBody 趨勢（最近兩筆）
  const recentInbody = db
    .select()
    .from(inbodyRecords)
    .where(eq(inbodyRecords.studentId, student.id))
    .orderBy(desc(inbodyRecords.measuredAt))
    .limit(2)
    .all();
  const latestInbody = recentInbody[0];
  const prevInbody = recentInbody[1];

  // 並行：AI 飲食 + AI 教練建議文
  const [dietResult, messageResult] = await Promise.all([
    generateDietPlan(
      {
        gender: student.gender,
        age: student.birthday
          ? new Date().getFullYear() - new Date(student.birthday).getFullYear()
          : null,
        goal: GOAL_LABEL[student.goal] ?? student.goal,
        weightKg: latestInbody?.weightKg ?? null,
        bodyFatPct: latestInbody?.bodyFatPct ?? null,
        bmrKcal: latestInbody?.bmrKcal ?? null,
        classDays: [DAY_NAMES[new Date(sessionDate).getDay()]],
        gymDays: [],
      },
      startDate,
      settings.aiDietPromptTemplate ?? ""
    ),
    generateCoachMessage(
      {
        sessionSummary: await summarizeSession(sessionId),
        inbodyDelta: summarizeInbodyDelta(latestInbody, prevInbody),
        goal: GOAL_LABEL[student.goal] ?? student.goal,
      },
      settings.aiMessagePromptTemplate ?? ""
    ),
  ]);

  // 寫入 weeklyPlan
  const wp = db
    .insert(weeklyPlans)
    .values({
      studentId: student.id,
      sourceSessionId: sessionId,
      startDate,
      endDate,
      coachOverallMessage: messageResult.text || null,
      status: "draft",
    })
    .returning({ id: weeklyPlans.id })
    .all();
  const weeklyPlanId = wp[0].id;

  // 寫入 7 筆 dailyPlan
  // 依「該週的某一天是否為上課日」估算（只把 sessionDate 隔天的某一天當作下次上課，
  //  用學員 weeklyClassCount 模擬）
  for (const d of days) {
    const isClassDay = simulateClassDay(d.dayOfWeek, student.weeklyClassCount);
    const activity = recommendDailyActivity({
      goal: student.goal,
      isClassDay,
      bmi: latestInbody?.bmi ?? null,
    });
    const meal = dietResult.data.find((m) => m.date === d.date);
    db.insert(dailyPlans)
      .values({
        weeklyPlanId,
        date: d.date,
        dayOfWeek: d.dayOfWeek,
        isClassDay,
        walkingStepsTarget: activity.stepsTarget,
        cardioMinutesTarget: activity.cardioMinutesTarget,
        mealBreakfast: meal?.breakfast ?? null,
        mealLunch: meal?.lunch ?? null,
        mealDinner: meal?.dinner ?? null,
        mealSnacks: meal?.snacks ?? null,
        waterTargetMl: 2500,
        sleepTargetHoursMin: 7,
        sleepTargetHoursMax: 8,
        extraExercises: [],
        coachMessage: null,
      })
      .run();
  }

  revalidatePath(`/students/${student.id}/weekly-plans`);
  revalidatePath(`/sessions/${sessionId}`);

  return weeklyPlanId;
}

function simulateClassDay(dayOfWeek: number, weeklyCount: number): boolean {
  // 簡化邏輯：把上課日大致分散
  // weeklyCount=1 → 只有星期三
  // weeklyCount=2 → 星期二、五
  // weeklyCount=3 → 星期一、三、五
  // 4+ → 星期一、三、五、六
  if (weeklyCount <= 0) return false;
  if (weeklyCount === 1) return dayOfWeek === 3;
  if (weeklyCount === 2) return dayOfWeek === 2 || dayOfWeek === 5;
  if (weeklyCount === 3) return [1, 3, 5].includes(dayOfWeek);
  return [1, 3, 5, 6].includes(dayOfWeek);
}

async function summarizeSession(sessionId: number): Promise<string> {
  const rows = db
    .select({
      exerciseName: exercises.name,
      setNumber: setLogs.setNumber,
      weightKg: setLogs.weightKg,
      reps: setLogs.reps,
      rpe: setLogs.rpe,
    })
    .from(setLogs)
    .innerJoin(
      sessionExercises,
      eq(setLogs.sessionExerciseId, sessionExercises.id)
    )
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(asc(sessionExercises.orderIndex), asc(setLogs.setNumber))
    .all();

  const byExercise = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!byExercise.has(r.exerciseName)) byExercise.set(r.exerciseName, []);
    byExercise.get(r.exerciseName)!.push(r);
  }

  const lines: string[] = [];
  for (const [name, sets] of byExercise) {
    const last = sets[sets.length - 1];
    lines.push(
      `${name} ${sets.length} 組，最後一組 ${last.weightKg ?? "?"}kg × ${last.reps ?? "?"} 下 RPE${last.rpe ?? "?"}`
    );
  }
  return lines.join("；") || "無紀錄";
}

function summarizeInbodyDelta(latest?: typeof inbodyRecords.$inferSelect, prev?: typeof inbodyRecords.$inferSelect): string {
  if (!latest) return "暫無 InBody 紀錄";
  if (!prev)
    return `首次：體重 ${latest.weightKg ?? "?"}kg、體脂 ${latest.bodyFatPct ?? "?"}%`;

  const d = (a?: number | null, b?: number | null) =>
    a != null && b != null ? +(a - b).toFixed(1) : null;
  const dw = d(latest.weightKg, prev.weightKg);
  const df = d(latest.bodyFatPct, prev.bodyFatPct);
  const dm = d(latest.skeletalMuscleKg, prev.skeletalMuscleKg);
  return [
    dw != null ? `體重 ${dw > 0 ? "+" : ""}${dw}kg` : null,
    df != null ? `體脂 ${df > 0 ? "+" : ""}${df}%` : null,
    dm != null ? `肌肉 ${dm > 0 ? "+" : ""}${dm}kg` : null,
  ]
    .filter(Boolean)
    .join("、");
}

// ──────────────────────────────────────────────────
export async function getWeeklyPlanWithDays(weeklyPlanId: number) {
  const plan = db
    .select()
    .from(weeklyPlans)
    .where(eq(weeklyPlans.id, weeklyPlanId))
    .get();
  if (!plan) return null;
  const days = db
    .select()
    .from(dailyPlans)
    .where(eq(dailyPlans.weeklyPlanId, weeklyPlanId))
    .orderBy(asc(dailyPlans.date))
    .all();
  return { plan, days };
}

export async function listWeeklyPlansForStudent(studentId: number) {
  return db
    .select()
    .from(weeklyPlans)
    .where(eq(weeklyPlans.studentId, studentId))
    .orderBy(desc(weeklyPlans.startDate))
    .all();
}

export async function updateDailyPlan(
  id: number,
  patch: Partial<typeof dailyPlans.$inferInsert>
) {
  const cleaned = Object.fromEntries(
    Object.entries(patch).filter(([_, v]) => v !== undefined)
  );
  db.update(dailyPlans)
    .set({ ...cleaned, updatedAt: new Date().toISOString() })
    .where(eq(dailyPlans.id, id))
    .run();
  const dp = db
    .select()
    .from(dailyPlans)
    .where(eq(dailyPlans.id, id))
    .get();
  if (dp) {
    revalidatePath(`/weekly-plans/${dp.weeklyPlanId}`);
  }
}

export async function updateWeeklyPlanMessage(
  id: number,
  coachOverallMessage: string
) {
  db.update(weeklyPlans)
    .set({
      coachOverallMessage,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(weeklyPlans.id, id))
    .run();
  revalidatePath(`/weekly-plans/${id}`);
}
```

- [ ] **Step 2：跑 type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3：commit**

```bash
git add .
git commit -m "feat: weekly plan server actions and AI orchestration"
```

---

## Task 5：Session 完成時觸發 WeeklyPlan 產生

**Files:**
- Modify: `src/lib/actions/sessions.ts`（在 completeSession 後跳到 done page，並產生 weekly plan）
- Create: `src/app/sessions/[id]/done/page.tsx`

> **設計：** 結束課程的 button 改為 redirect 到 `/sessions/[id]/done`，那頁觸發 `generateWeeklyPlan` 並 redirect 到編輯頁。

- [ ] **Step 1：修改 completeSession**

修改 `src/lib/actions/sessions.ts` 中的 `completeSession`：

```ts
import { redirect as nextRedirect } from "next/navigation";

export async function completeSession(sessionId: number, coachNotes?: string) {
  db.update(sessions)
    .set({
      status: "completed",
      endedAt: new Date().toISOString(),
      coachNotes: coachNotes || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sessions.id, sessionId))
    .run();

  const session = db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get();
  if (session) {
    revalidatePath(`/students/${session.studentId}/sessions`);
  }
  revalidatePath(`/sessions/${sessionId}`);
  // 跳到 done 頁
  nextRedirect(`/sessions/${sessionId}/done`);
}
```

- [ ] **Step 2：寫 done 頁面**

`src/app/sessions/[id]/done/page.tsx`：

```tsx
import { notFound, redirect } from "next/navigation";
import { generateWeeklyPlan } from "@/lib/actions/weekly-plans";

export default async function SessionDonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const sessionId = Number(idStr);

  let weeklyPlanId: number;
  try {
    weeklyPlanId = await generateWeeklyPlan(sessionId);
  } catch (err) {
    if (err instanceof Error && err.message === "Session not found") {
      notFound();
    }
    throw err;
  }

  redirect(`/weekly-plans/${weeklyPlanId}`);
}
```

> **註：** 由於這頁是「即時生成 + 跳轉」，使用者會看到很短的 loading 後直接跳到編輯頁。AI 跑 5–15 秒中，使用者只會看到瀏覽器 loading bar。

- [ ] **Step 3：手動測試**

```bash
npm run dev
```

對一堂 in_progress session 點「完成課程」 → 應該停 5–15 秒後跳到 `/weekly-plans/[id]`（下個 task 才會做這頁）。

> **注意：** 沒有 GEMINI_API_KEY 也可以 — AI 部分會 fallback 為空字串/陣列，weekly plan 仍會產生，只是飲食/教練的話為空。

- [ ] **Step 4：commit**

```bash
git add .
git commit -m "feat: auto-generate weekly plan on session completion"
```

---

## Task 6：WeeklyPlan 編輯 UI

**Files:**
- Create: `src/app/weekly-plans/[id]/page.tsx`
- Create: `src/components/weekly-plan-editor.tsx`
- Create: `src/components/daily-plan-editor.tsx`
- Modify: `src/app/students/[id]/layout.tsx`（加「週計劃」分頁連結）
- Create: `src/app/students/[id]/weekly-plans/page.tsx`

- [ ] **Step 1：DailyPlanEditor 子元件**

`src/components/daily-plan-editor.tsx`：

```tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateDailyPlan } from "@/lib/actions/weekly-plans";
import type { DailyPlan } from "@/lib/db/schema";

interface Props {
  daily: DailyPlan;
}

export function DailyPlanEditor({ daily }: Props) {
  const [local, setLocal] = useState({
    walkingStepsTarget: daily.walkingStepsTarget ?? "",
    cardioMinutesTarget: daily.cardioMinutesTarget ?? "",
    mealBreakfast: daily.mealBreakfast ?? "",
    mealLunch: daily.mealLunch ?? "",
    mealDinner: daily.mealDinner ?? "",
    mealSnacks: daily.mealSnacks ?? "",
    waterTargetMl: daily.waterTargetMl ?? "",
    coachMessage: daily.coachMessage ?? "",
  });
  const [, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      startTransition(() => {
        updateDailyPlan(daily.id, {
          walkingStepsTarget:
            local.walkingStepsTarget === "" ? null : Number(local.walkingStepsTarget),
          cardioMinutesTarget:
            local.cardioMinutesTarget === "" ? null : Number(local.cardioMinutesTarget),
          mealBreakfast: local.mealBreakfast || null,
          mealLunch: local.mealLunch || null,
          mealDinner: local.mealDinner || null,
          mealSnacks: local.mealSnacks || null,
          waterTargetMl:
            local.waterTargetMl === "" ? null : Number(local.waterTargetMl),
          coachMessage: local.coachMessage || null,
        });
      });
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  const set = <K extends keyof typeof local>(k: K, v: (typeof local)[K]) =>
    setLocal((l) => ({ ...l, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>走路步數目標</Label>
          <Input
            type="number"
            value={local.walkingStepsTarget}
            onChange={(e) => set("walkingStepsTarget", e.target.value)}
          />
        </div>
        <div>
          <Label>有氧分鐘</Label>
          <Input
            type="number"
            value={local.cardioMinutesTarget}
            onChange={(e) => set("cardioMinutesTarget", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>早餐</Label>
        <Textarea
          rows={2}
          value={local.mealBreakfast}
          onChange={(e) => set("mealBreakfast", e.target.value)}
        />
      </div>
      <div>
        <Label>午餐</Label>
        <Textarea
          rows={2}
          value={local.mealLunch}
          onChange={(e) => set("mealLunch", e.target.value)}
        />
      </div>
      <div>
        <Label>晚餐</Label>
        <Textarea
          rows={2}
          value={local.mealDinner}
          onChange={(e) => set("mealDinner", e.target.value)}
        />
      </div>
      <div>
        <Label>點心</Label>
        <Textarea
          rows={2}
          value={local.mealSnacks}
          onChange={(e) => set("mealSnacks", e.target.value)}
        />
      </div>

      <div>
        <Label>水分目標 (ml)</Label>
        <Input
          type="number"
          value={local.waterTargetMl}
          onChange={(e) => set("waterTargetMl", e.target.value)}
        />
      </div>

      <div>
        <Label>教練給今天的話</Label>
        <Textarea
          rows={3}
          value={local.coachMessage}
          onChange={(e) => set("coachMessage", e.target.value)}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2：WeeklyPlanEditor 主元件**

`src/components/weekly-plan-editor.tsx`：

```tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DailyPlanEditor } from "@/components/daily-plan-editor";
import { updateWeeklyPlanMessage } from "@/lib/actions/weekly-plans";
import type { WeeklyPlan, DailyPlan } from "@/lib/db/schema";

const DAY_LABEL = ["日", "一", "二", "三", "四", "五", "六"];

interface Props {
  plan: WeeklyPlan;
  days: DailyPlan[];
  studentName: string;
}

export function WeeklyPlanEditor({ plan, days, studentName }: Props) {
  const [overallMsg, setOverallMsg] = useState(plan.coachOverallMessage ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (overallMsg === (plan.coachOverallMessage ?? "")) return;
    const t = setTimeout(() => {
      startTransition(() => {
        updateWeeklyPlanMessage(plan.id, overallMsg);
      });
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overallMsg]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">
          {studentName} 的下週計劃
        </h1>
        <p className="text-sm text-muted-foreground">
          {plan.startDate} → {plan.endDate}
        </p>
      </header>

      <section className="mb-8">
        <Label htmlFor="overall">教練給整週的話 (AI 草稿，可編輯)</Label>
        <Textarea
          id="overall"
          rows={4}
          value={overallMsg}
          onChange={(e) => setOverallMsg(e.target.value)}
          placeholder="如果是空白，可能是 AI 生成失敗，請手動填寫…"
          className="mt-1"
        />
      </section>

      <Tabs defaultValue={days[0]?.date}>
        <TabsList className="grid grid-cols-7 mb-4">
          {days.map((d) => (
            <TabsTrigger key={d.id} value={d.date}>
              <div className="flex flex-col items-center text-xs">
                <span>星期{DAY_LABEL[d.dayOfWeek]}</span>
                <span className="text-muted-foreground">
                  {d.date.slice(5)}
                </span>
                {d.isClassDay && (
                  <span className="text-[10px] text-primary">上課</span>
                )}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {days.map((d) => (
          <TabsContent key={d.id} value={d.date}>
            <DailyPlanEditor daily={d} />
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-8 pt-6 border-t text-sm text-muted-foreground">
        所有變更會自動儲存。下個版本會加 PDF 下載按鈕。
      </div>
    </div>
  );
}
```

- [ ] **Step 3：寫頁面**

`src/app/weekly-plans/[id]/page.tsx`：

```tsx
import { notFound } from "next/navigation";
import { getWeeklyPlanWithDays } from "@/lib/actions/weekly-plans";
import { getStudent } from "@/lib/actions/students";
import { WeeklyPlanEditor } from "@/components/weekly-plan-editor";

export default async function WeeklyPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const data = await getWeeklyPlanWithDays(id);
  if (!data) notFound();
  const student = await getStudent(data.plan.studentId);
  if (!student) notFound();

  return (
    <WeeklyPlanEditor
      plan={data.plan}
      days={data.days}
      studentName={student.name}
    />
  );
}
```

- [ ] **Step 4：學員子頁加「週計劃」分頁**

修改 `src/app/students/[id]/layout.tsx`，在 nav 加：

```tsx
<Link href={`/students/${id}/weekly-plans`} className="hover:underline">
  週計劃
</Link>
```

`src/app/students/[id]/weekly-plans/page.tsx`：

```tsx
import Link from "next/link";
import { listWeeklyPlansForStudent } from "@/lib/actions/weekly-plans";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";

export default async function StudentWeeklyPlansPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const studentId = Number(idStr);
  const list = await listWeeklyPlansForStudent(studentId);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">歷次週計劃</h2>
      {list.length === 0 ? (
        <p className="text-muted-foreground">
          尚無紀錄。完成一堂課後系統會自動產生。
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>區間</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.startDate} – {p.endDate}
                </TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell>
                  <Link
                    href={`/weekly-plans/${p.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    編輯
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

- [ ] **Step 5：跑 type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6：手動測試**

完整流程：
1. 開新一堂課（學員需有 InBody 紀錄會更精準）
2. 加動作、紀錄幾組
3. 點完成課程
4. 等 5–15 秒（AI 跑中）
5. 應該跳到 `/weekly-plans/[id]` 編輯頁
6. 看到 7 天 tab，飲食欄位若有 `GEMINI_API_KEY` 會有內容；沒有則為空（但 placeholder 有提示）
7. 編輯一個欄位，等 1 秒，重新整理 → 值已存

- [ ] **Step 7：commit**

```bash
git add .
git commit -m "feat: weekly plan editor UI with 7-day tabs"
```

---

## Slice 4 驗收清單

- [ ] `npm test` 為 49 passed（45 + 4 AI mock）
- [ ] `npx tsc --noEmit` 無錯
- [ ] schema 加入 weekly_plans / daily_plans / coach_settings
- [ ] coach_settings seed 有預設值與 prompt template
- [ ] 課程完成後自動產生 WeeklyPlan + 7 個 DailyPlans
- [ ] AI 不可達時 fallback 為空字串/陣列，不阻塞流程
- [ ] WeeklyPlan 編輯頁可改任何欄位、自動存
- [ ] 學員子頁多一個「週計劃」分頁列表
- [ ] 6 個 commits

---

## Out of Scope（slice 4 不做）

- PDF 下載 → Slice 5
- 補充小訓練的動作選擇 UI（extraExercises 欄位先空著） → Slice 6
- coach_settings 的可編輯介面 → Slice 6
- WeeklyPlan 「狀態 approved」流程 → Slice 6
