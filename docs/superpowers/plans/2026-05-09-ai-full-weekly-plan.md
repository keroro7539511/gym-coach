# 全 AI 週計劃 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** 改寫 `generateWeeklyPlan`，讓 Gemini 一次接收「該學員這堂課的完整訓練紀錄 + 最新 InBody + 學員目標」，並一次產出整份 7 天每日計劃（步數、有氧、4 餐飲食、水分 ml、睡眠時數、補充小訓練、整週給學員的話）。每日教練的話不由 AI 生（留空給教練手寫）。

**Architecture:** 新增 `src/lib/ai/generate-full-weekly-plan.ts`，使用 Gemini 結構化輸出（`responseSchema`）。在 `generateWeeklyPlan` 中，這個新函式取代既有的 `generateDietPlan` + `generateCoachMessage` + R3 規則。AI 失敗時 fallback 到既有 R3 + 安全預設值。

**Tech:** Gemini 1.5 Flash, `@google/generative-ai`

**Spec 摘要：**
- AI 產出欄位：`weeklyPlan.coachOverallMessage` + 每日 `walkingStepsTarget`、`cardioMinutesTarget`、`mealBreakfast/Lunch/Dinner/Snacks`、`waterTargetMl`、`sleepTargetHoursMin/Max`、`extraExercises[]`
- 不由 AI 生：`isClassDay`（結構性、規則生）、`coachMessage`（每日教練的話、留空）
- AI 失敗 fallback：步數/有氧用 `recommendDailyActivity`、水分 2500ml、睡眠 7-8h、`extraExercises=[]`、`coachOverallMessage=""`

**前置：** MVP + UI redesign 完成。49 unit tests + 1 e2e 全綠。

---

## Task 1：新增 generate-full-weekly-plan AI 模組

**Files:**
- Create: `src/lib/ai/generate-full-weekly-plan.ts`
- Create: `src/lib/ai/generate-full-weekly-plan.test.ts`

- [ ] **Step 1：寫測試（mock Gemini）**

`src/lib/ai/generate-full-weekly-plan.test.ts`：

```ts
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
```

- [ ] **Step 2：跑測試確認失敗**

```bash
npm test
```

Expected: FAIL（檔案不存在）

- [ ] **Step 3：實作 module**

`src/lib/ai/generate-full-weekly-plan.ts`：

```ts
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
```

- [ ] **Step 4：跑測試確認通過**

```bash
npm test
```

Expected: 53 passing（原 49 + 新 4）。

- [ ] **Step 5：commit**

```bash
git add src/lib/ai/generate-full-weekly-plan.ts src/lib/ai/generate-full-weekly-plan.test.ts
git commit -m "feat(ai): add unified full weekly plan generator using gemini structured output"
```

---

## Task 2：把 generateWeeklyPlan 切換到新 AI 模組

**Files:**
- Modify: `src/lib/actions/weekly-plans.ts`

- [ ] **Step 1：替換 generateWeeklyPlan 內容**

修改 `src/lib/actions/weekly-plans.ts` — 找到 `generateWeeklyPlan` 函式整段，替換為下面的版本（其他輔助函式 `nextSevenDays`、`simulateClassDay`、`summarizeSession`、`summarizeInbodyDelta`、`getWeeklyPlanWithDays`、`listWeeklyPlansForStudent`、`updateDailyPlan`、`updateWeeklyPlanMessage` 全部保留不動）。

也要修改 imports：
- 移除 `generateDietPlan` 和 `generateCoachMessage` 的 import
- 加 `generateFullWeeklyPlan` 的 import
- 保留 `recommendDailyActivity`（仍作 fallback）

```ts
import { generateFullWeeklyPlan, type DaySpec } from "@/lib/ai/generate-full-weekly-plan";

// （其他既有 imports 保留）

export async function generateWeeklyPlan(sessionId: number): Promise<number> {
  const session = db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get();
  if (!session) throw new Error("Session not found");
  if (session.status !== "completed") throw new Error("Session not completed");

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

  const sessionDate = (
    session.endedAt ?? session.startedAt ?? new Date().toISOString()
  ).slice(0, 10);
  const days = nextSevenDays(sessionDate);
  const startDate = days[0].date;
  const endDate = days[6].date;

  const recentInbody = db
    .select()
    .from(inbodyRecords)
    .where(eq(inbodyRecords.studentId, student.id))
    .orderBy(desc(inbodyRecords.measuredAt))
    .limit(2)
    .all();
  const latestInbody = recentInbody[0];
  const prevInbody = recentInbody[1];

  // 組成 dailyPlans 結構（含上課日標記）
  const daySpecs: DaySpec[] = days.map((d) => ({
    date: d.date,
    dayOfWeek: d.dayOfWeek,
    isClassDay: simulateClassDay(d.dayOfWeek, student.weeklyClassCount),
  }));

  // AI 呼叫
  const aiResult = await generateFullWeeklyPlan({
    student: {
      gender: student.gender,
      age: student.birthday
        ? new Date().getFullYear() -
          new Date(student.birthday).getFullYear()
        : null,
      goal: GOAL_LABEL[student.goal] ?? student.goal,
      weeklyClassCount: student.weeklyClassCount,
    },
    inbody: latestInbody
      ? {
          weightKg: latestInbody.weightKg ?? null,
          bodyFatPct: latestInbody.bodyFatPct ?? null,
          skeletalMuscleKg: latestInbody.skeletalMuscleKg ?? null,
          bmrKcal: latestInbody.bmrKcal ?? null,
          bmi: latestInbody.bmi ?? null,
          visceralFatLevel: latestInbody.visceralFatLevel ?? null,
        }
      : null,
    sessionSummary: await summarizeSession(sessionId),
    inbodyDelta: summarizeInbodyDelta(latestInbody, prevInbody),
    startDate,
    daySpecs,
    promptTemplate: settings.aiDietPromptTemplate ?? "",
  });

  // 寫入 weeklyPlan
  const wp = db
    .insert(weeklyPlans)
    .values({
      studentId: student.id,
      sourceSessionId: sessionId,
      startDate,
      endDate,
      coachOverallMessage: aiResult.data.overallMessage || null,
      status: "draft",
    })
    .returning({ id: weeklyPlans.id })
    .all();
  const weeklyPlanId = wp[0].id;

  // 寫入 7 筆 dailyPlan：AI 有資料用 AI、否則 fallback 規則
  for (const d of daySpecs) {
    const aiDay = aiResult.data.days.find((x) => x.date === d.date);
    if (aiDay) {
      db.insert(dailyPlans)
        .values({
          weeklyPlanId,
          date: d.date,
          dayOfWeek: d.dayOfWeek,
          isClassDay: d.isClassDay,
          walkingStepsTarget: aiDay.walkingStepsTarget,
          cardioMinutesTarget: aiDay.cardioMinutesTarget,
          mealBreakfast: aiDay.mealBreakfast || null,
          mealLunch: aiDay.mealLunch || null,
          mealDinner: aiDay.mealDinner || null,
          mealSnacks: aiDay.mealSnacks || null,
          waterTargetMl: aiDay.waterTargetMl,
          sleepTargetHoursMin: aiDay.sleepTargetHoursMin,
          sleepTargetHoursMax: aiDay.sleepTargetHoursMax,
          extraExercises: aiDay.extraExercises.map((ex) => ({
            exerciseId: null,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
          })),
          coachMessage: null,
        })
        .run();
    } else {
      // fallback 規則
      const activity = recommendDailyActivity({
        goal: student.goal,
        isClassDay: d.isClassDay,
        bmi: latestInbody?.bmi ?? null,
        muscleGainSteps: [
          settings.muscleGainStepsMin,
          settings.muscleGainStepsMax,
        ],
        fatLossSteps: [settings.fatLossStepsMin, settings.fatLossStepsMax],
        fitnessSteps: [settings.fitnessStepsMin, settings.fitnessStepsMax],
      });
      db.insert(dailyPlans)
        .values({
          weeklyPlanId,
          date: d.date,
          dayOfWeek: d.dayOfWeek,
          isClassDay: d.isClassDay,
          walkingStepsTarget: activity.stepsTarget,
          cardioMinutesTarget: activity.cardioMinutesTarget,
          mealBreakfast: null,
          mealLunch: null,
          mealDinner: null,
          mealSnacks: null,
          waterTargetMl: 2500,
          sleepTargetHoursMin: 7,
          sleepTargetHoursMax: 8,
          extraExercises: [],
          coachMessage: null,
        })
        .run();
    }
  }

  return weeklyPlanId;
}
```

> **重要：** 不要動 `generateWeeklyPlan` 之外的其他 export 函式（`getWeeklyPlanWithDays`、`listWeeklyPlansForStudent`、`updateDailyPlan`、`updateWeeklyPlanMessage`）。也不要動既有的常數 `GOAL_LABEL`、`DAY_NAMES`，輔助函式 `nextSevenDays`、`simulateClassDay`、`summarizeSession`、`summarizeInbodyDelta` 全部保留。

> **同時：** 若 imports 區尚有 `generateDietPlan`、`generateCoachMessage` 不再使用，將其 import 移除（避免 TS 警告或 unused error）。同樣，若沒有再用到 `recommendDailyActivity` 以外的 ai modules，也可以順手刪掉那兩個 imports。**`recommendDailyActivity` 必須保留**（fallback 用）。

- [ ] **Step 2：跑 type check + 全部測試**

```bash
npx tsc --noEmit
npm test
```

Expected: tsc 無錯。test 53 passing（49 + 4 新 mock）。

- [ ] **Step 3：commit**

```bash
git add src/lib/actions/weekly-plans.ts
git commit -m "feat(ai): switch generateWeeklyPlan to use unified AI generator with rule fallback"
```

---

## Task 3：刪掉舊的 generate-diet 和 generate-coach-message（已不再使用）

**Files:**
- Delete: `src/lib/ai/generate-diet.ts`
- Delete: `src/lib/ai/generate-diet.test.ts`
- Delete: `src/lib/ai/generate-coach-message.ts`

> **檢查依賴：** 在刪除之前，先 grep 確認沒有其他檔案還在 import 這幾個檔。

- [ ] **Step 1：grep 檢查無外部依賴**

```bash
grep -rn "generate-diet\|generate-coach-message\|generateDietPlan\|generateCoachMessage" src/ tests/
```

Expected: 只有 `src/lib/ai/generate-diet.ts` 和 `generate-coach-message.ts` 自己（和測試），沒有別處 import。如有別處 import 必須先處理。

- [ ] **Step 2：刪檔**

```bash
rm src/lib/ai/generate-diet.ts
rm src/lib/ai/generate-diet.test.ts
rm src/lib/ai/generate-coach-message.ts
```

- [ ] **Step 3：跑測試**

```bash
npm test
```

Expected: 49 + 4 = 53 passing（4 個舊測試被刪了，但新增 4 個）— 等等，原本 4 個舊測試屬於 `generate-diet.test.ts`，刪了之後扣掉，新 task 1 加了 4 個，**淨剩 49**（原 49 - 4 + 4 = 49）。

> **預期：** test 49 passing（與 MVP baseline 相同，因為這 task 只是清理）。

- [ ] **Step 4：跑 e2e**

```bash
npm run test:e2e
```

Expected: 1 passing。

- [ ] **Step 5：commit**

```bash
git add -A
git commit -m "chore: remove legacy single-purpose AI generators (replaced by unified)"
```

---

## Task 4：手動驗證

**Files:** 無

- [ ] **Step 1：跑 dev**

```bash
npm run dev
```

確認 `.env.local` 已有 `GEMINI_API_KEY`。

- [ ] **Step 2：完整流程實測**

走一遍：
1. 挑一個有 InBody 紀錄的學員（或新建一個並量 InBody）
2. 開新一堂課 → 加 2 動作 → 紀錄幾組 → 完成
3. 等 5–15 秒 AI 跑完
4. 跳到 `/weekly-plans/[id]` 編輯頁
5. 切換 7 天 tabs，確認**每一天**：
   - 步數 / 有氧 都有數字（不是空）
   - 飲食 4 餐有內容
   - 水分有 ml 數字（不是 2500 死值）
   - 睡眠有區間
   - 補充小訓練可能有 1–2 個動作（也可能空陣列）
   - 「教練給今天的話」**留空**（這個就是要留空給你手寫）
6. 整週給學員的話：上方的 textarea 應該有 AI 生的 100–150 字
7. 改一個欄位（例如水分 2500 → 3000），等 1 秒，重整頁面 → 值已存

- [ ] **Step 3：驗證 fallback**

暫時把 `.env.local` 的 `GEMINI_API_KEY` 改錯（例如尾巴加幾個字），重啟 dev，再跑一遍流程。應該：
- weekly plan 仍能產生（不會卡死）
- 步數 / 有氧 走 R3 規則填
- 飲食、水分（2500）、睡眠（7-8）、補充小訓練、整週的話都會是 fallback 預設

驗證完把 key 改回來。

- [ ] **Step 4：（無需 commit）驗收**

完成。

---

## 驗收清單

- [ ] `npm test` 49 passing（淨值不變：移掉 4 + 加 4）
- [ ] `npm run test:e2e` 1 passing
- [ ] `npx tsc --noEmit` 無錯
- [ ] 有 GEMINI_API_KEY 時，產生 weekly plan 後每日的步數、有氧、飲食、水分、睡眠、補充訓練都由 AI 填
- [ ] 「教練給今天的話」（daily_plans.coachMessage）保持空白
- [ ] 整週給學員的話（weeklyPlans.coachOverallMessage）有 AI 草稿
- [ ] 沒 GEMINI_API_KEY 時 fallback 不報錯
- [ ] 3 commits（task 1、task 2、task 3）

---

## 不做的事

- 不改 UI（編輯頁、PDF 都已能讀新欄位）
- 不換 Gemini 為其他模型
- 不加 prompt 編輯 UI（之後在 settings 再做）
