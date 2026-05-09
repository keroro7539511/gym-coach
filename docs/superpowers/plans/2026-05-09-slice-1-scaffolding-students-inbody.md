# Slice 1：專案打底 + 學員 CRUD + InBody 紀錄 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Next.js + SQLite + Drizzle + shadcn/ui 專案打底完成，並交付可用的學員 CRUD + InBody 紀錄功能（含基本建議）。完成後，使用者可以在 localhost 新增學員、量 InBody、看到歷史紀錄與基本建議。

**Architecture:** Next.js（App Router）一體式應用。前端 Server Components + Client Components 並用，後端 API 走 Server Actions（簡化 fetch 樣板）。資料用 Drizzle ORM 操作 SQLite 檔案 `gym.db`。建議引擎為純 TypeScript 模組，可獨立單元測試。

**Tech Stack:**
- Next.js 14+（App Router）+ TypeScript
- Tailwind CSS + shadcn/ui
- Drizzle ORM + better-sqlite3
- Zod（form 驗證）
- Vitest（單元測試）
- Playwright（端對端測試）

**Spec reference:** `docs/superpowers/specs/2026-05-09-gym-coach-app-design.md`

---

## File Structure（這個 slice 會碰到的檔案）

```
gym/
├── package.json                       新增
├── tsconfig.json                      新增
├── next.config.mjs                    新增
├── tailwind.config.ts                 新增
├── postcss.config.js                  新增
├── components.json                    新增（shadcn/ui 設定）
├── drizzle.config.ts                  新增
├── vitest.config.ts                   新增
├── playwright.config.ts               新增
├── .env.example                       新增
├── .gitignore                         新增
├── README.md                          新增
├── 啟動健身管理.command                  新增
├── 備份資料.command                     新增
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                 新增（全站 layout + 導覽）
│   │   ├── page.tsx                   新增（首頁，slice 1 是 placeholder）
│   │   ├── globals.css                新增
│   │   ├── students/
│   │   │   ├── page.tsx               新增（學員列表）
│   │   │   ├── new/page.tsx           新增（新增學員表單）
│   │   │   └── [id]/
│   │   │       ├── layout.tsx         新增（學員詳細頁子 layout，含 tab nav）
│   │   │       ├── page.tsx           新增（總覽）
│   │   │       ├── edit/page.tsx      新增（編輯學員）
│   │   │       └── inbody/
│   │   │           ├── page.tsx       新增（InBody 歷史）
│   │   │           ├── new/page.tsx   新增（新增 InBody 紀錄）
│   │   │           └── [recordId]/
│   │   │               └── page.tsx   新增（單筆 InBody 詳細，含基本建議）
│   │   └── api/                        （slice 1 暫不需要，用 Server Actions）
│   │
│   ├── components/
│   │   ├── ui/                        新增（shadcn/ui 元件 — 透過 CLI 加）
│   │   ├── nav.tsx                    新增（頂部導覽）
│   │   ├── student-form.tsx           新增（新增 / 編輯共用）
│   │   ├── inbody-form.tsx            新增（InBody 表單，含分組摺疊）
│   │   └── recommendation-card.tsx    新增（顯示基本建議）
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── client.ts              新增（Drizzle 連線 + better-sqlite3）
│   │   │   ├── schema.ts              新增（students + inbody_records 表定義）
│   │   │   └── migrations/            新增（drizzle-kit 自動生成）
│   │   │
│   │   ├── actions/
│   │   │   ├── students.ts            新增（學員 CRUD server actions）
│   │   │   └── inbody.ts              新增（InBody server actions）
│   │   │
│   │   ├── validators/
│   │   │   ├── student.ts             新增（Zod schema）
│   │   │   └── inbody.ts              新增（Zod schema，含合理範圍）
│   │   │
│   │   ├── recommendations/
│   │   │   ├── basic-inbody.ts        新增（規則 R4）
│   │   │   └── basic-inbody.test.ts   新增（單元測試）
│   │   │
│   │   └── utils/
│   │       └── derive-bmi.ts          新增（從體重 / 身高算 BMI）
│   │
├── tests/
│   └── e2e/
│       └── student-flow.spec.ts       新增（Playwright：新增學員 → 量 InBody → 看建議）
│
└── data/                              新增（runtime 產生）
    ├── gym.db                         （SQLite 檔，git 忽略）
    └── backups/                       （自動備份目錄，git 忽略）
```

---

## Task 0：初始化 Git 與資料夾結構

**Files:**
- Create: `gym/.gitignore`
- Create: `gym/README.md`

- [ ] **Step 1：在 `gym/` 目錄初始化 git**

```bash
cd /Users/elliott/Desktop/tools/gym
git init
git config user.name "Elliott"
git config user.email "yilun851226@gmail.com"
```

Expected: `Initialized empty Git repository in /Users/elliott/Desktop/tools/gym/.git/`

- [ ] **Step 2：寫 `.gitignore`**

```
node_modules/
.next/
dist/
build/
.env
.env.local
data/gym.db
data/gym.db-journal
data/backups/
data/pdfs/
.DS_Store
*.log
playwright-report/
test-results/
coverage/
```

- [ ] **Step 3：寫一個極簡 README**

```markdown
# 健身教練管理 App

個人健身教練的學員管理 + 訓練紀錄 + 個人化計劃工具。

## 開發

\`\`\`bash
npm install
npm run dev
\`\`\`

打開 http://localhost:3000

詳細文件：`docs/superpowers/specs/2026-05-09-gym-coach-app-design.md`
```

- [ ] **Step 4：第一次 commit**

```bash
git add .gitignore README.md docs/
git commit -m "chore: init repo with spec and plan"
```

Expected: 一筆 commit 含 spec、plan、.gitignore、README

---

## Task 1：建立 Next.js 專案骨架

**Files:**
- Create: 所有 Next.js 樣板（透過 create-next-app 自動產生）

- [ ] **Step 1：跑 create-next-app**

```bash
cd /Users/elliott/Desktop/tools/gym
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-npm
```

當它問「Continue in non-empty directory?」選 yes（會保留 `docs/` 與 `.gitignore`）。

Expected: 安裝完成，產生 `package.json`、`tsconfig.json`、`next.config.mjs`、`tailwind.config.ts`、`src/app/`。

- [ ] **Step 2：跑一次確認可開機**

```bash
npm run dev
```

打開 http://localhost:3000，應該看到 Next.js 預設首頁。`Ctrl+C` 結束。

- [ ] **Step 3：清掉預設首頁內容**

`src/app/page.tsx` 改成：

```tsx
export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">健身教練管理</h1>
      <p className="text-muted-foreground">Slice 1 開發中…</p>
    </div>
  );
}
```

- [ ] **Step 4：commit**

```bash
git add .
git commit -m "feat: scaffold next.js project"
```

---

## Task 2：安裝 shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`（cn helper）
- Create: `src/components/ui/`（shadcn 元件目錄）

- [ ] **Step 1：跑 shadcn CLI 初始化**

```bash
npx shadcn@latest init -d
```

接受所有預設值（New York style、Slate 色系、CSS variables）。

Expected: 產生 `components.json`、`src/lib/utils.ts`、修改 `globals.css`。

- [ ] **Step 2：加幾個會用到的元件**

```bash
npx shadcn@latest add button input label textarea select card form table tabs dialog toast separator
```

Expected: `src/components/ui/` 目錄下出現對應檔案。

- [ ] **Step 3：在 `src/app/page.tsx` 放一顆按鈕驗證樣式有效**

```tsx
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">健身教練管理</h1>
      <p className="text-muted-foreground mb-4">Slice 1 開發中…</p>
      <Button>測試按鈕</Button>
    </div>
  );
}
```

跑 `npm run dev`，確認按鈕有 shadcn 的樣式。

- [ ] **Step 4：commit**

```bash
git add .
git commit -m "feat: install shadcn/ui with base components"
```

---

## Task 3：安裝 Drizzle ORM + better-sqlite3

**Files:**
- Modify: `package.json`
- Create: `drizzle.config.ts`
- Create: `src/lib/db/client.ts`
- Create: `src/lib/db/schema.ts`
- Create: `data/.gitkeep`

- [ ] **Step 1：安裝套件**

```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

- [ ] **Step 2：建 `data/` 目錄**

```bash
mkdir -p data/backups
touch data/.gitkeep
```

`.gitkeep` 確保 git 會建立空目錄（雖然 `data/gym.db` 在 `.gitignore` 裡）。

- [ ] **Step 3：寫 `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/gym.db",
  },
});
```

- [ ] **Step 4：寫 `src/lib/db/schema.ts`（先只放 students 與 inbody_records）**

```ts
import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  coachId: integer("coach_id").notNull().default(1),
  name: text("name").notNull(),
  gender: text("gender", { enum: ["M", "F"] }).notNull(),
  birthday: text("birthday"), // ISO date string
  phone: text("phone"),
  email: text("email"),
  goal: text("goal", {
    enum: ["muscle_gain", "fat_loss", "fitness", "custom"],
  }).notNull(),
  customGoal: text("custom_goal"),
  weeklyClassCount: integer("weekly_class_count").notNull(),
  weeklyGymCount: integer("weekly_gym_count").notNull(),
  notes: text("notes"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const inbodyRecords = sqliteTable("inbody_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  measuredAt: text("measured_at").notNull(),

  // 身體基本
  weightKg: real("weight_kg"),
  bodyFatPct: real("body_fat_pct"),
  skeletalMuscleKg: real("skeletal_muscle_kg"),
  bodyFatKg: real("body_fat_kg"),
  visceralFatLevel: real("visceral_fat_level"),
  bodyAge: real("body_age"),
  bmi: real("bmi"),

  // 代謝
  bmrKcal: real("bmr_kcal"),
  totalWaterL: real("total_water_l"),
  proteinKg: real("protein_kg"),

  // 部位肌肉
  muscleLeftArm: real("muscle_left_arm"),
  muscleRightArm: real("muscle_right_arm"),
  muscleTrunk: real("muscle_trunk"),
  muscleLeftLeg: real("muscle_left_leg"),
  muscleRightLeg: real("muscle_right_leg"),

  // 部位體脂
  fatLeftArm: real("fat_left_arm"),
  fatRightArm: real("fat_right_arm"),
  fatTrunk: real("fat_trunk"),
  fatLeftLeg: real("fat_left_leg"),
  fatRightLeg: real("fat_right_leg"),

  coachNotes: text("coach_notes"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type InBodyRecord = typeof inbodyRecords.$inferSelect;
export type NewInBodyRecord = typeof inbodyRecords.$inferInsert;
```

- [ ] **Step 5：寫 `src/lib/db/client.ts`**

```ts
import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("./data/gym.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
```

- [ ] **Step 6：產生並執行 migration**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Expected: `src/lib/db/migrations/` 目錄下有 SQL 檔，`data/gym.db` 被建立。

- [ ] **Step 7：在 `package.json` scripts 加上 db 指令**

修改 `package.json` 的 `"scripts"`，加入：

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

- [ ] **Step 8：commit**

```bash
git add .
git commit -m "feat: set up drizzle + sqlite with students and inbody schema"
```

---

## Task 4：安裝 Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/utils/derive-bmi.ts`
- Create: `src/lib/utils/derive-bmi.test.ts`

- [ ] **Step 1：安裝套件**

```bash
npm install -D vitest @vitest/ui
```

- [ ] **Step 2：寫 `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3：在 `package.json` scripts 加 test 指令**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4：寫 BMI 計算的「失敗測試」**

`src/lib/utils/derive-bmi.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { deriveBmi } from "./derive-bmi";

describe("deriveBmi", () => {
  it("計算標準體型 BMI", () => {
    // 70kg, 175cm → 22.86
    expect(deriveBmi(70, 175)).toBeCloseTo(22.86, 2);
  });

  it("身高為 0 時回傳 null", () => {
    expect(deriveBmi(70, 0)).toBeNull();
  });

  it("體重為 0 時回傳 null", () => {
    expect(deriveBmi(0, 175)).toBeNull();
  });

  it("身高或體重為負數時回傳 null", () => {
    expect(deriveBmi(-1, 175)).toBeNull();
    expect(deriveBmi(70, -1)).toBeNull();
  });
});
```

- [ ] **Step 5：跑測試確認失敗**

```bash
npm test
```

Expected: FAIL（`deriveBmi is not a function` 或檔案不存在）

- [ ] **Step 6：實作 `derive-bmi.ts`**

```ts
export function deriveBmi(weightKg: number, heightCm: number): number | null {
  if (weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}
```

- [ ] **Step 7：跑測試確認通過**

```bash
npm test
```

Expected: PASS（4 tests passed）

- [ ] **Step 8：commit**

```bash
git add .
git commit -m "feat: add vitest and bmi derivation utility"
```

> **註：** spec 沒有要求 InBody 表單收集身高欄位（InBody 機器直接給 BMI）。`deriveBmi` 留作「使用者只給體重與身高時」的 fallback。實作 InBody 表單時，BMI 直接收 InBody 機器的數值就好。

---

## Task 5：寫 Student 的 Zod validator + Server Action（建立）

**Files:**
- Create: `src/lib/validators/student.ts`
- Create: `src/lib/validators/student.test.ts`
- Create: `src/lib/actions/students.ts`

- [ ] **Step 1：安裝 zod**

```bash
npm install zod
```

- [ ] **Step 2：寫 student validator 的失敗測試**

`src/lib/validators/student.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { studentInputSchema } from "./student";

describe("studentInputSchema", () => {
  const valid = {
    name: "王小明",
    gender: "M" as const,
    goal: "muscle_gain" as const,
    weeklyClassCount: 2,
    weeklyGymCount: 4,
  };

  it("接受有效輸入", () => {
    expect(() => studentInputSchema.parse(valid)).not.toThrow();
  });

  it("拒絕空姓名", () => {
    expect(() => studentInputSchema.parse({ ...valid, name: "" })).toThrow();
  });

  it("拒絕非法 goal", () => {
    expect(() =>
      studentInputSchema.parse({ ...valid, goal: "lazy" as never })
    ).toThrow();
  });

  it("goal=custom 時必須有 customGoal", () => {
    expect(() =>
      studentInputSchema.parse({ ...valid, goal: "custom" })
    ).toThrow();
    expect(() =>
      studentInputSchema.parse({
        ...valid,
        goal: "custom",
        customGoal: "增加爆發力",
      })
    ).not.toThrow();
  });

  it("拒絕 weeklyClassCount 為負或大於 7", () => {
    expect(() =>
      studentInputSchema.parse({ ...valid, weeklyClassCount: -1 })
    ).toThrow();
    expect(() =>
      studentInputSchema.parse({ ...valid, weeklyClassCount: 8 })
    ).toThrow();
  });
});
```

- [ ] **Step 3：跑測試確認失敗**

```bash
npm test
```

Expected: FAIL（`studentInputSchema` 不存在）

- [ ] **Step 4：實作 validator**

`src/lib/validators/student.ts`：

```ts
import { z } from "zod";

export const studentInputSchema = z
  .object({
    name: z.string().min(1, "姓名必填"),
    gender: z.enum(["M", "F"]),
    birthday: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    goal: z.enum(["muscle_gain", "fat_loss", "fitness", "custom"]),
    customGoal: z.string().optional(),
    weeklyClassCount: z.number().int().min(0).max(7),
    weeklyGymCount: z.number().int().min(0).max(7),
    notes: z.string().optional(),
  })
  .refine(
    (data) => data.goal !== "custom" || !!data.customGoal?.trim(),
    {
      message: "選擇『其他』時必須填入自訂目標",
      path: ["customGoal"],
    }
  );

export type StudentInput = z.infer<typeof studentInputSchema>;
```

- [ ] **Step 5：跑測試確認通過**

```bash
npm test
```

Expected: PASS

- [ ] **Step 6：實作 server action `createStudent`**

`src/lib/actions/students.ts`：

```ts
"use server";

import { db } from "@/lib/db/client";
import { students } from "@/lib/db/schema";
import { studentInputSchema, type StudentInput } from "@/lib/validators/student";
import { eq, isNull, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createStudent(input: StudentInput) {
  const parsed = studentInputSchema.parse(input);
  const result = db
    .insert(students)
    .values({
      ...parsed,
      email: parsed.email || null,
    })
    .returning({ id: students.id })
    .all();

  revalidatePath("/students");
  redirect(`/students/${result[0].id}`);
}

export async function listActiveStudents() {
  return db
    .select()
    .from(students)
    .where(isNull(students.deletedAt))
    .orderBy(desc(students.createdAt))
    .all();
}

export async function getStudent(id: number) {
  return db
    .select()
    .from(students)
    .where(eq(students.id, id))
    .get();
}

export async function updateStudent(id: number, input: StudentInput) {
  const parsed = studentInputSchema.parse(input);
  db.update(students)
    .set({
      ...parsed,
      email: parsed.email || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(students.id, id))
    .run();

  revalidatePath(`/students/${id}`);
  revalidatePath("/students");
}

export async function softDeleteStudent(id: number) {
  db.update(students)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(students.id, id))
    .run();

  revalidatePath("/students");
  redirect("/students");
}
```

- [ ] **Step 7：commit**

```bash
git add .
git commit -m "feat: student validator and server actions"
```

---

## Task 6：學員列表頁

**Files:**
- Create: `src/app/students/page.tsx`
- Modify: `src/components/nav.tsx`（先建一個簡單的）
- Modify: `src/app/layout.tsx`

- [ ] **Step 1：寫頂部導覽元件**

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
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2：把 Nav 加到 root layout**

修改 `src/app/layout.tsx`，在 `<body>` 開頭加 `<Nav />`：

```tsx
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata = {
  title: "健身教練管理",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3：寫學員列表頁**

`src/app/students/page.tsx`：

```tsx
import Link from "next/link";
import { listActiveStudents } from "@/lib/actions/students";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const goalLabel: Record<string, string> = {
  muscle_gain: "增肌",
  fat_loss: "減脂",
  fitness: "體能",
  custom: "其他",
};

export default async function StudentsPage() {
  const students = await listActiveStudents();

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">學員列表</h1>
        <Button asChild>
          <Link href="/students/new">+ 新增學員</Link>
        </Button>
      </div>

      {students.length === 0 ? (
        <p className="text-muted-foreground">尚無學員，按右上角新增。</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>性別</TableHead>
              <TableHead>目標</TableHead>
              <TableHead>每週上課</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.gender === "M" ? "男" : "女"}</TableCell>
                <TableCell>
                  {s.goal === "custom" ? s.customGoal : goalLabel[s.goal]}
                </TableCell>
                <TableCell>{s.weeklyClassCount} 次</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/students/${s.id}`}>查看</Link>
                  </Button>
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

- [ ] **Step 4：手動測試**

```bash
npm run dev
```

打開 http://localhost:3000/students，應該看到「尚無學員」訊息與右上角「+ 新增學員」按鈕。

- [ ] **Step 5：commit**

```bash
git add .
git commit -m "feat: students list page with empty state"
```

---

## Task 7：新增學員表單

**Files:**
- Create: `src/components/student-form.tsx`
- Create: `src/app/students/new/page.tsx`

- [ ] **Step 1：安裝 react-hook-form 與整合 zod**

```bash
npm install react-hook-form @hookform/resolvers
```

- [ ] **Step 2：寫共用的 StudentForm 元件**

`src/components/student-form.tsx`：

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  studentInputSchema,
  type StudentInput,
} from "@/lib/validators/student";
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
import { useTransition } from "react";

interface Props {
  defaultValues?: Partial<StudentInput>;
  onSubmit: (input: StudentInput) => Promise<void>;
  submitLabel?: string;
}

export function StudentForm({ defaultValues, onSubmit, submitLabel = "儲存" }: Props) {
  const [pending, startTransition] = useTransition();
  const form = useForm<StudentInput>({
    resolver: zodResolver(studentInputSchema),
    defaultValues: {
      name: "",
      gender: "M",
      goal: "muscle_gain",
      weeklyClassCount: 1,
      weeklyGymCount: 3,
      ...defaultValues,
    },
  });

  const goal = form.watch("goal");

  return (
    <form
      onSubmit={form.handleSubmit((data) =>
        startTransition(() => onSubmit(data))
      )}
      className="space-y-4 max-w-xl"
    >
      <div>
        <Label htmlFor="name">姓名 *</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label>性別 *</Label>
        <Select
          value={form.watch("gender")}
          onValueChange={(v) => form.setValue("gender", v as "M" | "F")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="M">男</SelectItem>
            <SelectItem value="F">女</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="birthday">生日</Label>
        <Input
          id="birthday"
          type="date"
          {...form.register("birthday")}
        />
      </div>

      <div>
        <Label htmlFor="phone">電話</Label>
        <Input id="phone" {...form.register("phone")} />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} />
      </div>

      <div>
        <Label>目標 *</Label>
        <Select
          value={goal}
          onValueChange={(v) =>
            form.setValue("goal", v as StudentInput["goal"])
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="muscle_gain">增肌</SelectItem>
            <SelectItem value="fat_loss">減脂</SelectItem>
            <SelectItem value="fitness">體能</SelectItem>
            <SelectItem value="custom">其他</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {goal === "custom" && (
        <div>
          <Label htmlFor="customGoal">自訂目標 *</Label>
          <Input id="customGoal" {...form.register("customGoal")} />
          {form.formState.errors.customGoal && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.customGoal.message}
            </p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="weeklyClassCount">每週上課次數 *</Label>
        <Input
          id="weeklyClassCount"
          type="number"
          min="0"
          max="7"
          {...form.register("weeklyClassCount", { valueAsNumber: true })}
        />
      </div>

      <div>
        <Label htmlFor="weeklyGymCount">每週可進健身房次數 *</Label>
        <Input
          id="weeklyGymCount"
          type="number"
          min="0"
          max="7"
          {...form.register("weeklyGymCount", { valueAsNumber: true })}
        />
      </div>

      <div>
        <Label htmlFor="notes">備註（受傷史、過敏…）</Label>
        <Textarea id="notes" rows={4} {...form.register("notes")} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "儲存中…" : submitLabel}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3：寫新增學員頁**

`src/app/students/new/page.tsx`：

```tsx
import { StudentForm } from "@/components/student-form";
import { createStudent } from "@/lib/actions/students";

export default function NewStudentPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">新增學員</h1>
      <StudentForm onSubmit={createStudent} submitLabel="建立學員" />
    </div>
  );
}
```

- [ ] **Step 4：手動測試**

```bash
npm run dev
```

打開 http://localhost:3000/students/new，填表單後送出，應該被導向 `/students/[id]`。

- [ ] **Step 5：commit**

```bash
git add .
git commit -m "feat: new student form with validation"
```

---

## Task 8：學員詳細頁與編輯

**Files:**
- Create: `src/app/students/[id]/layout.tsx`
- Create: `src/app/students/[id]/page.tsx`
- Create: `src/app/students/[id]/edit/page.tsx`

- [ ] **Step 1：寫學員詳細頁的 sub-layout（含 tab 導覽）**

`src/app/students/[id]/layout.tsx`：

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudent } from "@/lib/actions/students";
import { Separator } from "@/components/ui/separator";

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const id = Number(params.id);
  const student = await getStudent(id);
  if (!student) notFound();

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">{student.name}</h1>
        <Link
          href={`/students/${id}/edit`}
          className="text-sm text-muted-foreground hover:underline"
        >
          編輯資料
        </Link>
      </div>
      <nav className="flex gap-4 text-sm mb-4">
        <Link href={`/students/${id}`} className="hover:underline">
          總覽
        </Link>
        <Link href={`/students/${id}/inbody`} className="hover:underline">
          InBody
        </Link>
      </nav>
      <Separator className="mb-6" />
      {children}
    </div>
  );
}
```

- [ ] **Step 2：寫總覽頁**

`src/app/students/[id]/page.tsx`：

```tsx
import { getStudent } from "@/lib/actions/students";
import { notFound } from "next/navigation";

const goalLabel: Record<string, string> = {
  muscle_gain: "增肌",
  fat_loss: "減脂",
  fitness: "體能",
  custom: "其他",
};

export default async function StudentOverviewPage({
  params,
}: {
  params: { id: string };
}) {
  const student = await getStudent(Number(params.id));
  if (!student) notFound();

  return (
    <div className="space-y-3">
      <Field label="性別">{student.gender === "M" ? "男" : "女"}</Field>
      <Field label="生日">{student.birthday ?? "—"}</Field>
      <Field label="電話">{student.phone ?? "—"}</Field>
      <Field label="Email">{student.email ?? "—"}</Field>
      <Field label="目標">
        {student.goal === "custom" ? student.customGoal : goalLabel[student.goal]}
      </Field>
      <Field label="每週上課">{student.weeklyClassCount} 次</Field>
      <Field label="每週可進健身房">{student.weeklyGymCount} 次</Field>
      <Field label="備註">{student.notes ?? "—"}</Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}
```

- [ ] **Step 3：寫編輯頁**

`src/app/students/[id]/edit/page.tsx`：

```tsx
import { getStudent, updateStudent } from "@/lib/actions/students";
import { notFound, redirect } from "next/navigation";
import { StudentForm } from "@/components/student-form";
import type { StudentInput } from "@/lib/validators/student";

export default async function EditStudentPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const student = await getStudent(id);
  if (!student) notFound();

  async function handle(input: StudentInput) {
    "use server";
    await updateStudent(id, input);
    redirect(`/students/${id}`);
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">編輯學員資料</h2>
      <StudentForm
        defaultValues={{
          name: student.name,
          gender: student.gender,
          birthday: student.birthday ?? undefined,
          phone: student.phone ?? undefined,
          email: student.email ?? undefined,
          goal: student.goal,
          customGoal: student.customGoal ?? undefined,
          weeklyClassCount: student.weeklyClassCount,
          weeklyGymCount: student.weeklyGymCount,
          notes: student.notes ?? undefined,
        }}
        onSubmit={handle}
        submitLabel="儲存修改"
      />
    </div>
  );
}
```

- [ ] **Step 4：手動測試**

跑 `npm run dev`，新增一個學員，被導到詳細頁，按「編輯資料」修改後儲存，回到詳細頁能看到更新。

- [ ] **Step 5：commit**

```bash
git add .
git commit -m "feat: student detail and edit pages"
```

---

## Task 9：InBody Validator + Server Action

**Files:**
- Create: `src/lib/validators/inbody.ts`
- Create: `src/lib/validators/inbody.test.ts`
- Create: `src/lib/actions/inbody.ts`

- [ ] **Step 1：寫 InBody validator 的失敗測試**

`src/lib/validators/inbody.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { inbodyInputSchema } from "./inbody";

describe("inbodyInputSchema", () => {
  const valid = {
    studentId: 1,
    measuredAt: "2026-05-09",
    weightKg: 70,
    bodyFatPct: 18,
  };

  it("接受最少必填", () => {
    expect(() => inbodyInputSchema.parse(valid)).not.toThrow();
  });

  it("拒絕負體重", () => {
    expect(() =>
      inbodyInputSchema.parse({ ...valid, weightKg: -1 })
    ).toThrow();
  });

  it("體脂率超過 100% 觸發錯誤", () => {
    expect(() =>
      inbodyInputSchema.parse({ ...valid, bodyFatPct: 101 })
    ).toThrow();
  });

  it("體脂率 0–100 之間都接受", () => {
    expect(() =>
      inbodyInputSchema.parse({ ...valid, bodyFatPct: 0 })
    ).not.toThrow();
    expect(() =>
      inbodyInputSchema.parse({ ...valid, bodyFatPct: 50 })
    ).not.toThrow();
  });
});
```

- [ ] **Step 2：跑測試確認失敗**

```bash
npm test
```

Expected: FAIL（`inbodyInputSchema` 不存在）

- [ ] **Step 3：實作 validator**

`src/lib/validators/inbody.ts`：

```ts
import { z } from "zod";

const num = (max?: number) => {
  let s = z.number().nonnegative();
  if (max !== undefined) s = s.max(max);
  return s.optional();
};

export const inbodyInputSchema = z.object({
  studentId: z.number().int().positive(),
  measuredAt: z.string().min(1),

  weightKg: num(500),
  bodyFatPct: num(100),
  skeletalMuscleKg: num(200),
  bodyFatKg: num(500),
  visceralFatLevel: num(30),
  bodyAge: num(120),
  bmi: num(100),

  bmrKcal: num(5000),
  totalWaterL: num(200),
  proteinKg: num(100),

  muscleLeftArm: num(50),
  muscleRightArm: num(50),
  muscleTrunk: num(100),
  muscleLeftLeg: num(80),
  muscleRightLeg: num(80),

  fatLeftArm: num(50),
  fatRightArm: num(50),
  fatTrunk: num(100),
  fatLeftLeg: num(80),
  fatRightLeg: num(80),

  coachNotes: z.string().optional(),
});

export type InBodyInput = z.infer<typeof inbodyInputSchema>;
```

- [ ] **Step 4：跑測試確認通過**

```bash
npm test
```

Expected: PASS

- [ ] **Step 5：寫 server actions**

`src/lib/actions/inbody.ts`：

```ts
"use server";

import { db } from "@/lib/db/client";
import { inbodyRecords } from "@/lib/db/schema";
import {
  inbodyInputSchema,
  type InBodyInput,
} from "@/lib/validators/inbody";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createInBodyRecord(input: InBodyInput) {
  const parsed = inbodyInputSchema.parse(input);
  const result = db
    .insert(inbodyRecords)
    .values(parsed)
    .returning({ id: inbodyRecords.id })
    .all();

  revalidatePath(`/students/${parsed.studentId}/inbody`);
  redirect(`/students/${parsed.studentId}/inbody/${result[0].id}`);
}

export async function listInBodyRecords(studentId: number) {
  return db
    .select()
    .from(inbodyRecords)
    .where(eq(inbodyRecords.studentId, studentId))
    .orderBy(desc(inbodyRecords.measuredAt))
    .all();
}

export async function getInBodyRecord(id: number) {
  return db
    .select()
    .from(inbodyRecords)
    .where(eq(inbodyRecords.id, id))
    .get();
}
```

- [ ] **Step 6：commit**

```bash
git add .
git commit -m "feat: inbody validator and server actions"
```

---

## Task 10：規則 R4 — 基本建議引擎

**Files:**
- Create: `src/lib/recommendations/basic-inbody.ts`
- Create: `src/lib/recommendations/basic-inbody.test.ts`

依 spec §6 R4：根據 InBody + Student.goal 產生提醒文字模板。

- [ ] **Step 1：寫測試**

`src/lib/recommendations/basic-inbody.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { generateBasicRecommendations } from "./basic-inbody";

const baseInbody = {
  weightKg: 70,
  bodyFatPct: 20,
  bmrKcal: 1500,
  visceralFatLevel: 8,
};

describe("generateBasicRecommendations", () => {
  it("男性體脂 > 25% + 增肌目標 → 建議先減脂", () => {
    const result = generateBasicRecommendations({
      gender: "M",
      goal: "muscle_gain",
      inbody: { ...baseInbody, bodyFatPct: 28 },
    });
    expect(result).toContainEqual(
      expect.objectContaining({ key: "fat_loss_first" })
    );
  });

  it("女性體脂 > 30% + 增肌目標 → 建議先減脂", () => {
    const result = generateBasicRecommendations({
      gender: "F",
      goal: "muscle_gain",
      inbody: { ...baseInbody, bodyFatPct: 32 },
    });
    expect(result).toContainEqual(
      expect.objectContaining({ key: "fat_loss_first" })
    );
  });

  it("男性體脂 22% + 增肌目標 → 不觸發先減脂", () => {
    const result = generateBasicRecommendations({
      gender: "M",
      goal: "muscle_gain",
      inbody: { ...baseInbody, bodyFatPct: 22 },
    });
    expect(result).not.toContainEqual(
      expect.objectContaining({ key: "fat_loss_first" })
    );
  });

  it("BMR < 1300 → 提醒基礎代謝偏低", () => {
    const result = generateBasicRecommendations({
      gender: "M",
      goal: "fitness",
      inbody: { ...baseInbody, bmrKcal: 1200 },
    });
    expect(result).toContainEqual(
      expect.objectContaining({ key: "low_bmr" })
    );
  });

  it("內臟脂肪 > 10 → 觸發優先處理", () => {
    const result = generateBasicRecommendations({
      gender: "M",
      goal: "fat_loss",
      inbody: { ...baseInbody, visceralFatLevel: 12 },
    });
    expect(result).toContainEqual(
      expect.objectContaining({ key: "high_visceral_fat" })
    );
  });

  it("健康體型 + 體能目標 → 回傳一條鼓勵性訊息", () => {
    const result = generateBasicRecommendations({
      gender: "M",
      goal: "fitness",
      inbody: baseInbody,
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContainEqual(
      expect.objectContaining({ key: "default_ok" })
    );
  });
});
```

- [ ] **Step 2：跑測試確認失敗**

```bash
npm test
```

Expected: FAIL（檔案／函式不存在）

- [ ] **Step 3：實作建議引擎**

`src/lib/recommendations/basic-inbody.ts`：

```ts
export type Gender = "M" | "F";
export type Goal = "muscle_gain" | "fat_loss" | "fitness" | "custom";

export interface InBodySnapshot {
  weightKg?: number | null;
  bodyFatPct?: number | null;
  bmrKcal?: number | null;
  visceralFatLevel?: number | null;
}

export interface Recommendation {
  key: string;
  text: string;
  severity: "info" | "warn" | "alert";
}

export interface RecommendationContext {
  gender: Gender;
  goal: Goal;
  inbody: InBodySnapshot;
  // 預設閾值，未來改由 coach_settings 注入
  bodyFatWarnMale?: number;
  bodyFatWarnFemale?: number;
}

export function generateBasicRecommendations(
  ctx: RecommendationContext
): Recommendation[] {
  const result: Recommendation[] = [];
  const fatThreshold =
    ctx.gender === "M"
      ? ctx.bodyFatWarnMale ?? 25
      : ctx.bodyFatWarnFemale ?? 30;

  const { bodyFatPct, bmrKcal, visceralFatLevel } = ctx.inbody;

  if (
    bodyFatPct != null &&
    bodyFatPct > fatThreshold &&
    ctx.goal === "muscle_gain"
  ) {
    result.push({
      key: "fat_loss_first",
      severity: "warn",
      text: `體脂率 ${bodyFatPct}% 高於 ${fatThreshold}%，建議先以減脂為主，再進入增肌期。`,
    });
  }

  if (bmrKcal != null && bmrKcal < 1300) {
    result.push({
      key: "low_bmr",
      severity: "warn",
      text: `基礎代謝率 ${bmrKcal} kcal 偏低，建議透過肌力訓練提升肌肉量、進而提升代謝。`,
    });
  }

  if (visceralFatLevel != null && visceralFatLevel > 10) {
    result.push({
      key: "high_visceral_fat",
      severity: "alert",
      text: `內臟脂肪等級 ${visceralFatLevel} 偏高，建議優先處理內臟脂肪（規律有氧 + 飲食控制）。`,
    });
  }

  if (result.length === 0) {
    result.push({
      key: "default_ok",
      severity: "info",
      text: "目前各項數值在合理區間，依目標規劃訓練即可。",
    });
  }

  return result;
}
```

- [ ] **Step 4：跑測試確認全部通過**

```bash
npm test
```

Expected: PASS（6 tests passed）

- [ ] **Step 5：commit**

```bash
git add .
git commit -m "feat: basic inbody recommendation rule R4"
```

---

## Task 11：InBody 表單頁

**Files:**
- Create: `src/components/inbody-form.tsx`
- Create: `src/app/students/[id]/inbody/new/page.tsx`

- [ ] **Step 1：寫 InBody 表單元件（含分組 + 摺疊）**

`src/components/inbody-form.tsx`：

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import {
  inbodyInputSchema,
  type InBodyInput,
} from "@/lib/validators/inbody";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const num = { type: "number", step: "0.1" } as const;

interface Props {
  studentId: number;
  onSubmit: (input: InBodyInput) => Promise<void>;
}

export function InBodyForm({ studentId, onSubmit }: Props) {
  const [pending, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<InBodyInput>({
    resolver: zodResolver(inbodyInputSchema),
    defaultValues: {
      studentId,
      measuredAt: new Date().toISOString().slice(0, 10),
    },
  });

  const reg = (name: keyof InBodyInput) =>
    form.register(name, { valueAsNumber: name !== "measuredAt" && name !== "coachNotes" });

  return (
    <form
      onSubmit={form.handleSubmit((data) =>
        startTransition(() => onSubmit(data))
      )}
      className="space-y-6 max-w-3xl"
    >
      {/* 基本欄位 */}
      <section className="space-y-4">
        <h3 className="font-semibold">基本</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="measuredAt">量測日期 *</Label>
            <Input id="measuredAt" type="date" {...form.register("measuredAt")} />
          </div>
          <div>
            <Label htmlFor="weightKg">體重 (kg)</Label>
            <Input id="weightKg" {...num} {...reg("weightKg")} />
          </div>
          <div>
            <Label htmlFor="bodyFatPct">體脂率 (%)</Label>
            <Input id="bodyFatPct" {...num} {...reg("bodyFatPct")} />
          </div>
          <div>
            <Label htmlFor="skeletalMuscleKg">骨骼肌量 (kg)</Label>
            <Input
              id="skeletalMuscleKg"
              {...num}
              {...reg("skeletalMuscleKg")}
            />
          </div>
          <div>
            <Label htmlFor="bmi">BMI</Label>
            <Input id="bmi" {...num} {...reg("bmi")} />
          </div>
          <div>
            <Label htmlFor="bmrKcal">BMR (kcal)</Label>
            <Input id="bmrKcal" {...num} {...reg("bmrKcal")} />
          </div>
        </div>
      </section>

      {/* 進階欄位（可摺疊） */}
      <section className="space-y-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-sm text-primary hover:underline"
        >
          {showAdvanced ? "▼" : "▶"} 進階欄位（部位分析、代謝細項）
        </button>

        {showAdvanced && (
          <div className="space-y-6 pl-2 border-l-2">
            <div>
              <h4 className="font-medium mb-2">代謝</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalWaterL">全身水分 (L)</Label>
                  <Input {...num} {...reg("totalWaterL")} id="totalWaterL" />
                </div>
                <div>
                  <Label htmlFor="proteinKg">蛋白質 (kg)</Label>
                  <Input {...num} {...reg("proteinKg")} id="proteinKg" />
                </div>
                <div>
                  <Label htmlFor="bodyFatKg">體脂量 (kg)</Label>
                  <Input {...num} {...reg("bodyFatKg")} id="bodyFatKg" />
                </div>
                <div>
                  <Label htmlFor="visceralFatLevel">內臟脂肪等級</Label>
                  <Input
                    {...num}
                    {...reg("visceralFatLevel")}
                    id="visceralFatLevel"
                  />
                </div>
                <div>
                  <Label htmlFor="bodyAge">身體年齡</Label>
                  <Input {...num} {...reg("bodyAge")} id="bodyAge" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">部位肌肉量 (kg)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="muscleLeftArm">左臂</Label>
                  <Input {...num} {...reg("muscleLeftArm")} id="muscleLeftArm" />
                </div>
                <div>
                  <Label htmlFor="muscleRightArm">右臂</Label>
                  <Input
                    {...num}
                    {...reg("muscleRightArm")}
                    id="muscleRightArm"
                  />
                </div>
                <div>
                  <Label htmlFor="muscleTrunk">軀幹</Label>
                  <Input {...num} {...reg("muscleTrunk")} id="muscleTrunk" />
                </div>
                <div>
                  <Label htmlFor="muscleLeftLeg">左腿</Label>
                  <Input {...num} {...reg("muscleLeftLeg")} id="muscleLeftLeg" />
                </div>
                <div>
                  <Label htmlFor="muscleRightLeg">右腿</Label>
                  <Input
                    {...num}
                    {...reg("muscleRightLeg")}
                    id="muscleRightLeg"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">部位體脂量 (kg)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fatLeftArm">左臂</Label>
                  <Input {...num} {...reg("fatLeftArm")} id="fatLeftArm" />
                </div>
                <div>
                  <Label htmlFor="fatRightArm">右臂</Label>
                  <Input {...num} {...reg("fatRightArm")} id="fatRightArm" />
                </div>
                <div>
                  <Label htmlFor="fatTrunk">軀幹</Label>
                  <Input {...num} {...reg("fatTrunk")} id="fatTrunk" />
                </div>
                <div>
                  <Label htmlFor="fatLeftLeg">左腿</Label>
                  <Input {...num} {...reg("fatLeftLeg")} id="fatLeftLeg" />
                </div>
                <div>
                  <Label htmlFor="fatRightLeg">右腿</Label>
                  <Input {...num} {...reg("fatRightLeg")} id="fatRightLeg" />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <div>
        <Label htmlFor="coachNotes">教練筆記</Label>
        <Textarea
          id="coachNotes"
          rows={3}
          {...form.register("coachNotes")}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "儲存中…" : "儲存 InBody 紀錄"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2：寫新增 InBody 頁**

`src/app/students/[id]/inbody/new/page.tsx`：

```tsx
import { getStudent } from "@/lib/actions/students";
import { createInBodyRecord } from "@/lib/actions/inbody";
import { InBodyForm } from "@/components/inbody-form";
import { notFound } from "next/navigation";

export default async function NewInBodyPage({
  params,
}: {
  params: { id: string };
}) {
  const student = await getStudent(Number(params.id));
  if (!student) notFound();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">新增 InBody 紀錄</h2>
      <InBodyForm studentId={student.id} onSubmit={createInBodyRecord} />
    </div>
  );
}
```

- [ ] **Step 3：手動測試**

跑 dev server，到任何學員頁 → InBody → 新增，填表單儲存，看是否會跳到單筆 InBody 詳細頁（下一個 task 才會做）。先確認資料有寫進 db：

```bash
npx drizzle-kit studio
```

打開 https://local.drizzle.studio，看 `inbody_records` 表有沒有資料。

- [ ] **Step 4：commit**

```bash
git add .
git commit -m "feat: inbody recording form with collapsible advanced fields"
```

---

## Task 12：InBody 歷史頁 + 詳細頁（含建議卡片）

**Files:**
- Create: `src/components/recommendation-card.tsx`
- Create: `src/app/students/[id]/inbody/page.tsx`
- Create: `src/app/students/[id]/inbody/[recordId]/page.tsx`

- [ ] **Step 1：寫建議卡片元件**

`src/components/recommendation-card.tsx`：

```tsx
import type { Recommendation } from "@/lib/recommendations/basic-inbody";

const severityClass: Record<Recommendation["severity"], string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
  alert: "border-red-200 bg-red-50 text-red-900",
};

export function RecommendationCard({ recs }: { recs: Recommendation[] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">基本建議</h3>
      {recs.map((r) => (
        <div
          key={r.key}
          className={`border rounded-md p-3 text-sm ${severityClass[r.severity]}`}
        >
          {r.text}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2：寫 InBody 歷史列表頁**

`src/app/students/[id]/inbody/page.tsx`：

```tsx
import Link from "next/link";
import { listInBodyRecords } from "@/lib/actions/inbody";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function InBodyListPage({
  params,
}: {
  params: { id: string };
}) {
  const studentId = Number(params.id);
  const records = await listInBodyRecords(studentId);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">InBody 紀錄</h2>
        <Button asChild>
          <Link href={`/students/${studentId}/inbody/new`}>+ 新增紀錄</Link>
        </Button>
      </div>

      {records.length === 0 ? (
        <p className="text-muted-foreground">尚無紀錄。</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>體重</TableHead>
              <TableHead>體脂率</TableHead>
              <TableHead>骨骼肌</TableHead>
              <TableHead>BMR</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.measuredAt}</TableCell>
                <TableCell>{r.weightKg ?? "—"}</TableCell>
                <TableCell>{r.bodyFatPct ?? "—"}</TableCell>
                <TableCell>{r.skeletalMuscleKg ?? "—"}</TableCell>
                <TableCell>{r.bmrKcal ?? "—"}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/students/${studentId}/inbody/${r.id}`}>
                      查看
                    </Link>
                  </Button>
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

- [ ] **Step 3：寫單筆 InBody 詳細頁（含建議卡片）**

`src/app/students/[id]/inbody/[recordId]/page.tsx`：

```tsx
import { notFound } from "next/navigation";
import { getInBodyRecord } from "@/lib/actions/inbody";
import { getStudent } from "@/lib/actions/students";
import { generateBasicRecommendations } from "@/lib/recommendations/basic-inbody";
import { RecommendationCard } from "@/components/recommendation-card";

export default async function InBodyDetailPage({
  params,
}: {
  params: { id: string; recordId: string };
}) {
  const recordId = Number(params.recordId);
  const studentId = Number(params.id);
  const [record, student] = await Promise.all([
    getInBodyRecord(recordId),
    getStudent(studentId),
  ]);
  if (!record || !student) notFound();

  const recs = generateBasicRecommendations({
    gender: student.gender,
    goal: student.goal,
    inbody: {
      weightKg: record.weightKg,
      bodyFatPct: record.bodyFatPct,
      bmrKcal: record.bmrKcal,
      visceralFatLevel: record.visceralFatLevel,
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-2">
          InBody 紀錄 · {record.measuredAt}
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Field label="體重">{fmt(record.weightKg, "kg")}</Field>
          <Field label="體脂率">{fmt(record.bodyFatPct, "%")}</Field>
          <Field label="骨骼肌量">{fmt(record.skeletalMuscleKg, "kg")}</Field>
          <Field label="體脂量">{fmt(record.bodyFatKg, "kg")}</Field>
          <Field label="BMI">{fmt(record.bmi)}</Field>
          <Field label="BMR">{fmt(record.bmrKcal, "kcal")}</Field>
          <Field label="內臟脂肪等級">{fmt(record.visceralFatLevel)}</Field>
          <Field label="身體年齡">{fmt(record.bodyAge)}</Field>
          <Field label="全身水分">{fmt(record.totalWaterL, "L")}</Field>
          <Field label="蛋白質">{fmt(record.proteinKg, "kg")}</Field>
        </div>
        {record.coachNotes && (
          <div className="mt-4 text-sm">
            <span className="text-muted-foreground">教練筆記：</span>
            {record.coachNotes}
          </div>
        )}
      </div>

      <RecommendationCard recs={recs} />
    </div>
  );
}

function fmt(v: number | null | undefined, unit?: string) {
  if (v == null) return "—";
  return unit ? `${v} ${unit}` : `${v}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}：</span>
      <span>{children}</span>
    </div>
  );
}
```

- [ ] **Step 4：手動測試**

完整跑一次：
1. 新增學員（增肌目標）
2. 量 InBody，故意填體脂率 28%
3. 儲存後看詳細頁，應出現「建議先減脂再增肌」黃色警示

- [ ] **Step 5：commit**

```bash
git add .
git commit -m "feat: inbody history list and detail page with recommendations"
```

---

## Task 13：Playwright 端對端測試

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/student-flow.spec.ts`

- [ ] **Step 1：安裝 Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2：寫 `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // SQLite 共用 db 檔
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

- [ ] **Step 3：在 `package.json` 加 e2e script**

```json
"test:e2e": "playwright test"
```

- [ ] **Step 4：寫端對端測試**

`tests/e2e/student-flow.spec.ts`：

```ts
import { test, expect } from "@playwright/test";

test("新增學員 → 量 InBody → 看到基本建議", async ({ page }) => {
  const name = `E2E_${Date.now()}`;

  // 1. 新增學員
  await page.goto("/students/new");
  await page.fill('input[id="name"]', name);
  // 選性別 = 男（預設就是 M，這裡跳過點選）
  await page.fill('input[id="weeklyClassCount"]', "2");
  await page.fill('input[id="weeklyGymCount"]', "4");
  await page.click('button[type="submit"]');

  // 應跳到學員詳細頁
  await expect(page.locator("h1")).toHaveText(name);

  // 2. 進 InBody → 新增
  await page.click('a[href*="/inbody"]');
  await page.click('a[href*="/inbody/new"]');

  // 填高體脂觸發建議
  await page.fill('input[id="weightKg"]', "80");
  await page.fill('input[id="bodyFatPct"]', "28");
  await page.fill('input[id="bmrKcal"]', "1500");
  await page.click('button[type="submit"]');

  // 3. 詳細頁應該顯示「建議先減脂再增肌」
  await expect(
    page.getByText(/建議先以減脂為主/)
  ).toBeVisible();
});
```

> **註：** 上面的測試假設學員預設目標是「增肌」（form defaultValues），所以體脂 28% 會觸發 fat_loss_first 規則。

- [ ] **Step 5：跑端對端測試**

```bash
npm run test:e2e
```

Expected: PASS（1 test passed）

如果失敗，加上 `--debug` 重跑找問題：
```bash
npx playwright test --debug
```

- [ ] **Step 6：commit**

```bash
git add .
git commit -m "test: e2e flow new student → inbody → recommendation"
```

---

## Task 14：啟動 / 備份腳本

**Files:**
- Create: `gym/啟動健身管理.command`
- Create: `gym/備份資料.command`

- [ ] **Step 1：寫啟動腳本**

`啟動健身管理.command`：

```bash
#!/bin/bash
cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "首次啟動，安裝相依套件…"
  npm install || { echo "安裝失敗"; read; exit 1; }
fi

if [ ! -f "data/gym.db" ]; then
  echo "首次啟動，建立資料庫…"
  npx drizzle-kit migrate || { echo "建表失敗"; read; exit 1; }
fi

echo "啟動 server，瀏覽器將自動打開 http://localhost:3000"
( sleep 3 && open http://localhost:3000 ) &
npm run dev
```

- [ ] **Step 2：寫備份腳本**

`備份資料.command`：

```bash
#!/bin/bash
cd "$(dirname "$0")"

BACKUP_DIR="$HOME/Desktop/gym-backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
DEST="$BACKUP_DIR/gym-$TIMESTAMP.db"

if [ ! -f "data/gym.db" ]; then
  echo "找不到 data/gym.db"
  read
  exit 1
fi

cp data/gym.db "$DEST"
echo "已備份到：$DEST"
read -p "按 Enter 結束…"
```

- [ ] **Step 3：給執行權限**

```bash
chmod +x 啟動健身管理.command 備份資料.command
```

- [ ] **Step 4：手動驗證雙擊可用**

在 Finder 裡雙擊 `啟動健身管理.command`，應該打開 Terminal 跑 `npm run dev` 並自動打開瀏覽器。`Ctrl+C` 結束。

- [ ] **Step 5：commit**

```bash
git add .
git commit -m "feat: macOS launch and backup .command scripts"
```

---

## Task 15：寫 README 並 wrap-up

**Files:**
- Modify: `gym/README.md`

- [ ] **Step 1：擴充 README**

`README.md`：

```markdown
# 健身教練管理 App

個人健身教練的學員管理 + 訓練紀錄 + 個人化計劃工具。

## Slice 1 已完成

- ✅ Next.js + SQLite + shadcn/ui 專案打底
- ✅ 學員 CRUD（新增、列表、詳細、編輯、軟刪除）
- ✅ InBody 紀錄（含進階欄位、歷史、單筆詳細）
- ✅ InBody 基本建議（規則 R4）
- ✅ 單元測試（Vitest）+ 端對端測試（Playwright）

## 一般使用

雙擊 `啟動健身管理.command`。

第一次會自動：
- 安裝相依套件
- 建立空資料庫

之後每次只是啟動。瀏覽器會自動打開 http://localhost:3000。

## 備份

雙擊 `備份資料.command`，會把 `data/gym.db` 複製到 `~/Desktop/gym-backups/`。

## 開發

\`\`\`bash
npm install
npm run dev          # 啟動 dev server
npm test             # 跑單元測試
npm run test:e2e     # 跑端對端測試
npm run db:studio    # 視覺化看資料庫
\`\`\`

## 文件

- 設計規格：`docs/superpowers/specs/2026-05-09-gym-coach-app-design.md`
- 實作計劃：`docs/superpowers/plans/`

## 路線圖

| Slice | 內容 | 狀態 |
|-------|------|------|
| 1 | 專案打底 + 學員 CRUD + InBody | ✅ |
| 2 | Session + Exercise + SetLog（核心紀錄頁） | ⏳ |
| 3 | 規則引擎 + 重量建議 | ⏳ |
| 4 | WeeklyPlan + AI 整合 | ⏳ |
| 5 | PDF 產生 | ⏳ |
| 6 | 設定頁、備份、Polish | ⏳ |
```

- [ ] **Step 2：跑全部測試確認 slice 1 完整綠**

```bash
npm test
npm run test:e2e
```

Expected: 全部 PASS

- [ ] **Step 3：最後 commit**

```bash
git add README.md
git commit -m "docs: slice 1 readme"
```

---

## Slice 1 驗收清單

實作這份計劃的人，跑完之後應該滿足以下：

- [ ] `npm install && npm run dev` 後 http://localhost:3000 可開
- [ ] 可在 `/students/new` 新增學員，姓名空白會擋下
- [ ] 學員列表 `/students` 顯示所有未刪除學員
- [ ] 學員詳細頁 `/students/[id]` 顯示完整資料
- [ ] 編輯頁 `/students/[id]/edit` 修改後資料更新
- [ ] InBody 表單可填全部 22 個欄位（基本展開、進階摺疊）
- [ ] InBody 詳細頁顯示量測數值與建議卡片
- [ ] 體脂超過閾值 + 增肌目標時跳出黃色警示
- [ ] BMR < 1300 時跳出基礎代謝偏低警示
- [ ] 內臟脂肪 > 10 時跳出紅色警示
- [ ] 預設情況顯示藍色「目前各項數值在合理區間」
- [ ] `npm test` 全部綠（基本建議引擎 6 個測試 + bmi 4 個 + validators 9 個）
- [ ] `npm run test:e2e` 端對端測試通過
- [ ] 雙擊 `啟動健身管理.command` 能啟動
- [ ] 雙擊 `備份資料.command` 能備份

---

## Out of Scope（slice 1 不做，留給後續）

- Session（訓練課）相關功能 → Slice 2
- Exercise 動作主檔（含 wger 同步） → Slice 2
- SetLog 紀錄 → Slice 2
- 重量建議規則 R2 → Slice 3
- 訓練菜單規則 R1 → Slice 3
- WeeklyPlan + DailyPlan → Slice 4
- Gemini 飲食建議 → Slice 4
- PDF 產生 → Slice 5
- 設定頁（規則參數 / API key） → Slice 6
- 軟刪除學員救援頁 → Slice 6
- 自動 30 天備份快照 → Slice 6
- InBody 折線圖 → Slice 6
- coach_id 之外的多教練處理 → Phase 2

---

## 後續計劃

實作完此 slice 後：
1. 你（使用者）實際試用，記錄問題與想改的地方
2. 我根據試用回饋寫 **Slice 2 plan**：訓練課 + 動作主檔 + 即時紀錄頁（這是 spec 中最大、最關鍵的一塊）
3. 依此類推到 Slice 6

每個 slice 後都會回到本目錄產生新的 plan 檔。
