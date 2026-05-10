# Slice 6：設定頁 + Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** 完成 MVP 最後一塊，把使用者實際運用會卡住的小東西補齊：
1. 設定頁 `/settings`，讓教練自己改規則參數與 AI prompt 模板
2. 學員救援頁（軟刪除復原）
3. 自動每日備份 `gym.db` 快照（最近 30 天）
4. 首頁變成「今日課表 / 待辦」儀表板（簡化版）
5. 把規則引擎的硬編碼閾值改用 coach_settings 動態讀取（規則 R3、R4）

**Architecture:** 主要是新增 UI 與小幅重構。沒有新 schema。

**前置依賴：** Slice 5 完成（49 unit tests + 1 e2e + PDF 完整可用）

---

## Slice 6 共 5 個 Tasks

| # | Task | 重點 |
|---|------|------|
| 1 | 設定頁（規則參數 + AI prompt 編輯） | UI |
| 2 | 規則引擎讀取 coach_settings（不再用 hardcode） | 重構 |
| 3 | 學員軟刪除 + 救援頁 | UI |
| 4 | 自動每日備份 `gym.db` | 維運 |
| 5 | 首頁儀表板（今日課表 / 進行中課程 / 學員概況） | UI |

---

## Task 1：設定頁

**Files:**
- Create: `src/app/settings/page.tsx`
- Create: `src/components/settings-form.tsx`
- Create: `src/lib/actions/settings.ts`
- Create: `src/lib/validators/settings.ts`
- Modify: `src/components/nav.tsx`（加「設定」連結）

- [ ] **Step 1：寫 validator**

`src/lib/validators/settings.ts`：

```ts
import { z } from "zod";

export const settingsInputSchema = z.object({
  muscleGainStepsMin: z.number().int().min(0).max(50000),
  muscleGainStepsMax: z.number().int().min(0).max(50000),
  fatLossStepsMin: z.number().int().min(0).max(50000),
  fatLossStepsMax: z.number().int().min(0).max(50000),
  fitnessStepsMin: z.number().int().min(0).max(50000),
  fitnessStepsMax: z.number().int().min(0).max(50000),
  weightAdjustPct: z.number().min(0).max(50),
  bodyFatWarnMale: z.number().min(0).max(100),
  bodyFatWarnFemale: z.number().min(0).max(100),
  aiDietPromptTemplate: z.string().min(0),
  aiMessagePromptTemplate: z.string().min(0),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
```

- [ ] **Step 2：寫 server actions**

`src/lib/actions/settings.ts`：

```ts
"use server";

import { db } from "@/lib/db/client";
import { coachSettings } from "@/lib/db/schema";
import {
  settingsInputSchema,
  type SettingsInput,
} from "@/lib/validators/settings";
import { revalidatePath } from "next/cache";
import { clearCoachSettingsCache } from "@/lib/coach-settings";

export async function updateSettings(input: SettingsInput) {
  const parsed = settingsInputSchema.parse(input);
  const existing = db.select().from(coachSettings).limit(1).get();
  if (existing) {
    db.update(coachSettings)
      .set({
        ...parsed,
        updatedAt: new Date().toISOString(),
      })
      .run();
  } else {
    db.insert(coachSettings).values(parsed).run();
  }
  clearCoachSettingsCache();
  revalidatePath("/settings");
}
```

- [ ] **Step 3：寫表單元件**

`src/components/settings-form.tsx`：

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import {
  settingsInputSchema,
  type SettingsInput,
} from "@/lib/validators/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type { CoachSettings } from "@/lib/db/schema";

interface Props {
  defaults: CoachSettings;
  onSubmit: (input: SettingsInput) => Promise<void>;
}

export function SettingsForm({ defaults, onSubmit }: Props) {
  const [pending, startTransition] = useTransition();
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsInputSchema),
    defaultValues: {
      muscleGainStepsMin: defaults.muscleGainStepsMin,
      muscleGainStepsMax: defaults.muscleGainStepsMax,
      fatLossStepsMin: defaults.fatLossStepsMin,
      fatLossStepsMax: defaults.fatLossStepsMax,
      fitnessStepsMin: defaults.fitnessStepsMin,
      fitnessStepsMax: defaults.fitnessStepsMax,
      weightAdjustPct: defaults.weightAdjustPct,
      bodyFatWarnMale: defaults.bodyFatWarnMale,
      bodyFatWarnFemale: defaults.bodyFatWarnFemale,
      aiDietPromptTemplate: defaults.aiDietPromptTemplate ?? "",
      aiMessagePromptTemplate: defaults.aiMessagePromptTemplate ?? "",
    },
  });

  const numReg = (name: keyof SettingsInput) =>
    form.register(name, { valueAsNumber: true });

  return (
    <form
      onSubmit={form.handleSubmit((data) =>
        startTransition(() => onSubmit(data))
      )}
      className="space-y-8 max-w-3xl"
    >
      <section>
        <h3 className="font-semibold mb-3">每日步數規則</h3>
        <div className="grid grid-cols-2 gap-4">
          <NumField
            label="增肌・最低"
            id="mgMin"
            register={numReg("muscleGainStepsMin")}
          />
          <NumField
            label="增肌・最高"
            id="mgMax"
            register={numReg("muscleGainStepsMax")}
          />
          <NumField
            label="減脂・最低"
            id="flMin"
            register={numReg("fatLossStepsMin")}
          />
          <NumField
            label="減脂・最高"
            id="flMax"
            register={numReg("fatLossStepsMax")}
          />
          <NumField
            label="體能・最低"
            id="ftMin"
            register={numReg("fitnessStepsMin")}
          />
          <NumField
            label="體能・最高"
            id="ftMax"
            register={numReg("fitnessStepsMax")}
          />
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="font-semibold mb-3">重量建議</h3>
        <NumField
          label="重量微調百分比 (%)"
          id="wapct"
          register={numReg("weightAdjustPct")}
          step="0.5"
        />
        <p className="text-xs text-muted-foreground mt-1">
          RPE ≤ 7 加重、≥ 10 減重的調整幅度。預設 5%。
        </p>
      </section>

      <Separator />

      <section>
        <h3 className="font-semibold mb-3">體脂警示閾值</h3>
        <div className="grid grid-cols-2 gap-4">
          <NumField
            label="男性體脂率上限 (%)"
            id="bfm"
            register={numReg("bodyFatWarnMale")}
            step="0.5"
          />
          <NumField
            label="女性體脂率上限 (%)"
            id="bff"
            register={numReg("bodyFatWarnFemale")}
            step="0.5"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          超過閾值且目標為增肌時，系統會建議「先減脂」。
        </p>
      </section>

      <Separator />

      <section>
        <h3 className="font-semibold mb-3">AI 飲食 Prompt 模板</h3>
        <Textarea
          rows={10}
          {...form.register("aiDietPromptTemplate")}
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground mt-1">
          可用變數：{"{{gender}}"}、{"{{age}}"}、{"{{goal}}"}、{"{{weight}}"}、
          {"{{bodyFatPct}}"}、{"{{bmr}}"}、{"{{classDays}}"}、{"{{gymDays}}"}
        </p>
      </section>

      <section>
        <h3 className="font-semibold mb-3">AI 教練建議文 Prompt 模板</h3>
        <Textarea
          rows={8}
          {...form.register("aiMessagePromptTemplate")}
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground mt-1">
          可用變數：{"{{sessionSummary}}"}、{"{{inbodyDelta}}"}、{"{{goal}}"}
        </p>
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? "儲存中…" : "儲存設定"}
      </Button>
    </form>
  );
}

function NumField({
  label,
  id,
  register,
  step = "1",
}: {
  label: string;
  id: string;
  register: ReturnType<ReturnType<typeof useForm>["register"]>;
  step?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" step={step} {...register} />
    </div>
  );
}
```

- [ ] **Step 4：寫頁面**

`src/app/settings/page.tsx`：

```tsx
import { db } from "@/lib/db/client";
import { coachSettings } from "@/lib/db/schema";
import { SettingsForm } from "@/components/settings-form";
import { updateSettings } from "@/lib/actions/settings";
import type { SettingsInput } from "@/lib/validators/settings";

export default async function SettingsPage() {
  const settings = db.select().from(coachSettings).limit(1).get();
  if (!settings) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-destructive">
          coach_settings 尚未初始化，請執行 `npm run db:seed`
        </p>
      </div>
    );
  }

  async function handle(input: SettingsInput) {
    "use server";
    await updateSettings(input);
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">設定</h1>
      <SettingsForm defaults={settings} onSubmit={handle} />
    </div>
  );
}
```

- [ ] **Step 5：在 Nav 加連結**

`src/components/nav.tsx`：

加 `<Link href="/settings">設定</Link>`。

- [ ] **Step 6：跑 type check + 手動測試**

```bash
npx tsc --noEmit
npm run dev
```

到 `/settings`，改一個步數值，儲存。驗證 DB 內容變了：
```bash
sqlite3 data/gym.db "SELECT muscle_gain_steps_min FROM coach_settings;"
```

- [ ] **Step 7：commit**

```bash
git add .
git commit -m "feat: settings page for rule params and AI prompts"
```

---

## Task 2：規則引擎讀取 coach_settings

把 R3 與 R4 的硬編碼 thresholds 改成讀 coach_settings。

**Files:**
- Modify: `src/lib/recommendations/daily-activity.ts`
- Modify: `src/lib/recommendations/basic-inbody.ts`
- Modify: 該函式被呼叫的地方（`weekly-plans.ts`, `inbody/[recordId]/page.tsx`）

> **設計決策：** 規則函式仍然是純函式，但接收的 input 物件擴充以支援 coach_settings 的 override。Caller 負責從 coach_settings 抓值傳入。

- [ ] **Step 1：擴充 daily-activity 的 input 介面**

修改 `src/lib/recommendations/daily-activity.ts`：

```ts
export interface DailyActivityInput {
  goal: Goal;
  isClassDay: boolean;
  bmi?: number | null;
  // 自訂閾值（不傳則用預設）
  muscleGainSteps?: [number, number];
  fatLossSteps?: [number, number];
  fitnessSteps?: [number, number];
}
```

修改 `recommendDailyActivity` 用 input 中的 override（不傳則 fallback 到預設常數）：

```ts
export function recommendDailyActivity(
  input: DailyActivityInput
): DailyActivityOutput {
  const goalKey = input.goal === "custom" ? "fitness" : input.goal;
  const ranges: Record<
    "muscle_gain" | "fat_loss" | "fitness",
    { steps: [number, number]; cardio: [number, number] }
  > = {
    muscle_gain: {
      steps: input.muscleGainSteps ?? RANGES.muscle_gain.steps,
      cardio: RANGES.muscle_gain.cardio,
    },
    fat_loss: {
      steps: input.fatLossSteps ?? RANGES.fat_loss.steps,
      cardio: RANGES.fat_loss.cardio,
    },
    fitness: {
      steps: input.fitnessSteps ?? RANGES.fitness.steps,
      cardio: RANGES.fitness.cardio,
    },
  };
  const r = ranges[goalKey];
  // …其餘邏輯不變…
}
```

> **註：** 既有 unit tests 不傳 override，所以仍會用預設值，不會壞。

- [ ] **Step 2：在 weekly-plans.ts 抓 settings 傳入**

修改 `src/lib/actions/weekly-plans.ts` 中 `generateWeeklyPlan` 內呼叫 `recommendDailyActivity` 的地方，傳入：

```ts
const activity = recommendDailyActivity({
  goal: student.goal,
  isClassDay,
  bmi: latestInbody?.bmi ?? null,
  muscleGainSteps: [
    settings.muscleGainStepsMin,
    settings.muscleGainStepsMax,
  ],
  fatLossSteps: [settings.fatLossStepsMin, settings.fatLossStepsMax],
  fitnessSteps: [settings.fitnessStepsMin, settings.fitnessStepsMax],
});
```

- [ ] **Step 3：擴充 basic-inbody 的 input**

修改 `src/lib/recommendations/basic-inbody.ts`：原本 `RecommendationContext` 已有 `bodyFatWarnMale?` 和 `bodyFatWarnFemale?`。確保 caller 傳入。

修改 `src/app/students/[id]/inbody/[recordId]/page.tsx`，把 coach_settings 抓進來：

```tsx
import { getCoachSettings } from "@/lib/coach-settings";

// 在 InBodyDetailPage 內：
const settings = getCoachSettings();
const recs = generateBasicRecommendations({
  gender: student.gender,
  goal: student.goal,
  inbody: {
    weightKg: record.weightKg,
    bodyFatPct: record.bodyFatPct,
    bmrKcal: record.bmrKcal,
    visceralFatLevel: record.visceralFatLevel,
  },
  bodyFatWarnMale: settings.bodyFatWarnMale,
  bodyFatWarnFemale: settings.bodyFatWarnFemale,
});
```

- [ ] **Step 4：跑全部測試**

```bash
npm test
npx tsc --noEmit
```

Expected: 49 passed（規則 unit test 不變因為 override 是 optional，預設值仍維持）。

- [ ] **Step 5：commit**

```bash
git add .
git commit -m "refactor: rules R3 and R4 read from coach_settings dynamically"
```

---

## Task 3：學員軟刪除 + 救援頁

**Files:**
- Modify: `src/app/students/[id]/edit/page.tsx`（加「刪除學員」按鈕）
- Create: `src/app/students/deleted/page.tsx`
- Modify: `src/lib/actions/students.ts`（加 `restoreStudent` 與 `listDeletedStudents`）
- Modify: `src/components/student-form.tsx`（不動，刪除按鈕在編輯頁外面）

- [ ] **Step 1：加 actions**

修改 `src/lib/actions/students.ts`：

```ts
import { isNotNull, asc } from "drizzle-orm";

export async function listDeletedStudents() {
  return db
    .select()
    .from(students)
    .where(isNotNull(students.deletedAt))
    .orderBy(asc(students.deletedAt))
    .all();
}

export async function restoreStudent(id: number) {
  db.update(students)
    .set({
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(students.id, id))
    .run();

  revalidatePath("/students");
  revalidatePath("/students/deleted");
}
```

- [ ] **Step 2：在編輯頁加「刪除」按鈕**

修改 `src/app/students/[id]/edit/page.tsx`，在 form 後面加：

```tsx
import { softDeleteStudent } from "@/lib/actions/students";

// 在 page 元件內、form 下方加：
const deleteAction = async () => {
  "use server";
  await softDeleteStudent(id);
};

// JSX 中：
<form action={deleteAction} className="mt-12 pt-6 border-t">
  <button
    type="submit"
    className="text-sm text-destructive hover:underline"
  >
    刪除這位學員（30 天內可救回）
  </button>
</form>
```

> **註：** `softDeleteStudent` 已經在 slice 1 寫好，會 redirect 回 `/students`。

- [ ] **Step 3：寫已刪除學員頁**

`src/app/students/deleted/page.tsx`：

```tsx
import { listDeletedStudents, restoreStudent } from "@/lib/actions/students";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DeletedStudentsPage() {
  const list = await listDeletedStudents();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">已刪除的學員</h1>
      <p className="text-sm text-muted-foreground mb-4">
        刪除超過 30 天的學員會在下次系統清理時永久移除（目前尚未實作自動清理）。
      </p>

      {list.length === 0 ? (
        <p className="text-muted-foreground">沒有已刪除的學員。</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>刪除時間</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((s) => {
              const restoreAction = async () => {
                "use server";
                await restoreStudent(s.id);
              };
              return (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.deletedAt}</TableCell>
                  <TableCell>
                    <form action={restoreAction}>
                      <button
                        type="submit"
                        className="text-sm text-primary hover:underline"
                      >
                        救回
                      </button>
                    </form>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

- [ ] **Step 4：在學員列表頁加「已刪除」連結**

修改 `src/app/students/page.tsx`，在 header 加：

```tsx
<div className="flex gap-2 items-center">
  <Link
    href="/students/deleted"
    className="text-xs text-muted-foreground hover:underline"
  >
    已刪除
  </Link>
  <Link href="/students/new" className={buttonVariants()}>
    + 新增學員
  </Link>
</div>
```

- [ ] **Step 5：手動測試**

到一個學員的編輯頁，按底部「刪除這位學員」 → 應該跳回 `/students`，列表不再有他。  
到 `/students/deleted` 應該看到他。按「救回」 → 回到正常列表。

- [ ] **Step 6：commit**

```bash
git add .
git commit -m "feat: student soft-delete with recovery page"
```

---

## Task 4：自動每日備份

**Files:**
- Create: `src/lib/db/auto-backup.ts`
- Modify: `src/lib/db/client.ts`（在初始化時觸發備份檢查）

- [ ] **Step 1：寫備份函式**

`src/lib/db/auto-backup.ts`：

```ts
import "server-only";
import { copyFile, mkdir, readdir, stat, unlink } from "fs/promises";
import path from "path";

const DB_FILE = path.join(process.cwd(), "data", "gym.db");
const BACKUP_DIR = path.join(process.cwd(), "data", "backups");
const RETAIN_DAYS = 30;

export async function ensureDailyBackup() {
  try {
    await mkdir(BACKUP_DIR, { recursive: true });
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const dest = path.join(BACKUP_DIR, `gym-${today}.db`);

    // 今日已備份就跳過
    try {
      await stat(dest);
      return;
    } catch {
      // 還沒備份
    }

    // 確認來源檔存在
    try {
      await stat(DB_FILE);
    } catch {
      return; // 還沒有 gym.db（首次啟動）
    }

    await copyFile(DB_FILE, dest);
    console.log(`[backup] 自動備份建立: ${dest}`);
    await pruneOldBackups();
  } catch (err) {
    console.error("[backup] 自動備份失敗:", err);
  }
}

async function pruneOldBackups() {
  try {
    const files = await readdir(BACKUP_DIR);
    const cutoff = Date.now() - RETAIN_DAYS * 24 * 60 * 60 * 1000;
    for (const f of files) {
      if (!f.startsWith("gym-") || !f.endsWith(".db")) continue;
      const fp = path.join(BACKUP_DIR, f);
      const s = await stat(fp);
      if (s.mtimeMs < cutoff) {
        await unlink(fp);
        console.log(`[backup] 移除過期備份: ${f}`);
      }
    }
  } catch (err) {
    console.warn("[backup] 清理過期備份失敗:", err);
  }
}
```

- [ ] **Step 2：在 db client 啟動時呼叫**

修改 `src/lib/db/client.ts`：

```ts
import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { ensureDailyBackup } from "./auto-backup";

const sqlite = new Database("./data/gym.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// 啟動時 fire-and-forget 自動備份
void ensureDailyBackup();
```

- [ ] **Step 3：測試**

```bash
npm run dev
```

啟動後檢查：
```bash
ls data/backups/
```

應該有 `gym-YYYY-MM-DD.db` 一個檔案。

- [ ] **Step 4：commit**

```bash
git add .
git commit -m "feat: auto daily backup with 30-day retention"
```

---

## Task 5：首頁儀表板

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1：寫儀表板**

`src/app/page.tsx`：

```tsx
import Link from "next/link";
import { db } from "@/lib/db/client";
import { sessions, students, weeklyPlans } from "@/lib/db/schema";
import { eq, isNull, desc, count } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const goalLabel: Record<string, string> = {
  muscle_gain: "增肌",
  fat_loss: "減脂",
  fitness: "體能",
  custom: "其他",
};

export default async function HomePage() {
  // 進行中課程
  const inProgress = db
    .select({
      sessionId: sessions.id,
      studentId: sessions.studentId,
      sessionNumber: sessions.sessionNumber,
      startedAt: sessions.startedAt,
      studentName: students.name,
    })
    .from(sessions)
    .innerJoin(students, eq(sessions.studentId, students.id))
    .where(eq(sessions.status, "in_progress"))
    .orderBy(desc(sessions.startedAt))
    .all();

  // 學員概況
  const studentCount = db
    .select({ c: count() })
    .from(students)
    .where(isNull(students.deletedAt))
    .get();

  const recentPlans = db
    .select({
      id: weeklyPlans.id,
      studentId: weeklyPlans.studentId,
      studentName: students.name,
      startDate: weeklyPlans.startDate,
      endDate: weeklyPlans.endDate,
    })
    .from(weeklyPlans)
    .innerJoin(students, eq(weeklyPlans.studentId, students.id))
    .orderBy(desc(weeklyPlans.generatedAt))
    .limit(5)
    .all();

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">今日課表</h1>

      {/* 進行中課程 */}
      <Card>
        <CardHeader>
          <CardTitle>進行中課程</CardTitle>
        </CardHeader>
        <CardContent>
          {inProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground">沒有進行中課程</p>
          ) : (
            <ul className="space-y-2">
              {inProgress.map((s) => (
                <li key={s.sessionId} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <span className="font-medium">{s.studentName}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      第 {s.sessionNumber} 堂 · 開始 {s.startedAt?.slice(11, 16) ?? "?"}
                    </span>
                  </div>
                  <Link
                    href={`/sessions/${s.sessionId}`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    繼續紀錄
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 概況 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>學員總數</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{studentCount?.c ?? 0}</p>
            <Link
              href="/students"
              className="text-xs text-primary hover:underline mt-2 inline-block"
            >
              查看所有學員 →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>本週產出</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{recentPlans.length}</p>
            <p className="text-xs text-muted-foreground mt-1">最近 5 份週計劃</p>
          </CardContent>
        </Card>
      </div>

      {/* 最近週計劃 */}
      <Card>
        <CardHeader>
          <CardTitle>最近的週計劃</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無紀錄</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {recentPlans.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between border-b pb-1 last:border-0"
                >
                  <span>
                    <span className="font-medium">{p.studentName}</span>
                    <span className="ml-2 text-muted-foreground">
                      {p.startDate} → {p.endDate}
                    </span>
                  </span>
                  <Link
                    href={`/weekly-plans/${p.id}`}
                    className="text-primary hover:underline"
                  >
                    查看 →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2：跑 type check + 手動測試**

```bash
npx tsc --noEmit
npm run dev
```

到 `/`，應該看到三個 card：進行中課程、學員概況、最近週計劃。

- [ ] **Step 3：commit**

```bash
git add .
git commit -m "feat: home page dashboard with in-progress sessions and recent plans"
```

---

## Slice 6 驗收清單

- [ ] `npm test` 49/49（無新測試也行）
- [ ] `npx tsc --noEmit` 無錯
- [ ] `/settings` 可改規則參數與 prompt 模板，存檔後重新整理仍維持
- [ ] 規則 R3 與 R4 從 coach_settings 動態讀（改了步數值，新產生的 weekly plan 會用新值）
- [ ] 學員可從編輯頁刪除，到 `/students/deleted` 救回
- [ ] `data/backups/` 有今日備份檔
- [ ] 重複啟動 dev server 不會產生第二份當日備份
- [ ] 首頁顯示進行中課程、學員數、最近週計劃
- [ ] 5 個 commits

---

## Out of Scope（slice 6 不做）

- InBody 折線圖（可用 recharts，但需要更多設計）
- 動作示範圖上傳 / 顯示
- WeeklyPlan 「approved」狀態工作流
- 自動清理超過 30 天的軟刪除學員
- session 編輯 / 撤銷完成
