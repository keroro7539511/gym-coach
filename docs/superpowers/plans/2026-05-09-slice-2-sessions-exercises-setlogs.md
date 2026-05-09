# Slice 2：訓練課 + 動作主檔 + 即時紀錄頁 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 實作 spec §3 的 Session、SessionExercise、SetLog、Exercise 四個資料表與對應的頁面，交付可用的「核心紀錄頁」：教練可以開新課 → 加動作 → 紀錄每組（重量/次數/RPE/力竭/心率）→ 完成課程。

**Architecture:** 沿用 slice 1 的 Next.js + SQLite + Drizzle 架構。新增表透過 drizzle migration。Exercise 主檔首次啟動從 wger API 同步（離線後可用本地副本）。即時紀錄頁採用 server actions + optimistic UI 達到「每改一格自動存」的體驗。

**Tech Stack:** 沿用 slice 1。新增：可能需要 `nanoid` 或類似工具產生 client-side temp id 給尚未 persist 的 set rows。

**Spec reference:** `docs/superpowers/specs/2026-05-09-gym-coach-app-design.md`（特別是 §4 資料模型、§5 情境 2「上課中即時紀錄」、§6 R2 重量建議規則）

**Slice 1 完成狀態（依賴）：**
- `students` 與 `inbody_records` 表存在
- shadcn/ui 元件可用（注意：`Button` 沒有 `asChild`，用 `buttonVariants()`）
- Next.js 16 用 `params: Promise<{...}>` + `await params`
- `react-hook-form` + Zod 整合

---

## Slice 2 共 7 個 Tasks

| # | Task | 重點 |
|---|------|------|
| 1 | 新增 Session、SessionExercise、SetLog、Exercise 表（schema + migration） | 資料層 |
| 2 | 預載動作清單（從 wger 同步 + fallback 內建清單） | 主檔資料 |
| 3 | Validators + Server actions（Exercise / Session / SessionExercise / SetLog） | API 層 |
| 4 | Exercise 主檔頁（`/exercises`） | 動作管理 |
| 5 | 學員子頁加上「訓練紀錄」分頁，顯示 session 列表 | 串連 |
| 6 | 新增 Session 流程（`/sessions/new`） | 開課 |
| 7 | **核心：上課中即時紀錄頁（`/sessions/[id]`）** | 主戰場 |

---

## Task 1：新增 schema + migration

**Files:**
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1：擴充 schema**

在現有 `src/lib/db/schema.ts` **後面** 加入以下表（保留原有 students 與 inbody_records）：

```ts
// ─── 訓練課相關 ─────────────────────────────────────────

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  muscleGroup: text("muscle_group", {
    enum: ["chest", "back", "legs", "shoulder", "arm", "core", "small_muscles"],
  }).notNull(),
  equipment: text("equipment"),
  demoImageUrl: text("demo_image_url"),
  description: text("description"),
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
  wgerId: integer("wger_id"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  sessionNumber: integer("session_number").notNull(), // 該學員的流水號
  scheduledAt: text("scheduled_at"),
  startedAt: text("started_at"),
  endedAt: text("ended_at"),
  targetMuscleGroups: text("target_muscle_groups", { mode: "json" })
    .$type<string[]>()
    .notNull(),
  status: text("status", {
    enum: ["scheduled", "in_progress", "completed"],
  })
    .notNull()
    .default("scheduled"),
  coachNotes: text("coach_notes"),
  nextSessionDate: text("next_session_date"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const sessionExercises = sqliteTable("session_exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  orderIndex: integer("order_index").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const setLogs = sqliteTable("set_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionExerciseId: integer("session_exercise_id")
    .notNull()
    .references(() => sessionExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  weightKg: real("weight_kg"),
  reps: integer("reps"),
  rpe: integer("rpe"), // 1-10
  toFailure: integer("to_failure", { mode: "boolean" }).notNull().default(false),
  heartRateBpm: integer("heart_rate_bpm"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SessionExercise = typeof sessionExercises.$inferSelect;
export type NewSessionExercise = typeof sessionExercises.$inferInsert;
export type SetLog = typeof setLogs.$inferSelect;
export type NewSetLog = typeof setLogs.$inferInsert;
```

- [ ] **Step 2：產生並跑 migration**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Expected: 新 SQL 檔產生，4 個新表寫進 `data/gym.db`。

- [ ] **Step 3：commit**

```bash
git add .
git commit -m "feat: add session/exercise/setlog schema with migration"
```

---

## Task 2：預載動作清單

**Files:**
- Create: `src/lib/db/seed-exercises.ts`
- Create: `scripts/seed-exercises.ts`
- Modify: `package.json`（加 `db:seed` script）

策略：
- 嘗試從 wger API 抓常見的肌力訓練動作（filter category）
- 如果 wger 不可達或 fail，fallback 到一份內建的 30 個動作清單
- Idempotent：執行多次不會產生重複資料（用 `wger_id` 或 `name` 去重）

- [ ] **Step 1：寫內建 fallback 動作清單**

`src/lib/db/seed-exercises.ts`：

```ts
import { db } from "./client";
import { exercises, type NewExercise } from "./schema";
import { eq } from "drizzle-orm";

// 30 個常見動作的 fallback 清單（不依賴 wger）
const FALLBACK_EXERCISES: NewExercise[] = [
  // 胸
  { name: "槓鈴臥推", muscleGroup: "chest", equipment: "槓鈴 + 臥推椅" },
  { name: "啞鈴臥推", muscleGroup: "chest", equipment: "啞鈴 + 臥推椅" },
  { name: "上斜啞鈴臥推", muscleGroup: "chest", equipment: "啞鈴 + 上斜椅" },
  { name: "啞鈴飛鳥", muscleGroup: "chest", equipment: "啞鈴 + 平椅" },
  { name: "蝴蝶機夾胸", muscleGroup: "chest", equipment: "蝴蝶機" },
  { name: "雙槓撐體", muscleGroup: "chest", equipment: "雙槓" },
  // 背
  { name: "硬舉", muscleGroup: "back", equipment: "槓鈴" },
  { name: "羅馬尼亞硬舉", muscleGroup: "back", equipment: "槓鈴" },
  { name: "高拉滑輪", muscleGroup: "back", equipment: "高拉滑輪機" },
  { name: "坐姿划船", muscleGroup: "back", equipment: "划船機" },
  { name: "槓鈴划船", muscleGroup: "back", equipment: "槓鈴" },
  { name: "引體向上", muscleGroup: "back", equipment: "單槓" },
  // 腿
  { name: "深蹲", muscleGroup: "legs", equipment: "槓鈴 + 深蹲架" },
  { name: "前蹲舉", muscleGroup: "legs", equipment: "槓鈴 + 深蹲架" },
  { name: "腿推", muscleGroup: "legs", equipment: "腿推機" },
  { name: "腿伸屈", muscleGroup: "legs", equipment: "腿伸屈機" },
  { name: "腿彎舉", muscleGroup: "legs", equipment: "腿彎舉機" },
  { name: "保加利亞分腿蹲", muscleGroup: "legs", equipment: "啞鈴 + 板凳" },
  { name: "小腿提踵", muscleGroup: "legs", equipment: "提踵機 / 啞鈴" },
  // 肩
  { name: "啞鈴肩推", muscleGroup: "shoulder", equipment: "啞鈴" },
  { name: "槓鈴肩推", muscleGroup: "shoulder", equipment: "槓鈴" },
  { name: "側平舉", muscleGroup: "shoulder", equipment: "啞鈴" },
  { name: "後三角飛鳥", muscleGroup: "shoulder", equipment: "啞鈴" },
  // 手
  { name: "二頭彎舉", muscleGroup: "arm", equipment: "啞鈴 / 槓鈴" },
  { name: "三頭下壓", muscleGroup: "arm", equipment: "滑輪機" },
  { name: "鎚式彎舉", muscleGroup: "arm", equipment: "啞鈴" },
  // 核心 / 小肌群
  { name: "棒式", muscleGroup: "core", equipment: "墊子" },
  { name: "卷腹", muscleGroup: "core", equipment: "墊子" },
  { name: "懸垂舉腿", muscleGroup: "core", equipment: "單槓" },
  { name: "登階", muscleGroup: "small_muscles", equipment: "板凳 / 啞鈴" },
];

interface WgerExercise {
  id: number;
  name: string;
  description: string;
  category: number;
  equipment: number[];
}

interface WgerCategory {
  id: number;
  name: string;
}

// wger category id 對應到我們的 muscleGroup
// 取自 https://wger.de/api/v2/exercisecategory/
const WGER_CATEGORY_MAP: Record<number, NewExercise["muscleGroup"]> = {
  10: "arm", // Arms
  8: "legs", // Legs
  12: "back", // Back
  11: "chest", // Chest
  13: "shoulder", // Shoulders
  14: "core", // Calves (歸 small_muscles 也行)
  9: "small_muscles", // Abs
};

async function fetchWgerEnglishExercises(): Promise<NewExercise[]> {
  // wger 公開 API，英文 (language=2)
  // 限制 50 筆並取 status=2 (approved)
  const url =
    "https://wger.de/api/v2/exerciseinfo/?language=2&status=2&limit=80&ordering=name";
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`wger HTTP ${res.status}`);
  const data = (await res.json()) as { results: WgerExercise[] };

  const list: NewExercise[] = [];
  for (const ex of data.results ?? []) {
    const mg = WGER_CATEGORY_MAP[ex.category];
    if (!mg) continue;
    list.push({
      name: ex.name, // 英文名先當主名（之後可手動翻成中文）
      nameEn: ex.name,
      muscleGroup: mg,
      equipment: null,
      description: stripHtml(ex.description ?? "").slice(0, 500),
      isCustom: false,
      wgerId: ex.id,
    });
  }
  return list;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

export async function seedExercises(): Promise<{ inserted: number; source: string }> {
  // 已有資料就不重建
  const existing = db.select().from(exercises).all();
  if (existing.length > 0) {
    return { inserted: 0, source: `already-seeded (${existing.length} exercises)` };
  }

  // 嘗試 wger，失敗就 fallback
  let toInsert: NewExercise[];
  let source: string;
  try {
    toInsert = await fetchWgerEnglishExercises();
    source = `wger (${toInsert.length})`;
    if (toInsert.length === 0) {
      throw new Error("wger returned 0 mappable exercises");
    }
  } catch (err) {
    console.warn("[seed] wger 不可達或失敗，改用內建清單:", err);
    toInsert = FALLBACK_EXERCISES;
    source = `fallback (${toInsert.length})`;
  }

  for (const ex of toInsert) {
    // 用 name 或 wgerId 去重（雙保險）
    const existsByName = db
      .select()
      .from(exercises)
      .where(eq(exercises.name, ex.name))
      .get();
    if (existsByName) continue;
    if (ex.wgerId) {
      const existsByWgerId = db
        .select()
        .from(exercises)
        .where(eq(exercises.wgerId, ex.wgerId))
        .get();
      if (existsByWgerId) continue;
    }
    db.insert(exercises).values(ex).run();
  }

  const total = db.select().from(exercises).all().length;
  return { inserted: total, source };
}
```

- [ ] **Step 2：寫 CLI 腳本**

`scripts/seed-exercises.ts`：

```ts
import { seedExercises } from "../src/lib/db/seed-exercises";

(async () => {
  const result = await seedExercises();
  console.log(`Seeded ${result.inserted} exercises from ${result.source}`);
  process.exit(0);
})();
```

- [ ] **Step 3：在 `package.json` scripts 加入**

```json
"db:seed": "tsx scripts/seed-exercises.ts"
```

如果 `tsx` 沒裝：
```bash
npm install -D tsx
```

- [ ] **Step 4：跑 seed 並驗證**

```bash
npm run db:seed
```

Expected: console 印出 `Seeded N exercises from wger (...)` 或 `Seeded 30 exercises from fallback (...)`。

驗證資料庫有資料：
```bash
sqlite3 data/gym.db "SELECT muscle_group, COUNT(*) FROM exercises GROUP BY muscle_group;"
```

應該看到各肌群的計數。

- [ ] **Step 5：commit**

```bash
git add .
git commit -m "feat: seed exercise master from wger with offline fallback"
```

---

## Task 3：Validators + Server Actions

**Files:**
- Create: `src/lib/validators/exercise.ts`
- Create: `src/lib/validators/session.ts`
- Create: `src/lib/actions/exercises.ts`
- Create: `src/lib/actions/sessions.ts`
- Create: `src/lib/actions/set-logs.ts`

> **TDD note:** 這個 task 寫測試的成本不高，建議用 vitest 測 validators。Server actions 涉及 DB，先不寫單元測試（slice 6 補 e2e）。

- [ ] **Step 1：寫 Exercise validator**

`src/lib/validators/exercise.ts`：

```ts
import { z } from "zod";

export const exerciseInputSchema = z.object({
  name: z.string().min(1, "動作名必填"),
  nameEn: z.string().optional(),
  muscleGroup: z.enum([
    "chest",
    "back",
    "legs",
    "shoulder",
    "arm",
    "core",
    "small_muscles",
  ]),
  equipment: z.string().optional(),
  demoImageUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
});

export type ExerciseInput = z.infer<typeof exerciseInputSchema>;
```

- [ ] **Step 2：寫 Session validator**

`src/lib/validators/session.ts`：

```ts
import { z } from "zod";

export const sessionStartInputSchema = z.object({
  studentId: z.number().int().positive(),
  scheduledAt: z.string().optional(),
  // 開課時可選擇覆寫 muscle group（第 4 堂以後使用建議引擎，slice 3 才實作）
  targetMuscleGroups: z.array(z.string()).min(1).optional(),
});

export type SessionStartInput = z.infer<typeof sessionStartInputSchema>;

export const setLogInputSchema = z.object({
  sessionExerciseId: z.number().int().positive(),
  setNumber: z.number().int().positive(),
  weightKg: z.number().nonnegative().max(1000).nullable().optional(),
  reps: z.number().int().min(0).max(500).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  toFailure: z.boolean().optional(),
  heartRateBpm: z.number().int().min(0).max(300).nullable().optional(),
  notes: z.string().optional(),
});

export type SetLogInput = z.infer<typeof setLogInputSchema>;
```

- [ ] **Step 3：寫 Exercise server actions**

`src/lib/actions/exercises.ts`：

```ts
"use server";

import { db } from "@/lib/db/client";
import { exercises } from "@/lib/db/schema";
import {
  exerciseInputSchema,
  type ExerciseInput,
} from "@/lib/validators/exercise";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function listExercises() {
  return db
    .select()
    .from(exercises)
    .orderBy(asc(exercises.muscleGroup), asc(exercises.name))
    .all();
}

export async function getExercise(id: number) {
  return db.select().from(exercises).where(eq(exercises.id, id)).get();
}

export async function createExercise(input: ExerciseInput) {
  const parsed = exerciseInputSchema.parse(input);
  const result = db
    .insert(exercises)
    .values({
      ...parsed,
      demoImageUrl: parsed.demoImageUrl || null,
      isCustom: true,
    })
    .returning({ id: exercises.id })
    .all();
  revalidatePath("/exercises");
  return result[0].id;
}

export async function updateExercise(id: number, input: ExerciseInput) {
  const parsed = exerciseInputSchema.parse(input);
  db.update(exercises)
    .set({
      ...parsed,
      demoImageUrl: parsed.demoImageUrl || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(exercises.id, id))
    .run();
  revalidatePath("/exercises");
  revalidatePath(`/exercises/${id}`);
}
```

- [ ] **Step 4：寫 Session server actions**

`src/lib/actions/sessions.ts`：

```ts
"use server";

import { db } from "@/lib/db/client";
import {
  sessions,
  sessionExercises,
  setLogs,
  exercises,
} from "@/lib/db/schema";
import {
  sessionStartInputSchema,
  type SessionStartInput,
} from "@/lib/validators/session";
import { eq, desc, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FIRST_THREE_MUSCLE_GROUPS: Record<number, string[]> = {
  1: ["chest", "small_muscles"],
  2: ["legs", "small_muscles"],
  3: ["back", "small_muscles"],
};

export async function startSession(input: SessionStartInput) {
  const parsed = sessionStartInputSchema.parse(input);

  // 該學員的 session_number 從 max+1
  const last = db
    .select({ n: sessions.sessionNumber })
    .from(sessions)
    .where(eq(sessions.studentId, parsed.studentId))
    .orderBy(desc(sessions.sessionNumber))
    .limit(1)
    .get();
  const sessionNumber = (last?.n ?? 0) + 1;

  // muscle group：覆寫 > 前三堂硬編碼 > slice 3 才會做的建議引擎 > fallback
  const muscleGroups =
    parsed.targetMuscleGroups ??
    FIRST_THREE_MUSCLE_GROUPS[sessionNumber] ??
    ["chest"]; // slice 3 會用建議引擎取代

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

export async function listSessionsForStudent(studentId: number) {
  return db
    .select()
    .from(sessions)
    .where(eq(sessions.studentId, studentId))
    .orderBy(desc(sessions.sessionNumber))
    .all();
}

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

  const sets = db
    .select()
    .from(setLogs)
    .where(
      // 找出屬於這 session 所有 sessionExercise 的 set logs
      // 用 IN 子句
      // drizzle 的 inArray helper
      // 暫時用簡單的 SQL: 撈所有再過濾
      // ↓ 改用 inArray
      // (避開時用 raw)
      undefined as never
    )
    .all();
  // 上面這個寫法不對，下面用 inArray：

  return null as never; // 占位，實際要用下面的整合查詢
}
```

> **註：** `getSessionWithDetails` 上面只是骨架。實際實作見下一步。

- [ ] **Step 5：補完 `getSessionWithDetails`**

把 Step 4 中 `getSessionWithDetails` 的內容**整段**換成：

```ts
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

  return {
    session,
    exercises: exerciseRows.map(({ sessionExercise, exercise }) => ({
      sessionExercise,
      exercise,
      sets: sets.filter((s) => s.sessionExerciseId === sessionExercise.id),
    })),
  };
}
```

- [ ] **Step 6：補上 Session、SessionExercise、SetLog 的其他 actions**

繼續加在 `src/lib/actions/sessions.ts`：

```ts
export async function addExerciseToSession(
  sessionId: number,
  exerciseId: number
) {
  const last = db
    .select({ n: sessionExercises.orderIndex })
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(desc(sessionExercises.orderIndex))
    .limit(1)
    .get();
  const orderIndex = (last?.n ?? -1) + 1;

  const result = db
    .insert(sessionExercises)
    .values({
      sessionId,
      exerciseId,
      orderIndex,
    })
    .returning({ id: sessionExercises.id })
    .all();

  revalidatePath(`/sessions/${sessionId}`);
  return result[0].id;
}

export async function removeExerciseFromSession(
  sessionExerciseId: number,
  sessionId: number
) {
  db.delete(sessionExercises)
    .where(eq(sessionExercises.id, sessionExerciseId))
    .run();
  revalidatePath(`/sessions/${sessionId}`);
}

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
}
```

- [ ] **Step 7：寫 SetLog server actions**

`src/lib/actions/set-logs.ts`：

```ts
"use server";

import { db } from "@/lib/db/client";
import { setLogs, sessionExercises } from "@/lib/db/schema";
import {
  setLogInputSchema,
  type SetLogInput,
} from "@/lib/validators/session";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createSetLog(input: SetLogInput): Promise<number> {
  const parsed = setLogInputSchema.parse(input);

  // 自動計算 set_number（該 sessionExercise 下一個流水號）
  const last = db
    .select({ n: setLogs.setNumber })
    .from(setLogs)
    .where(eq(setLogs.sessionExerciseId, parsed.sessionExerciseId))
    .orderBy(desc(setLogs.setNumber))
    .limit(1)
    .get();
  const setNumber = parsed.setNumber || (last?.n ?? 0) + 1;

  const result = db
    .insert(setLogs)
    .values({
      ...parsed,
      setNumber,
      toFailure: parsed.toFailure ?? false,
    })
    .returning({ id: setLogs.id })
    .all();

  // 找到 session id 用來 revalidate
  const se = db
    .select()
    .from(sessionExercises)
    .where(eq(sessionExercises.id, parsed.sessionExerciseId))
    .get();
  if (se) revalidatePath(`/sessions/${se.sessionId}`);

  return result[0].id;
}

export async function updateSetLog(id: number, input: Partial<SetLogInput>) {
  const cleaned = Object.fromEntries(
    Object.entries(input).filter(([_, v]) => v !== undefined)
  );

  db.update(setLogs)
    .set({
      ...cleaned,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(setLogs.id, id))
    .run();

  const setLog = db.select().from(setLogs).where(eq(setLogs.id, id)).get();
  if (setLog) {
    const se = db
      .select()
      .from(sessionExercises)
      .where(eq(sessionExercises.id, setLog.sessionExerciseId))
      .get();
    if (se) revalidatePath(`/sessions/${se.sessionId}`);
  }
}

export async function deleteSetLog(id: number) {
  const setLog = db.select().from(setLogs).where(eq(setLogs.id, id)).get();
  db.delete(setLogs).where(eq(setLogs.id, id)).run();

  if (setLog) {
    const se = db
      .select()
      .from(sessionExercises)
      .where(eq(sessionExercises.id, setLog.sessionExerciseId))
      .get();
    if (se) revalidatePath(`/sessions/${se.sessionId}`);
  }
}
```

- [ ] **Step 8：跑 type check 與 unit tests**

```bash
npx tsc --noEmit
npm test
```

Expected: 都通過（unit tests 仍是 19 個，因為這個 task 沒加新 unit test）。

- [ ] **Step 9：commit**

```bash
git add .
git commit -m "feat: validators and server actions for sessions, exercises, set logs"
```

---

## Task 4：Exercise 主檔頁

**Files:**
- Create: `src/app/exercises/page.tsx`
- Create: `src/app/exercises/new/page.tsx`
- Create: `src/app/exercises/[id]/edit/page.tsx`
- Create: `src/components/exercise-form.tsx`
- Modify: `src/components/nav.tsx`（加 Exercise 連結）

- [ ] **Step 1：擴充 Nav**

`src/components/nav.tsx`：

```tsx
import Link from "next/link";

export function Nav() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <Link href="/" className="font-bold text-lg">
          健身教練管理
        </Link>
        <div className="flex gap-4 text-sm">
          <Link href="/students" className="hover:underline">
            學員
          </Link>
          <Link href="/exercises" className="hover:underline">
            動作主檔
          </Link>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2：寫 Exercise form**

`src/components/exercise-form.tsx`：

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import {
  exerciseInputSchema,
  type ExerciseInput,
} from "@/lib/validators/exercise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  defaultValues?: Partial<ExerciseInput>;
  onSubmit: (input: ExerciseInput) => Promise<void>;
  submitLabel?: string;
}

export const MUSCLE_GROUP_LABEL: Record<string, string> = {
  chest: "胸",
  back: "背",
  legs: "腿",
  shoulder: "肩",
  arm: "手臂",
  core: "核心",
  small_muscles: "小肌群",
};

export function ExerciseForm({
  defaultValues,
  onSubmit,
  submitLabel = "儲存",
}: Props) {
  const [pending, startTransition] = useTransition();
  const form = useForm<ExerciseInput>({
    resolver: zodResolver(exerciseInputSchema),
    defaultValues: {
      name: "",
      muscleGroup: "chest",
      ...defaultValues,
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) =>
        startTransition(() => onSubmit(data))
      )}
      className="space-y-4 max-w-xl"
    >
      <div>
        <Label htmlFor="name">動作名稱（中文） *</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="nameEn">英文名稱</Label>
        <Input id="nameEn" {...form.register("nameEn")} />
      </div>

      <div>
        <Label>肌群 *</Label>
        <Select
          value={form.watch("muscleGroup")}
          onValueChange={(v) =>
            form.setValue("muscleGroup", v as ExerciseInput["muscleGroup"])
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MUSCLE_GROUP_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="equipment">器材</Label>
        <Input id="equipment" {...form.register("equipment")} />
      </div>

      <div>
        <Label htmlFor="demoImageUrl">示範圖網址</Label>
        <Input id="demoImageUrl" {...form.register("demoImageUrl")} />
      </div>

      <div>
        <Label htmlFor="description">說明</Label>
        <Textarea id="description" rows={4} {...form.register("description")} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "儲存中…" : submitLabel}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3：列表頁**

`src/app/exercises/page.tsx`：

```tsx
import Link from "next/link";
import { listExercises } from "@/lib/actions/exercises";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MUSCLE_GROUP_LABEL } from "@/components/exercise-form";

export default async function ExercisesPage() {
  const list = await listExercises();

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">動作主檔</h1>
        <Link href="/exercises/new" className={buttonVariants()}>
          + 新增自訂動作
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="text-muted-foreground">
          尚無動作，請執行 `npm run db:seed` 載入預設清單。
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名稱</TableHead>
              <TableHead>肌群</TableHead>
              <TableHead>器材</TableHead>
              <TableHead>來源</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell>
                  {MUSCLE_GROUP_LABEL[e.muscleGroup] ?? e.muscleGroup}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {e.equipment ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {e.isCustom ? "自訂" : e.wgerId ? "wger" : "內建"}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/exercises/${e.id}/edit`}
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

- [ ] **Step 4：新增頁**

`src/app/exercises/new/page.tsx`：

```tsx
"use server";

import { ExerciseForm } from "@/components/exercise-form";
import { createExercise } from "@/lib/actions/exercises";
import { redirect } from "next/navigation";
import type { ExerciseInput } from "@/lib/validators/exercise";

export default async function NewExercisePage() {
  async function handle(input: ExerciseInput) {
    "use server";
    await createExercise(input);
    redirect("/exercises");
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">新增自訂動作</h1>
      <ExerciseForm onSubmit={handle} submitLabel="新增" />
    </div>
  );
}
```

- [ ] **Step 5：編輯頁**

`src/app/exercises/[id]/edit/page.tsx`：

```tsx
import { notFound, redirect } from "next/navigation";
import { ExerciseForm } from "@/components/exercise-form";
import { getExercise, updateExercise } from "@/lib/actions/exercises";
import type { ExerciseInput } from "@/lib/validators/exercise";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const ex = await getExercise(id);
  if (!ex) notFound();

  async function handle(input: ExerciseInput) {
    "use server";
    await updateExercise(id, input);
    redirect("/exercises");
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">編輯動作 — {ex.name}</h1>
      <ExerciseForm
        defaultValues={{
          name: ex.name,
          nameEn: ex.nameEn ?? undefined,
          muscleGroup: ex.muscleGroup,
          equipment: ex.equipment ?? undefined,
          demoImageUrl: ex.demoImageUrl ?? undefined,
          description: ex.description ?? undefined,
        }}
        onSubmit={handle}
        submitLabel="儲存修改"
      />
    </div>
  );
}
```

- [ ] **Step 6：手動測試**

```bash
npm run dev
```

開 http://localhost:3000/exercises ，應該看到 seed 的動作清單。新增一個自訂動作測試。

- [ ] **Step 7：commit**

```bash
git add .
git commit -m "feat: exercise master pages (list, create, edit)"
```

---

## Task 5：學員子頁加上「訓練紀錄」分頁

**Files:**
- Modify: `src/app/students/[id]/layout.tsx`（加 nav 連結）
- Create: `src/app/students/[id]/sessions/page.tsx`

- [ ] **Step 1：在學員子 layout 加分頁連結**

修改 `src/app/students/[id]/layout.tsx`，在 nav 區的 Link 之間插入「訓練紀錄」：

```tsx
<nav className="flex gap-4 text-sm mb-4">
  <Link href={`/students/${id}`} className="hover:underline">
    總覽
  </Link>
  <Link href={`/students/${id}/inbody`} className="hover:underline">
    InBody
  </Link>
  <Link href={`/students/${id}/sessions`} className="hover:underline">
    訓練紀錄
  </Link>
</nav>
```

- [ ] **Step 2：寫 sessions 列表頁**

`src/app/students/[id]/sessions/page.tsx`：

```tsx
import Link from "next/link";
import { listSessionsForStudent, startSession } from "@/lib/actions/sessions";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MUSCLE_GROUP_LABEL } from "@/components/exercise-form";

export default async function SessionsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const studentId = Number(idStr);
  const sessions = await listSessionsForStudent(studentId);

  async function startNew() {
    "use server";
    await startSession({ studentId });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">訓練紀錄</h2>
        <form action={startNew}>
          <button type="submit" className={buttonVariants()}>
            + 開始新一堂課
          </button>
        </form>
      </div>

      {sessions.length === 0 ? (
        <p className="text-muted-foreground">尚無紀錄。</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>第幾堂</TableHead>
              <TableHead>開始時間</TableHead>
              <TableHead>目標肌群</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.id}>
                <TableCell>第 {s.sessionNumber} 堂</TableCell>
                <TableCell>{s.startedAt ?? s.scheduledAt ?? "—"}</TableCell>
                <TableCell>
                  {s.targetMuscleGroups
                    .map((m) => MUSCLE_GROUP_LABEL[m] ?? m)
                    .join("、")}
                </TableCell>
                <TableCell>
                  {s.status === "in_progress"
                    ? "進行中"
                    : s.status === "completed"
                    ? "已完成"
                    : "預定"}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/sessions/${s.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    {s.status === "completed" ? "查看" : "繼續"}
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

- [ ] **Step 3：手動測試**

到任何學員的「訓練紀錄」頁，按「+ 開始新一堂課」會建立 session 並跳到 `/sessions/[id]`（下一個 task 才會做這個頁面）。先確認 redirect 沒爆。

- [ ] **Step 4：commit**

```bash
git add .
git commit -m "feat: per-student sessions list with quick start button"
```

---

## Task 6：開始新 session 的中介頁（簡化版）

> **設計決策：** Slice 1 的 student layout 中，`+ 開始新一堂課` 按鈕直接呼叫 `startSession()` 並 redirect 到 `/sessions/[id]`，不需要中介選單頁。如果未來要做「先預約再開始」流程，再補一個 `/sessions/new` 頁。本 task 跳過。

**直接進到 Task 7。**

---

## Task 7（核心）：上課中即時紀錄頁

**Files:**
- Create: `src/app/sessions/[id]/page.tsx`
- Create: `src/components/session-recorder.tsx`
- Create: `src/components/exercise-picker.tsx`
- Create: `src/components/set-row.tsx`

這是這個 slice 最重要、最大的一塊。我會分成幾個小元件：

- `SessionRecorder`：頂層 client component，負責整個頁面狀態
- `ExercisePicker`：彈出式對話框，搜尋並挑選一個 exercise 加入課堂
- `SetRow`：單一組（set log）的 inline-edit row

- [ ] **Step 1：寫 ExercisePicker**

`src/components/exercise-picker.tsx`：

```tsx
"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MUSCLE_GROUP_LABEL } from "@/components/exercise-form";
import type { Exercise } from "@/lib/db/schema";

interface Props {
  exercises: Exercise[];
  onPick: (exerciseId: number) => Promise<void>;
}

export function ExercisePicker({ exercises, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild={false}>
        <Button variant="outline" onClick={() => setOpen(true)}>
          + 新增動作
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>選擇動作</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="搜尋動作名稱…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <div className="space-y-1 mt-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">沒有匹配結果</p>
          ) : (
            filtered.map((e) => (
              <button
                key={e.id}
                disabled={pending}
                className="w-full text-left p-3 rounded border hover:bg-accent flex justify-between items-center"
                onClick={() => {
                  startTransition(async () => {
                    await onPick(e.id);
                    setOpen(false);
                    setQ("");
                  });
                }}
              >
                <span>
                  <span className="font-medium">{e.name}</span>{" "}
                  <span className="text-xs text-muted-foreground ml-2">
                    {MUSCLE_GROUP_LABEL[e.muscleGroup]}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {e.equipment ?? ""}
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2：寫 SetRow**

`src/components/set-row.tsx`：

```tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateSetLog, deleteSetLog } from "@/lib/actions/set-logs";
import type { SetLog } from "@/lib/db/schema";

interface Props {
  set: SetLog;
}

export function SetRow({ set }: Props) {
  const [local, setLocal] = useState({
    weightKg: set.weightKg ?? "",
    reps: set.reps ?? "",
    rpe: set.rpe ?? "",
    toFailure: set.toFailure,
    heartRateBpm: set.heartRateBpm ?? "",
  });
  const [pending, startTransition] = useTransition();

  // 當 local 改變時 debounce 寫回 server
  useEffect(() => {
    const t = setTimeout(() => {
      startTransition(async () => {
        await updateSetLog(set.id, {
          weightKg: local.weightKg === "" ? null : Number(local.weightKg),
          reps: local.reps === "" ? null : Number(local.reps),
          rpe: local.rpe === "" ? null : Number(local.rpe),
          toFailure: local.toFailure,
          heartRateBpm:
            local.heartRateBpm === "" ? null : Number(local.heartRateBpm),
        });
      });
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <tr className="border-t">
      <td className="p-2 text-center text-sm font-medium">
        {set.setNumber}
      </td>
      <td className="p-1">
        <Input
          type="number"
          step="2.5"
          inputMode="decimal"
          value={local.weightKg}
          onChange={(e) =>
            setLocal((l) => ({ ...l, weightKg: e.target.value }))
          }
          placeholder="kg"
          className="w-24 text-center"
        />
      </td>
      <td className="p-1">
        <Input
          type="number"
          inputMode="numeric"
          value={local.reps}
          onChange={(e) => setLocal((l) => ({ ...l, reps: e.target.value }))}
          placeholder="次"
          className="w-20 text-center"
        />
      </td>
      <td className="p-1">
        <Input
          type="number"
          min="1"
          max="10"
          value={local.rpe}
          onChange={(e) => setLocal((l) => ({ ...l, rpe: e.target.value }))}
          placeholder="1-10"
          className="w-20 text-center"
        />
      </td>
      <td className="p-1 text-center">
        <input
          type="checkbox"
          checked={local.toFailure}
          onChange={(e) =>
            setLocal((l) => ({ ...l, toFailure: e.target.checked }))
          }
          className="size-5"
        />
      </td>
      <td className="p-1">
        <Input
          type="number"
          inputMode="numeric"
          value={local.heartRateBpm}
          onChange={(e) =>
            setLocal((l) => ({ ...l, heartRateBpm: e.target.value }))
          }
          placeholder="bpm"
          className="w-20 text-center"
        />
      </td>
      <td className="p-1 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            startTransition(() => deleteSetLog(set.id))
          }
          disabled={pending}
        >
          ✕
        </Button>
      </td>
    </tr>
  );
}
```

- [ ] **Step 3：寫 SessionRecorder（最大的元件）**

`src/components/session-recorder.tsx`：

```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExercisePicker } from "@/components/exercise-picker";
import { SetRow } from "@/components/set-row";
import { MUSCLE_GROUP_LABEL } from "@/components/exercise-form";
import {
  addExerciseToSession,
  removeExerciseFromSession,
  completeSession,
} from "@/lib/actions/sessions";
import { createSetLog } from "@/lib/actions/set-logs";
import type { Exercise, Session, SessionExercise, SetLog } from "@/lib/db/schema";

interface Props {
  session: Session;
  exercises: {
    sessionExercise: SessionExercise;
    exercise: Exercise;
    sets: SetLog[];
  }[];
  allExercises: Exercise[];
  studentName: string;
}

export function SessionRecorder({
  session,
  exercises,
  allExercises,
  studentName,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">
          {studentName} · 第 {session.sessionNumber} 堂課
        </h1>
        <p className="text-sm text-muted-foreground">
          目標：
          {session.targetMuscleGroups
            .map((m) => MUSCLE_GROUP_LABEL[m] ?? m)
            .join("、")}
          {session.startedAt && (
            <> · 開始 {session.startedAt.slice(11, 16)}</>
          )}
          {session.status === "completed" && <> · 已完成</>}
        </p>
      </header>

      <div className="space-y-6">
        {exercises.map(({ sessionExercise, exercise, sets }) => (
          <div key={sessionExercise.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{exercise.name}</h3>
              {session.status !== "completed" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    startTransition(() =>
                      removeExerciseFromSession(
                        sessionExercise.id,
                        session.id
                      )
                    )
                  }
                  disabled={pending}
                >
                  刪除動作
                </Button>
              )}
            </div>

            <table className="w-full">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="p-2">組</th>
                  <th className="p-2">重量</th>
                  <th className="p-2">次數</th>
                  <th className="p-2">RPE</th>
                  <th className="p-2">力竭</th>
                  <th className="p-2">心率</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {sets.map((s) => (
                  <SetRow key={s.id} set={s} />
                ))}
              </tbody>
            </table>

            {session.status !== "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  // 新組數預設繼承上一組
                  const last = sets[sets.length - 1];
                  startTransition(async () => {
                    await createSetLog({
                      sessionExerciseId: sessionExercise.id,
                      setNumber: sets.length + 1,
                      weightKg: last?.weightKg ?? null,
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

        {session.status !== "completed" && (
          <div className="flex gap-3">
            <ExercisePicker
              exercises={allExercises}
              onPick={async (exerciseId) => {
                await addExerciseToSession(session.id, exerciseId);
                router.refresh();
              }}
            />
          </div>
        )}
      </div>

      {session.status !== "completed" && (
        <div className="mt-8 pt-6 border-t">
          <Button
            size="lg"
            onClick={() =>
              startTransition(async () => {
                if (
                  !confirm(
                    "確定要結束這堂課嗎？結束後就不能再加 / 改紀錄。"
                  )
                )
                  return;
                await completeSession(session.id);
                router.refresh();
              })
            }
            disabled={pending}
          >
            完成課程
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4：寫 page.tsx**

`src/app/sessions/[id]/page.tsx`：

```tsx
import { notFound } from "next/navigation";
import { getSessionWithDetails } from "@/lib/actions/sessions";
import { listExercises } from "@/lib/actions/exercises";
import { getStudent } from "@/lib/actions/students";
import { SessionRecorder } from "@/components/session-recorder";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);

  const [details, allExercises] = await Promise.all([
    getSessionWithDetails(id),
    listExercises(),
  ]);
  if (!details) notFound();

  const student = await getStudent(details.session.studentId);
  if (!student) notFound();

  return (
    <SessionRecorder
      session={details.session}
      exercises={details.exercises}
      allExercises={allExercises}
      studentName={student.name}
    />
  );
}
```

- [ ] **Step 5：手動端對端測試**

```bash
npm run dev
```

完整流程：
1. 進到任一學員 → 訓練紀錄 → 開始新一堂課
2. 應該跳到 `/sessions/[id]`，看到「第 1 堂課 · 目標：胸、小肌群」
3. 點「+ 新增動作」→ 選「槓鈴臥推」→ 出現一個動作區塊
4. 點「+ 新增一組」→ 出現一行可填的 row
5. 填重量 60、次數 10、RPE 7 → 等 1 秒（自動存）→ 重新整理頁面，數值還在
6. 再加幾組
7. 點「完成課程」→ 確認 → 整個介面切到唯讀

- [ ] **Step 6：跑 type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 7：commit**

```bash
git add .
git commit -m "feat: live session recording page (core MVP UI)"
```

---

## Slice 2 驗收清單

- [ ] `npm test` 仍 19/19 綠（無新單元測試也可，至少不能退步）
- [ ] `npm run db:seed` 能載入動作清單
- [ ] `/exercises` 列表可看，「+ 新增自訂動作」可建
- [ ] 學員子頁的「訓練紀錄」分頁能列出歷次 session
- [ ] 「+ 開始新一堂課」會自動分配 session_number 與肌群（前 3 堂）
- [ ] `/sessions/[id]` 即時紀錄頁可：加動作、加組、編輯每組欄位（自動存）、刪組、刪動作、完成課程
- [ ] 完成後的 session 切到唯讀
- [ ] `npx tsc --noEmit` 無錯
- [ ] 整個 slice 至少 6 個 commits（schema、seed、actions、exercises pages、sessions list、session recorder）

---

## Out of Scope（slice 2 不做）

- 重量自動建議（取上次同動作最後一組）→ Slice 3
- 訓練菜單建議（第 4 堂以後）→ Slice 3
- WeeklyPlan 產生 → Slice 4
- AI 飲食建議 → Slice 4
- PDF → Slice 5
- 設定頁、備份頁 → Slice 6
- session 編輯：時間調整、補打 session_number、撤銷完成等 → Slice 6 視需求
