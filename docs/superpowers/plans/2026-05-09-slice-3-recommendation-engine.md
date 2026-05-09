# Slice 3：建議引擎（規則 R1、R2、R3）— Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** 實作 spec §6 的訓練菜單建議（R1）、重量建議（R2）、走路步數／有氧建議（R3）三套規則，並把 R1 接到「開始新一堂課」流程、把 R2 接到「即時紀錄頁」的重量輸入框 placeholder。

**Architecture:** 純 TypeScript 函式，無 DB schema 變更。每條規則一個檔案一份 unit test。把資料抓取與規則計算分層：規則函式只接 plain object input，資料抓取在 server actions 裡組裝。

**Spec reference:** §6 R1/R2/R3, §6 規則參數可調表

**Slice 1+2 完成狀態（依賴）：**
- 22 個 commits, 19 unit tests, e2e 1 test 全綠
- 訓練紀錄基本流程跑得通
- Session.targetMuscleGroups 第 1/2/3 堂硬編碼

---

## Slice 3 共 5 個 Tasks

| # | Task | 重點 |
|---|------|------|
| 1 | 規則 R3：走路步數 / 有氧建議 | 純函式 + 測試 |
| 2 | 規則 R2：重量建議 | 純函式 + 測試 |
| 3 | 規則 R1：下次訓練肌群 | 純函式 + 測試 |
| 4 | 把 R1 接進 startSession | 整合 |
| 5 | 把 R2 接進 SetRow 的 placeholder | 整合 |

---

## Task 1：規則 R3 — 走路 / 有氧建議

**Files:**
- Create: `src/lib/recommendations/daily-activity.ts`
- Create: `src/lib/recommendations/daily-activity.test.ts`

**規則內容（spec §6 R3）：**

| 目標 | 步數 | 有氧 |
|------|------|------|
| 增肌 | 5000–7000 | 0–15 |
| 減脂 | 8000–12000 | 20–40 |
| 體能 | 8000–10000 | 15–30 |
| custom | 同 fitness | 同 fitness |

調整：
- 上課日：步數打 0.5（取下限）；有氧設 0
- 減脂目標的「步數上限」：BMI ≥ 30 → 取 max；BMI < 25 → 取中間值；BMI 25-30 → 取 max−1000

- [ ] **Step 1：寫測試**

`src/lib/recommendations/daily-activity.test.ts`：

```ts
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
```

- [ ] **Step 2：跑測試確認失敗**

```bash
npm test
```

Expected: FAIL（檔案不存在）

- [ ] **Step 3：實作**

`src/lib/recommendations/daily-activity.ts`：

```ts
export type Goal = "muscle_gain" | "fat_loss" | "fitness" | "custom";

export interface DailyActivityInput {
  goal: Goal;
  isClassDay: boolean;
  bmi?: number | null;
}

export interface DailyActivityOutput {
  stepsTarget: number;
  cardioMinutesTarget: number;
}

const RANGES: Record<
  Exclude<Goal, "custom">,
  { steps: [number, number]; cardio: [number, number] }
> = {
  muscle_gain: { steps: [5000, 7000], cardio: [0, 15] },
  fat_loss: { steps: [8000, 12000], cardio: [20, 40] },
  fitness: { steps: [8000, 10000], cardio: [15, 30] },
};

export function recommendDailyActivity(
  input: DailyActivityInput
): DailyActivityOutput {
  const goalKey = input.goal === "custom" ? "fitness" : input.goal;
  const r = RANGES[goalKey];

  // 預設取中間
  let steps = Math.round((r.steps[0] + r.steps[1]) / 2);
  let cardio = Math.round((r.cardio[0] + r.cardio[1]) / 2);

  // 減脂特殊邏輯：依 BMI 決定上限
  if (goalKey === "fat_loss") {
    if (input.bmi == null) steps = (r.steps[0] + r.steps[1]) / 2;
    else if (input.bmi >= 30) steps = r.steps[1];
    else if (input.bmi >= 25) steps = r.steps[1] - 1000;
    else steps = (r.steps[0] + r.steps[1]) / 2;
  }

  // 上課日：步數取下限、有氧 = 0
  if (input.isClassDay) {
    steps = r.steps[0];
    cardio = 0;
  }

  return { stepsTarget: Math.round(steps), cardioMinutesTarget: cardio };
}
```

- [ ] **Step 4：跑測試確認通過**

```bash
npm test
```

Expected: PASS（新 8 個 + 既有 19 個 = 27 個）

- [ ] **Step 5：commit**

```bash
git add .
git commit -m "feat: rule R3 daily activity recommendation"
```

---

## Task 2：規則 R2 — 重量建議

**Files:**
- Create: `src/lib/recommendations/weight-suggestion.ts`
- Create: `src/lib/recommendations/weight-suggestion.test.ts`
- Modify: `src/lib/actions/sessions.ts`（加 `getLastSetForExercise` helper）

**規則內容：** 取該學員最近一次該動作的最後一組 set log：
- RPE ≤ 7 且未力竭 → +5%
- RPE 8–9 → 持平
- RPE = 10 或力竭 → −5%
- 從未做過 → 不建議（return null）

四捨五入到 2.5kg。

- [ ] **Step 1：寫測試**

`src/lib/recommendations/weight-suggestion.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { suggestNextWeight } from "./weight-suggestion";

describe("suggestNextWeight", () => {
  it("沒有歷史紀錄 → null", () => {
    expect(suggestNextWeight(null)).toBeNull();
  });

  it("RPE 6 未力竭 → +5%（四捨五入到 2.5kg）", () => {
    // 60kg * 1.05 = 63 → round to 62.5
    expect(
      suggestNextWeight({ weightKg: 60, rpe: 6, toFailure: false })
    ).toBe(62.5);
  });

  it("RPE 7 未力竭 → +5%", () => {
    expect(
      suggestNextWeight({ weightKg: 80, rpe: 7, toFailure: false })
    ).toBe(85); // 80 * 1.05 = 84 → round to 85.0 (or 82.5? check)
    // 84 / 2.5 = 33.6 → round = 34 * 2.5 = 85. Yes 85.
  });

  it("RPE 8 → 持平", () => {
    expect(
      suggestNextWeight({ weightKg: 70, rpe: 8, toFailure: false })
    ).toBe(70);
  });

  it("RPE 9 → 持平", () => {
    expect(
      suggestNextWeight({ weightKg: 70, rpe: 9, toFailure: false })
    ).toBe(70);
  });

  it("RPE 10 → −5%", () => {
    // 80 * 0.95 = 76 → round to 75
    expect(
      suggestNextWeight({ weightKg: 80, rpe: 10, toFailure: false })
    ).toBe(75);
  });

  it("RPE 7 但力竭 → −5%", () => {
    expect(
      suggestNextWeight({ weightKg: 80, rpe: 7, toFailure: true })
    ).toBe(75);
  });

  it("weightKg 為 null → null", () => {
    expect(
      suggestNextWeight({ weightKg: null, rpe: 7, toFailure: false })
    ).toBeNull();
  });

  it("rpe 為 null → null（資料不足）", () => {
    expect(
      suggestNextWeight({ weightKg: 60, rpe: null, toFailure: false })
    ).toBeNull();
  });
});
```

- [ ] **Step 2：跑測試確認失敗**

- [ ] **Step 3：實作**

`src/lib/recommendations/weight-suggestion.ts`：

```ts
export interface LastSetSnapshot {
  weightKg: number | null;
  rpe: number | null;
  toFailure: boolean;
}

/**
 * 規則 R2：依上次同動作最後一組決定下次建議重量
 */
export function suggestNextWeight(
  last: LastSetSnapshot | null
): number | null {
  if (!last) return null;
  if (last.weightKg == null || last.rpe == null) return null;

  let factor = 1; // 持平

  if (last.toFailure || last.rpe >= 10) {
    factor = 0.95;
  } else if (last.rpe <= 7) {
    factor = 1.05;
  }
  // 8 或 9 維持 1.0

  const raw = last.weightKg * factor;
  // 四捨五入到 2.5kg
  return Math.round(raw / 2.5) * 2.5;
}
```

- [ ] **Step 4：跑測試確認通過**

- [ ] **Step 5：在 sessions.ts 加 helper**

加到 `src/lib/actions/sessions.ts`：

```ts
import { sql } from "drizzle-orm";

/**
 * 找學員 X 上一次做動作 Y 的最後一組（最新 session 的最大 setNumber）
 * 用來推算 weight suggestion
 */
export async function getLastSetForExercise(
  studentId: number,
  exerciseId: number
): Promise<{ weightKg: number | null; rpe: number | null; toFailure: boolean } | null> {
  // 找該學員最近一次 session 中該動作的最大 setNumber 那組
  const row = db
    .select({
      weightKg: setLogs.weightKg,
      rpe: setLogs.rpe,
      toFailure: setLogs.toFailure,
    })
    .from(setLogs)
    .innerJoin(
      sessionExercises,
      eq(setLogs.sessionExerciseId, sessionExercises.id)
    )
    .innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
    .where(
      and(
        eq(sessions.studentId, studentId),
        eq(sessionExercises.exerciseId, exerciseId)
      )
    )
    .orderBy(
      desc(sessions.sessionNumber),
      desc(setLogs.setNumber)
    )
    .limit(1)
    .get();

  return row ?? null;
}
```

- [ ] **Step 6：跑 type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 7：commit**

```bash
git add .
git commit -m "feat: rule R2 weight suggestion + last-set lookup helper"
```

---

## Task 3：規則 R1 — 下次訓練肌群

**Files:**
- Create: `src/lib/recommendations/next-muscle-groups.ts`
- Create: `src/lib/recommendations/next-muscle-groups.test.ts`

**規則內容（簡化但符合 spec）：**

```
依目標分流（基底）：
  增肌 → 三分化循環 [chest, legs, back]，依 sessionNumber % 3
  減脂 → 推/拉/腿循環 [chest_arm, back_arm, legs]
  體能 → 全身輪動 [full_body]
  custom → fallback 到 fitness

調整因子：
  上次該肌群平均 RPE > 8.5 → 降強度（換到下一個肌群循環）
  weeklyClassCount = 1 → 直接帶 ["chest", "back", "legs"] 全身
  weeklyClassCount = 2 → 上下肢分化（[chest, back] 或 [legs]）
  weeklyClassCount >= 3 → 嚴格分化（單肌群）
```

> **說明：** 這套規則為 MVP 版本。實際運用後會根據真學員測試結果調整。

- [ ] **Step 1：寫測試**

`src/lib/recommendations/next-muscle-groups.test.ts`：

```ts
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
```

- [ ] **Step 2：跑測試確認失敗**

- [ ] **Step 3：實作**

`src/lib/recommendations/next-muscle-groups.ts`：

```ts
export type Goal = "muscle_gain" | "fat_loss" | "fitness" | "custom";
export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulder"
  | "arm"
  | "core"
  | "small_muscles";

export interface NextMuscleInput {
  goal: Goal;
  sessionNumber: number;
  weeklyClassCount: number;
  lastSessionAvgRpe?: number | null;
}

const FIRST_THREE: Record<number, MuscleGroup[]> = {
  1: ["chest", "small_muscles"],
  2: ["legs", "small_muscles"],
  3: ["back", "small_muscles"],
};

const MUSCLE_GAIN_CYCLE: MuscleGroup[][] = [
  ["chest", "small_muscles"],
  ["legs", "small_muscles"],
  ["back", "small_muscles"],
];

const FAT_LOSS_CYCLE: MuscleGroup[][] = [
  ["chest", "arm"], // 推日
  ["back", "arm"], // 拉日
  ["legs", "core"],
];

export function recommendNextMuscleGroups(
  input: NextMuscleInput
): MuscleGroup[] {
  // 前 3 堂硬編碼
  if (FIRST_THREE[input.sessionNumber]) {
    return FIRST_THREE[input.sessionNumber];
  }

  const goal: Goal = input.goal === "custom" ? "fitness" : input.goal;

  // 一週只 1 堂或體能模式 → 全身
  if (input.weeklyClassCount <= 1 || goal === "fitness") {
    return ["chest", "back", "legs"];
  }

  // 一週 2 堂 → 上下肢分化
  if (input.weeklyClassCount === 2) {
    // session 4, 6, 8... → 上肢；session 5, 7, 9... → 下肢
    const isUpperDay = (input.sessionNumber - 4) % 2 === 0;
    return isUpperDay ? ["chest", "back"] : ["legs", "core"];
  }

  // 一週 ≥ 3 堂：嚴格分化
  // 索引從 (sessionNumber - 4) % 3 開始
  let index = (input.sessionNumber - 4) % 3;
  if (index < 0) index = (index + 3) % 3;

  // 疲勞調整：上次平均 RPE > 8.5 → 跳到下一循環項
  if (
    input.lastSessionAvgRpe != null &&
    input.lastSessionAvgRpe > 8.5
  ) {
    index = (index + 1) % 3;
  }

  const cycle =
    goal === "fat_loss" ? FAT_LOSS_CYCLE : MUSCLE_GAIN_CYCLE;
  return cycle[index];
}
```

- [ ] **Step 4：跑測試確認通過**

- [ ] **Step 5：commit**

```bash
git add .
git commit -m "feat: rule R1 next muscle groups recommendation"
```

---

## Task 4：把 R1 接進 startSession

**Files:**
- Modify: `src/lib/actions/sessions.ts`

把現有 `startSession` 中的「fallback 到 chest」這段，改用 `recommendNextMuscleGroups`，並抓取必要的歷史資料（學員 goal + 上次 session 的平均 RPE）。

- [ ] **Step 1：擴充 startSession**

修改 `src/lib/actions/sessions.ts` 中的 `startSession`：

```ts
import { recommendNextMuscleGroups } from "@/lib/recommendations/next-muscle-groups";

// ... 在 startSession 內，計算 muscleGroups 之前加一段：

export async function startSession(input: SessionStartInput) {
  const parsed = sessionStartInputSchema.parse(input);

  const last = db
    .select({ n: sessions.sessionNumber })
    .from(sessions)
    .where(eq(sessions.studentId, parsed.studentId))
    .orderBy(desc(sessions.sessionNumber))
    .limit(1)
    .get();
  const sessionNumber = (last?.n ?? 0) + 1;

  // 學員資料
  const student = db
    .select()
    .from(students)
    .where(eq(students.id, parsed.studentId))
    .get();
  if (!student) throw new Error("Student not found");

  // 上次 session 的平均 RPE（用於降強度判斷）
  let lastSessionAvgRpe: number | null = null;
  if (sessionNumber > 1) {
    const prevSession = db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.studentId, parsed.studentId),
          eq(sessions.status, "completed")
        )
      )
      .orderBy(desc(sessions.sessionNumber))
      .limit(1)
      .get();
    if (prevSession) {
      const rpes = db
        .select({ rpe: setLogs.rpe })
        .from(setLogs)
        .innerJoin(
          sessionExercises,
          eq(setLogs.sessionExerciseId, sessionExercises.id)
        )
        .where(eq(sessionExercises.sessionId, prevSession.id))
        .all();
      const validRpes = rpes
        .map((r) => r.rpe)
        .filter((v): v is number => v != null);
      if (validRpes.length > 0) {
        lastSessionAvgRpe =
          validRpes.reduce((a, b) => a + b, 0) / validRpes.length;
      }
    }
  }

  // 決定肌群：覆寫 > 規則
  const muscleGroups = parsed.targetMuscleGroups ??
    recommendNextMuscleGroups({
      goal: student.goal,
      sessionNumber,
      weeklyClassCount: student.weeklyClassCount,
      lastSessionAvgRpe,
    });

  const result = db
    .insert(sessions)
    .values({
      studentId: parsed.studentId,
      sessionNumber,
      scheduledAt: parsed.scheduledAt,
      targetMuscleGroups: muscleGroups,
      status: "in_progress",
      startedAt: new Date().toISOString(),
    })
    .returning({ id: sessions.id })
    .all();

  revalidatePath(`/students/${parsed.studentId}/sessions`);
  redirect(`/sessions/${result[0].id}`);
}
```

> **記得：** 在檔案頂部 import `students` 與 `and`（如果還沒有）。`sessionExercises`、`setLogs`、`sessions`、`asc`、`desc`、`eq` 應該都已經在。

也記得移除舊的 `FIRST_THREE_MUSCLE_GROUPS` 常數（它的功能被 `recommendNextMuscleGroups` 取代）。

- [ ] **Step 2：跑 type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3：手動驗證**

```bash
npm run dev
```

新建一個學員（一週 3 堂、增肌目標），開始第 1 堂課 → 應該是「胸 + 小肌群」（硬編碼）。完成後（在 DB 裡 manual 改 status = completed，或在 UI 點完成）再開第 2 堂 → 應該是「腿 + 小肌群」。直到第 4 堂之後就會用 R1。

- [ ] **Step 4：commit**

```bash
git add .
git commit -m "feat: integrate rule R1 into session start"
```

---

## Task 5：把 R2 接進 SetRow placeholder

**Files:**
- Modify: `src/lib/actions/sessions.ts`（`getSessionWithDetails` 增加 `weightSuggestion` 欄位）
- Modify: `src/components/session-recorder.tsx`（傳 weightSuggestion 給 SetRow）
- Modify: `src/components/set-row.tsx`（在 weight input 顯示 placeholder）

- [ ] **Step 1：擴充 getSessionWithDetails 回傳結構**

修改 `src/lib/actions/sessions.ts` 的 `getSessionWithDetails`，在每個 exercise 上加 `weightSuggestion`：

```ts
import { suggestNextWeight } from "@/lib/recommendations/weight-suggestion";

export async function getSessionWithDetails(sessionId: number) {
  const session = db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get();
  if (!session) return null;

  const exerciseRows = db
    .select({
      sessionExercise: sessionExercises,
      exercise: exercises,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(asc(sessionExercises.orderIndex))
    .all();

  const sessionExerciseIds = exerciseRows.map((r) => r.sessionExercise.id);
  let sets: typeof setLogs.$inferSelect[] = [];
  if (sessionExerciseIds.length > 0) {
    const { inArray } = await import("drizzle-orm");
    sets = db
      .select()
      .from(setLogs)
      .where(inArray(setLogs.sessionExerciseId, sessionExerciseIds))
      .orderBy(asc(setLogs.sessionExerciseId), asc(setLogs.setNumber))
      .all();
  }

  // 為每個動作算重量建議（取該學員上次同動作最後一組）
  const exercisesWithSuggestion = await Promise.all(
    exerciseRows.map(async ({ sessionExercise, exercise }) => {
      // 排除「正在這個 session 紀錄」的數據——只看其他 session
      const lastSet = db
        .select({
          weightKg: setLogs.weightKg,
          rpe: setLogs.rpe,
          toFailure: setLogs.toFailure,
        })
        .from(setLogs)
        .innerJoin(
          sessionExercises,
          eq(setLogs.sessionExerciseId, sessionExercises.id)
        )
        .innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
        .where(
          and(
            eq(sessions.studentId, session.studentId),
            eq(sessionExercises.exerciseId, exercise.id),
            sql`${sessions.id} != ${sessionId}`
          )
        )
        .orderBy(desc(sessions.sessionNumber), desc(setLogs.setNumber))
        .limit(1)
        .get();

      return {
        sessionExercise,
        exercise,
        sets: sets.filter((s) => s.sessionExerciseId === sessionExercise.id),
        weightSuggestion: suggestNextWeight(lastSet ?? null),
      };
    })
  );

  return {
    session,
    exercises: exercisesWithSuggestion,
  };
}
```

> **記得：** 在頂部加 `import { sql } from "drizzle-orm";` 如果還沒有。

- [ ] **Step 2：把 weightSuggestion 傳到 SetRow**

修改 `src/components/session-recorder.tsx`：

在 `Props` 介面的 `exercises` 內加 `weightSuggestion: number | null`。在渲染 SetRow 的地方把這個 prop 傳下去。如果動作下沒有 set，新增第一組時也用建議重量為預設：

```tsx
{exercises.map(({ sessionExercise, exercise, sets, weightSuggestion }) => (
  <div key={sessionExercise.id} className="border rounded-lg p-4">
    {/* ... 既有 header ... */}
    <table className="w-full">
      {/* ... thead ... */}
      <tbody>
        {sets.map((s) => (
          <SetRow
            key={s.id}
            set={s}
            weightSuggestion={weightSuggestion}
          />
        ))}
      </tbody>
    </table>

    {session.status !== "completed" && (
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => {
          const last = sets[sets.length - 1];
          startTransition(async () => {
            await createSetLog({
              sessionExerciseId: sessionExercise.id,
              setNumber: sets.length + 1,
              // 新組的預設重量：如果還沒有任何組，用建議；否則繼承上一組
              weightKg: last?.weightKg ?? weightSuggestion ?? null,
              reps: last?.reps ?? null,
              rpe: null,
              toFailure: false,
            });
            router.refresh();
          });
        }}
        disabled={pending}
      >
        + 新增一組
      </Button>
    )}
  </div>
))}
```

`Props` 介面也要更新：
```tsx
exercises: {
  sessionExercise: SessionExercise;
  exercise: Exercise;
  sets: SetLog[];
  weightSuggestion: number | null;
}[];
```

- [ ] **Step 3：在 SetRow 顯示建議**

修改 `src/components/set-row.tsx`：

加 `weightSuggestion` 進 Props，在 weight input 的 `placeholder` 中顯示建議值：

```tsx
interface Props {
  set: SetLog;
  weightSuggestion: number | null;
  readOnly?: boolean;  // 如果 chunk C 已經加了
}

// 在 weight Input 的部分：
<Input
  type="number"
  step="2.5"
  inputMode="decimal"
  value={local.weightKg}
  onChange={(e) =>
    setLocal((l) => ({ ...l, weightKg: e.target.value }))
  }
  placeholder={
    weightSuggestion != null ? `建議 ${weightSuggestion}kg` : "kg"
  }
  className="w-24 text-center"
  readOnly={readOnly}
  disabled={readOnly}
/>
```

- [ ] **Step 4：跑 type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5：手動測試**

1. 建一個學員、做一堂課，做槓鈴臥推 60kg×10 RPE7（不力竭），完成
2. 開第二堂課（會自動是「腿+小肌群」）
3. 用「+ 新增動作」加「槓鈴臥推」
4. 加一組 → 重量欄 placeholder 應該顯示「建議 62.5kg」（60 × 1.05 ≈ 63 → 62.5）
5. 新組預設值也應該是 62.5

- [ ] **Step 6：commit**

```bash
git add .
git commit -m "feat: integrate rule R2 weight suggestion into session UI"
```

---

## Slice 3 驗收清單

- [ ] `npm test` 為 19（既有）+ 8（R3）+ 9（R2）+ 10（R1）= 46 passed
- [ ] `npx tsc --noEmit` 無錯
- [ ] 第 1/2/3 堂自動是 chest/legs/back + small_muscles
- [ ] 第 4 堂以後依目標 + 一週次數動態決定
- [ ] 上次平均 RPE > 8.5 會跳過該肌群
- [ ] 重量輸入框 placeholder 顯示「建議 X kg」（取上次同動作最後一組）
- [ ] 新組預設值繼承上一組或建議值
- [ ] 5 個 commits（R3、R2 + helper、R1、R1 整合、R2 整合）

---

## Out of Scope（Slice 3 不做）

- WeeklyPlan + DailyPlan（用到 R3 的成果）→ Slice 4
- AI 飲食建議 → Slice 4
- PDF → Slice 5
- coach_settings 表（讓教練自己調整規則參數）→ Slice 6
