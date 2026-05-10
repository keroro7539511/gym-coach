# UI 改版（暗炭灰 + 琥珀銅）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** 把現有 MVP 的亮色預設樣式改成「暗炭灰 + 琥珀銅」的現代健身科技風，所有頁面、元件、徽章、按鈕、輸入框都套用統一 design tokens。

**Architecture:** 純樣式改動，不改 React 元件結構或 layout。改 `globals.css` 的 CSS variables、加 Google Fonts、重新著色 shadcn 元件。每個頁面/元件按既有結構修 className、hex 色由 CSS 變數驅動。

**Tech:** Tailwind v4 + shadcn `base-nova` + Google Fonts (Inter, JetBrains Mono)

**Spec reference:** `docs/superpowers/specs/2026-05-09-ui-redesign-charcoal-amber-design.md`

**前置：** MVP 完成（commits 5ddc149..914835e），49 unit tests + 1 e2e 全綠

---

## File Structure

| 動作 | 檔案 |
|------|------|
| Modify | `src/app/globals.css` |
| Modify | `src/app/layout.tsx`（加字型 link） |
| Modify | `src/components/nav.tsx` |
| Modify | `src/app/page.tsx`（首頁 dashboard） |
| Modify | `src/components/session-recorder.tsx` |
| Modify | `src/components/set-row.tsx` |
| Modify | `src/components/exercise-picker.tsx` |
| Modify | `src/app/students/page.tsx` |
| Modify | `src/app/students/[id]/layout.tsx` |
| Modify | `src/app/students/[id]/page.tsx` |
| Modify | `src/app/students/[id]/edit/page.tsx` |
| Modify | `src/app/students/[id]/inbody/[recordId]/page.tsx` |
| Modify | `src/app/students/[id]/inbody/page.tsx` |
| Modify | `src/app/students/[id]/sessions/page.tsx` |
| Modify | `src/app/students/[id]/weekly-plans/page.tsx` |
| Modify | `src/app/students/deleted/page.tsx` |
| Modify | `src/components/recommendation-card.tsx` |
| Modify | `src/components/student-form.tsx` |
| Modify | `src/components/inbody-form.tsx` |
| Modify | `src/components/exercise-form.tsx` |
| Modify | `src/components/settings-form.tsx` |
| Modify | `src/components/weekly-plan-editor.tsx` |
| Modify | `src/components/daily-plan-editor.tsx` |
| Modify | `src/app/exercises/page.tsx` |
| Modify | `src/app/exercises/new/page.tsx` |
| Modify | `src/app/exercises/[id]/edit/page.tsx` |
| Modify | `src/app/settings/page.tsx` |
| Modify | `src/app/sessions/[id]/page.tsx`（已用 SessionRecorder，可能不用改） |
| Modify | `src/app/weekly-plans/[id]/page.tsx`（已用 WeeklyPlanEditor，可能不用改） |

---

## Task 1：CSS variables 與字型

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1：覆寫 `globals.css` 的 `:root` 顏色變數**

把 `src/app/globals.css` 內 `:root { ... }` 區塊**整個替換**成：

```css
:root {
  color-scheme: dark;

  /* 自訂語意色階 */
  --surface-1: #0e0e0e;
  --surface-2: #161616;
  --surface-3: #1f1f1f;
  --border-subtle: #1f1f1f;
  --border-strong: #3a3a3a;

  /* shadcn 變數對映 */
  --background: #0a0a0a;
  --foreground: #ededed;
  --card: #161616;
  --card-foreground: #ededed;
  --popover: #161616;
  --popover-foreground: #ededed;
  --primary: #f59e0b;
  --primary-foreground: #0e0e0e;
  --secondary: #1f1f1f;
  --secondary-foreground: #ededed;
  --muted: #1f1f1f;
  --muted-foreground: #888888;
  --accent: #1f1f1f;
  --accent-foreground: #f59e0b;
  --destructive: #ef4444;
  --destructive-foreground: #ededed;
  --border: #2a2a2a;
  --input: #2a2a2a;
  --ring: #f59e0b;

  /* charts（保留以免破壞） */
  --chart-1: #f59e0b;
  --chart-2: #d97706;
  --chart-3: #888888;
  --chart-4: #555555;
  --chart-5: #2a2a2a;

  --radius: 0.625rem;

  /* sidebar 不會用到，但保留變數避免 shadcn 抱怨 */
  --sidebar: #161616;
  --sidebar-foreground: #ededed;
  --sidebar-primary: #f59e0b;
  --sidebar-primary-foreground: #0e0e0e;
  --sidebar-accent: #1f1f1f;
  --sidebar-accent-foreground: #f59e0b;
  --sidebar-border: #2a2a2a;
  --sidebar-ring: #f59e0b;

  /* 字型 */
  --font-sans:
    'Inter', -apple-system, BlinkMacSystemFont, 'Noto Sans TC',
    'PingFang TC', sans-serif;
  --font-mono:
    'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
}
```

把整個 `.dark { ... }` 區塊**刪掉**（不再需要切換）。

- [ ] **Step 2：替換 `@theme inline` 中的 font 變數**

在 `globals.css` 的 `@theme inline` 區塊內，找這行：
```css
--font-mono: var(--font-geist-mono);
```
換成：
```css
--font-mono: var(--font-mono);
```

`--font-sans` 那行已經是 `var(--font-sans)`，保留。

- [ ] **Step 3：在 base layer 加全域樣式**

在 `globals.css` 結尾的 `@layer base { ... }` 區塊**整個替換**成：

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  html {
    @apply font-sans;
  }
  body {
    @apply bg-background text-foreground;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  /* numeric inputs 預設用 mono */
  input[type="number"] {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
}
```

- [ ] **Step 4：在 `layout.tsx` 引入 Google Fonts**

修改 `src/app/layout.tsx`，把現有的 `<body>` 段落替換成下面這個版本（如果有 Geist 字型 import 也一併移除）：

```tsx
import { Inter, JetBrains_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-import",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-import",
  display: "swap",
});

export const metadata = {
  title: "健身教練管理",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

> **Implementation note:** Next.js `next/font/google` 會把字型 inline 進 HTML 並產生對應的 CSS 變數（`--font-sans-import`、`--font-mono-import`）。我們用 `--font-sans` / `--font-mono` 給 Tailwind，所以在 `globals.css` 的 `:root` 把 fallback 鏈往上推：

修改 globals.css 的 font 變數定義為：
```css
--font-sans:
  var(--font-sans-import), 'Inter', -apple-system, BlinkMacSystemFont,
  'Noto Sans TC', 'PingFang TC', sans-serif;
--font-mono:
  var(--font-mono-import), 'JetBrains Mono', 'SF Mono', Menlo, Consolas,
  monospace;
```

- [ ] **Step 5：跑 dev 看視覺**

```bash
npm run dev
```

打開 http://localhost:3000，全頁應該變成暗色背景、琥珀色強調。如果某些頁面看起來顏色奇怪是預期的（後面 task 修），但**字型 + 暗色背景應該全站生效**。

- [ ] **Step 6：跑 type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 7：commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat(ui): apply dark charcoal + amber theme tokens and load Inter/JetBrains Mono"
```

---

## Task 2：Nav 元件

**Files:**
- Modify: `src/components/nav.tsx`

- [ ] **Step 1：替換 Nav 整個檔**

`src/components/nav.tsx` 內容**整個替換**成：

```tsx
import Link from "next/link";

const links = [
  { href: "/students", label: "學員" },
  { href: "/exercises", label: "動作主檔" },
  { href: "/settings", label: "設定" },
];

export function Nav() {
  return (
    <nav className="border-b border-[var(--border-subtle)] bg-[var(--background)] sticky top-0 z-30">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="text-sm font-extrabold tracking-[2px] uppercase"
        >
          GYM<span className="text-amber-500 mx-0.5">·</span>COACH
        </Link>
        <div className="flex gap-6 text-sm text-zinc-400">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-amber-500"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
```

> **註：** 先不做「目前選中 link」的 active 狀態（需要 `usePathname` 變成 client component，YAGNI 先不加）。

- [ ] **Step 2：Visual sanity check**

跑 `npm run dev`，看到 nav 是暗底、`GYM·COACH` 字 + 琥珀色「·」、右側三個連結 hover 變琥珀色。

- [ ] **Step 3：commit**

```bash
git add src/components/nav.tsx
git commit -m "feat(ui): redesign Nav with charcoal + amber brand"
```

---

## Task 3：通用元件樣式 utility（給後面 task 使用）

**Files:**
- Create: `src/components/ui/metric.tsx`
- Create: `src/components/ui/badge-status.tsx`

寫兩個共用小元件，後面其他頁面直接 import。

- [ ] **Step 1：寫 Metric 元件**

`src/components/ui/metric.tsx`：

```tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: ReactNode;
  label: string;
  suffix?: string;
  className?: string;
  accent?: boolean;
}

export function Metric({ value, label, suffix, className, accent = false }: Props) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "font-extrabold tracking-tight leading-none",
            "text-4xl md:text-5xl",
            accent ? "text-amber-500" : "text-foreground"
          )}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-sm text-amber-500 font-semibold">
            {suffix}
          </span>
        )}
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
```

- [ ] **Step 2：寫 Status badge 元件**

`src/components/ui/badge-status.tsx`：

```tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "live" | "completed" | "scheduled" | "warn" | "info" | "muted";

const variants: Record<Variant, { box: string; dot: string | null; pulse: boolean }> = {
  live: {
    box: "bg-amber-500/10 border-amber-500/30 text-amber-500",
    dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
    pulse: true,
  },
  completed: {
    box: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
    dot: null,
    pulse: false,
  },
  scheduled: {
    box: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    dot: null,
    pulse: false,
  },
  warn: {
    box: "bg-amber-500/10 border-amber-500/30 text-amber-500",
    dot: null,
    pulse: false,
  },
  info: {
    box: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    dot: null,
    pulse: false,
  },
  muted: {
    box: "bg-zinc-800 border-zinc-700 text-zinc-400",
    dot: null,
    pulse: false,
  },
};

interface Props {
  variant: Variant;
  children: ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: Props) {
  const v = variants[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-[0.15em] border",
        v.box,
        className
      )}
    >
      {v.dot && (
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            v.dot,
            v.pulse && "animate-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
}
```

- [ ] **Step 3：跑 type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4：commit**

```bash
git add src/components/ui/metric.tsx src/components/ui/badge-status.tsx
git commit -m "feat(ui): add reusable Metric and StatusBadge components"
```

---

## Task 4：首頁 dashboard

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1：整個換掉 `src/app/page.tsx`**

```tsx
import Link from "next/link";
import { db } from "@/lib/db/client";
import { sessions, students, weeklyPlans } from "@/lib/db/schema";
import { eq, isNull, desc, count } from "drizzle-orm";
import { buttonVariants } from "@/components/ui/button";
import { Metric } from "@/components/ui/metric";
import { StatusBadge } from "@/components/ui/badge-status";

export default async function HomePage() {
  const inProgress = db
    .select({
      sessionId: sessions.id,
      sessionNumber: sessions.sessionNumber,
      startedAt: sessions.startedAt,
      studentName: students.name,
    })
    .from(sessions)
    .innerJoin(students, eq(sessions.studentId, students.id))
    .where(eq(sessions.status, "in_progress"))
    .orderBy(desc(sessions.startedAt))
    .all();

  const studentCount = db
    .select({ c: count() })
    .from(students)
    .where(isNull(students.deletedAt))
    .get();

  const recentPlans = db
    .select({
      id: weeklyPlans.id,
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
    <div className="container mx-auto px-6 py-10 space-y-10 max-w-6xl">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            DASHBOARD
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            今日課表
          </h1>
        </div>
      </header>

      {/* 進行中課程 */}
      <section className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold flex items-center gap-3">
            進行中課程
            {inProgress.length > 0 && (
              <StatusBadge variant="live">LIVE</StatusBadge>
            )}
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {inProgress.length} active
          </span>
        </div>

        {inProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            沒有進行中課程
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {inProgress.map((s) => (
              <li
                key={s.sessionId}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <div className="font-semibold">{s.studentName}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-0.5">
                    第 <span className="text-amber-500 font-bold">{s.sessionNumber}</span> 堂 · {s.startedAt?.slice(11, 16) ?? "?"}
                  </div>
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
      </section>

      {/* 數據區 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
          <Metric value={studentCount?.c ?? 0} label="學員數" />
        </div>
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
          <Metric value={recentPlans.length} label="最近週計劃" suffix="份" />
        </div>
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
          <Metric value={inProgress.length} label="進行中" accent />
        </div>
        <Link
          href="/students"
          className="rounded-xl border border-dashed border-border bg-transparent p-6 hover:border-amber-500 hover:text-amber-500 transition-colors flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <span className="text-2xl">+</span>
          <span className="text-xs uppercase tracking-wider font-semibold">新增學員</span>
        </Link>
      </section>

      {/* 最近週計劃 */}
      <section className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
        <h2 className="text-base font-bold mb-4">最近的週計劃</h2>
        {recentPlans.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            尚無紀錄
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {recentPlans.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{p.studentName}</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {p.startDate} → {p.endDate}
                  </span>
                </div>
                <Link
                  href={`/weekly-plans/${p.id}`}
                  className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline"
                >
                  查看 →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2：跑 dev、瀏覽 `/`**

```bash
npm run dev
```

驗證首頁有暗色背景、四格 metric、LIVE 徽章（如果有 in-progress session）、卡片邊框正確。

- [ ] **Step 3：跑 type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4：commit**

```bash
git add src/app/page.tsx
git commit -m "feat(ui): redesign home dashboard with metric cards and live status"
```

---

## Task 5：核心紀錄頁（最重要）

**Files:**
- Modify: `src/components/session-recorder.tsx`
- Modify: `src/components/set-row.tsx`
- Modify: `src/components/exercise-picker.tsx`

- [ ] **Step 1：替換 SetRow**

`src/components/set-row.tsx` **整個替換**：

```tsx
"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { updateSetLog, deleteSetLog } from "@/lib/actions/set-logs";
import type { SetLog } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface Props {
  set: SetLog;
  weightSuggestion: number | null;
  readOnly?: boolean;
}

export function SetRow({ set, weightSuggestion, readOnly = false }: Props) {
  const isInitialMount = useRef(true);
  const [local, setLocal] = useState({
    weightKg: set.weightKg ?? "",
    reps: set.reps ?? "",
    rpe: set.rpe ?? "",
    toFailure: set.toFailure,
    heartRateBpm: set.heartRateBpm ?? "",
  });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
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

  const numCls =
    "h-10 w-20 text-center font-mono font-semibold tabular-nums bg-[var(--surface-1)] border-border focus-visible:ring-2 focus-visible:ring-amber-500";

  return (
    <tr className="border-b border-[var(--border-subtle)] last:border-0">
      <td className="py-3 pr-2">
        <div className="size-9 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-amber-500 font-mono font-extrabold text-sm">
          {set.setNumber}
        </div>
      </td>
      <td className="py-3 px-2">
        <Input
          type="number"
          step="2.5"
          inputMode="decimal"
          value={local.weightKg}
          onChange={(e) => setLocal((l) => ({ ...l, weightKg: e.target.value }))}
          placeholder={
            weightSuggestion != null ? `建議 ${weightSuggestion}` : "kg"
          }
          className={numCls}
          readOnly={readOnly}
          disabled={readOnly}
        />
      </td>
      <td className="py-3 px-2">
        <Input
          type="number"
          inputMode="numeric"
          value={local.reps}
          onChange={(e) => setLocal((l) => ({ ...l, reps: e.target.value }))}
          placeholder="次"
          className={numCls}
          readOnly={readOnly}
          disabled={readOnly}
        />
      </td>
      <td className="py-3 px-2">
        <Input
          type="number"
          min="1"
          max="10"
          value={local.rpe}
          onChange={(e) => setLocal((l) => ({ ...l, rpe: e.target.value }))}
          placeholder="—"
          className={cn(numCls, local.rpe !== "" && "text-amber-500")}
          readOnly={readOnly}
          disabled={readOnly}
        />
      </td>
      <td className="py-3 px-2 text-center">
        <button
          type="button"
          onClick={() =>
            !readOnly &&
            setLocal((l) => ({ ...l, toFailure: !l.toFailure }))
          }
          disabled={readOnly}
          className={cn(
            "size-7 rounded border-2 transition-colors flex items-center justify-center",
            local.toFailure
              ? "bg-amber-500 border-amber-500 text-zinc-950"
              : "bg-[var(--surface-2)] border-border hover:border-amber-500"
          )}
          aria-label="力竭"
        >
          {local.toFailure && (
            <span className="text-xs font-extrabold leading-none">✓</span>
          )}
        </button>
      </td>
      <td className="py-3 px-2">
        <Input
          type="number"
          inputMode="numeric"
          value={local.heartRateBpm}
          onChange={(e) =>
            setLocal((l) => ({ ...l, heartRateBpm: e.target.value }))
          }
          placeholder="—"
          className={numCls}
          readOnly={readOnly}
          disabled={readOnly}
        />
      </td>
      <td className="py-3 pl-2 text-center">
        {!readOnly && (
          <button
            type="button"
            className="text-zinc-600 hover:text-rose-500 transition-colors size-8"
            disabled={pending}
            onClick={() => startTransition(() => deleteSetLog(set.id))}
            aria-label="刪除組"
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  );
}
```

- [ ] **Step 2：替換 ExercisePicker**

`src/components/exercise-picker.tsx` **整個替換**：

```tsx
"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

  const filtered = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(q.toLowerCase()) ||
      (e.nameEn ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full border-dashed h-14 text-sm uppercase tracking-wider font-semibold hover:border-amber-500 hover:text-amber-500"
      >
        + 新增動作
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-[var(--surface-2)] border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">選擇動作</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="搜尋動作名稱（中／英）…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            className="bg-[var(--surface-1)]"
          />
          <div className="space-y-1 mt-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                沒有匹配結果
              </p>
            ) : (
              filtered.map((e) => (
                <button
                  key={e.id}
                  disabled={pending}
                  className="w-full text-left p-3 rounded-md border border-border bg-transparent hover:border-amber-500 hover:bg-[var(--surface-3)] transition-colors flex justify-between items-center"
                  onClick={() => {
                    startTransition(async () => {
                      await onPick(e.id);
                      setOpen(false);
                      setQ("");
                    });
                  }}
                >
                  <span>
                    <span className="font-semibold">{e.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-2">
                      {MUSCLE_GROUP_LABEL[e.muscleGroup] ?? e.muscleGroup}
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
    </>
  );
}
```

- [ ] **Step 3：替換 SessionRecorder**

`src/components/session-recorder.tsx` **整個替換**：

```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExercisePicker } from "@/components/exercise-picker";
import { SetRow } from "@/components/set-row";
import { StatusBadge } from "@/components/ui/badge-status";
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
    weightSuggestion: number | null;
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
  const isCompleted = session.status === "completed";

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-5xl">
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {studentName}
          </h1>
          <p className="text-sm font-mono text-muted-foreground mt-1.5">
            第 <span className="text-amber-500 font-bold">{session.sessionNumber}</span> 堂 ·{" "}
            目標{" "}
            <span className="text-foreground">
              {session.targetMuscleGroups
                .map((m) => MUSCLE_GROUP_LABEL[m] ?? m)
                .join("、")}
            </span>
            {session.startedAt && (
              <>
                {" · "}
                <span className="text-muted-foreground">
                  {session.startedAt.slice(11, 16)} 開始
                </span>
              </>
            )}
          </p>
        </div>
        <StatusBadge variant={isCompleted ? "completed" : "live"}>
          {isCompleted ? "已完成" : "RECORDING"}
        </StatusBadge>
      </header>

      <div className="space-y-4">
        {exercises.map(
          ({ sessionExercise, exercise, sets, weightSuggestion }) => (
            <div
              key={sessionExercise.id}
              className="rounded-xl border border-border bg-[var(--surface-2)] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-bold">{exercise.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-[var(--surface-3)] px-2 py-0.5 rounded">
                    {MUSCLE_GROUP_LABEL[exercise.muscleGroup] ?? exercise.muscleGroup}
                  </span>
                  {weightSuggestion != null && !isCompleted && (
                    <span className="text-[11px] font-mono text-amber-500">
                      ↑ 建議 {weightSuggestion}kg
                    </span>
                  )}
                </div>
                {!isCompleted && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-rose-500 transition-colors"
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
                  </button>
                )}
              </div>

              <table className="w-full">
                <thead>
                  <tr>
                    {["組", "重量 kg", "次數", "RPE", "力竭", "心率", ""].map(
                      (h, i) => (
                        <th
                          key={i}
                          className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground text-left pb-2 px-2 first:pl-0 last:pr-0"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sets.map((s) => (
                    <SetRow
                      key={s.id}
                      set={s}
                      weightSuggestion={weightSuggestion}
                      readOnly={isCompleted}
                    />
                  ))}
                </tbody>
              </table>

              {!isCompleted && (
                <button
                  type="button"
                  className="mt-3 w-full border border-dashed border-border rounded-md py-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:border-amber-500 hover:text-amber-500 transition-colors"
                  disabled={pending}
                  onClick={() => {
                    const last = sets[sets.length - 1];
                    startTransition(async () => {
                      await createSetLog({
                        sessionExerciseId: sessionExercise.id,
                        setNumber: sets.length + 1,
                        weightKg:
                          last?.weightKg ?? weightSuggestion ?? null,
                        reps: last?.reps ?? null,
                        rpe: null,
                        toFailure: false,
                      });
                      router.refresh();
                    });
                  }}
                >
                  + 新增一組
                </button>
              )}
            </div>
          )
        )}

        {!isCompleted && (
          <ExercisePicker
            exercises={allExercises}
            onPick={async (exerciseId) => {
              await addExerciseToSession(session.id, exerciseId);
              router.refresh();
            }}
          />
        )}
      </div>

      {!isCompleted && (
        <div className="mt-10 pt-6 border-t border-[var(--border-subtle)] flex justify-end">
          <Button
            size="lg"
            className="uppercase tracking-[0.15em] font-extrabold"
            onClick={() =>
              startTransition(async () => {
                if (
                  !confirm("確定要結束這堂課嗎？結束後就不能再加 / 改紀錄。")
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

- [ ] **Step 4：跑 dev 與 type check**

```bash
npx tsc --noEmit
npm run dev
```

到一個 in-progress session，驗證：
- 頁面整體變暗色 + 琥珀色點綴
- LIVE 徽章右上角有 pulse
- 動作名 + 肌群 tag + 「↑ 建議 Xkg」並排
- 表格 thead 是大寫小字標籤
- 組數欄變圓圈 + 琥珀數字
- 力竭勾選框是大方塊
- 「新增動作 / 新增一組」是 dashed border、hover 變琥珀
- 「完成課程」按鈕是琥珀實心 + 大寫字

- [ ] **Step 5：跑全部 tests**

```bash
npm test
npm run test:e2e
```

Expected: 49 unit + 1 e2e 全綠（純樣式不會破壞測試）。

- [ ] **Step 6：commit**

```bash
git add src/components/session-recorder.tsx src/components/set-row.tsx src/components/exercise-picker.tsx
git commit -m "feat(ui): redesign session recorder, set row, and exercise picker"
```

---

## Task 6：學員相關頁面

**Files:**
- Modify: `src/app/students/page.tsx`
- Modify: `src/app/students/[id]/layout.tsx`
- Modify: `src/app/students/[id]/page.tsx`
- Modify: `src/app/students/deleted/page.tsx`

- [ ] **Step 1：學員列表頁**

替換 `src/app/students/page.tsx`：

```tsx
import Link from "next/link";
import { listActiveStudents } from "@/lib/actions/students";
import { buttonVariants } from "@/components/ui/button";
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
    <div className="container mx-auto px-6 py-10 max-w-6xl">
      <header className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            STUDENTS
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            學員
          </h1>
        </div>
        <div className="flex gap-3 items-center">
          <Link
            href="/students/deleted"
            className="text-xs text-muted-foreground hover:text-amber-500 transition-colors"
          >
            已刪除
          </Link>
          <Link
            href="/students/new"
            className={buttonVariants()}
          >
            + 新增學員
          </Link>
        </div>
      </header>

      {students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">尚無學員</p>
          <Link
            href="/students/new"
            className={buttonVariants({ variant: "outline" })}
          >
            新增第一位學員
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[var(--border-subtle)]">
                <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">姓名</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">性別</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">目標</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">每週上課</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow
                  key={s.id}
                  className="border-[var(--border-subtle)] last:border-0"
                >
                  <TableCell className="font-semibold">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.gender === "M" ? "男" : "女"}</TableCell>
                  <TableCell>
                    <span className="text-amber-500 font-mono text-sm">
                      {s.goal === "custom" ? s.customGoal : goalLabel[s.goal]}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">{s.weeklyClassCount} 次</TableCell>
                  <TableCell>
                    <Link
                      href={`/students/${s.id}`}
                      className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline"
                    >
                      查看 →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2：學員子 layout**

替換 `src/app/students/[id]/layout.tsx`：

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudent } from "@/lib/actions/students";

const subnavLinks = [
  { suffix: "", label: "總覽" },
  { suffix: "/inbody", label: "InBody" },
  { suffix: "/sessions", label: "訓練紀錄" },
  { suffix: "/weekly-plans", label: "週計劃" },
];

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const student = await getStudent(id);
  if (!student) notFound();

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <header className="flex items-end justify-between mb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            STUDENT
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            {student.name}
          </h1>
        </div>
        <Link
          href={`/students/${id}/edit`}
          className="text-xs text-muted-foreground hover:text-amber-500 transition-colors"
        >
          編輯資料 →
        </Link>
      </header>

      <nav className="flex gap-1 mt-6 mb-6 border-b border-[var(--border-subtle)]">
        {subnavLinks.map((l) => (
          <Link
            key={l.suffix}
            href={`/students/${id}${l.suffix}`}
            className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-amber-500 transition-colors border-b-2 border-transparent"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
```

> **註：** active state 需要 client component + usePathname。為了維持 RSC 純度，先用統一灰色，hover 變琥珀。如果之後想要 active highlight 再做。

- [ ] **Step 3：學員總覽頁**

替換 `src/app/students/[id]/page.tsx`：

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
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const student = await getStudent(Number(idStr));
  if (!student) notFound();

  const fields: { label: string; value: string | number | null | undefined; mono?: boolean; accent?: boolean }[] = [
    { label: "性別", value: student.gender === "M" ? "男" : "女" },
    { label: "生日", value: student.birthday ?? "—", mono: true },
    { label: "電話", value: student.phone ?? "—", mono: true },
    { label: "EMAIL", value: student.email ?? "—", mono: true },
    {
      label: "目標",
      value: student.goal === "custom" ? student.customGoal : goalLabel[student.goal],
      accent: true,
    },
    { label: "每週上課", value: `${student.weeklyClassCount} 次`, mono: true },
    { label: "每週可進健身房", value: `${student.weeklyGymCount} 次`, mono: true },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
          基本資料
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {fields.map((f) => (
            <div key={f.label} className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3 last:border-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {f.label}
              </span>
              <span
                className={`text-sm font-semibold ${f.mono ? "font-mono" : ""} ${f.accent ? "text-amber-500" : ""}`}
              >
                {f.value ?? "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {student.notes && (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            備註
          </h2>
          <p className="text-sm whitespace-pre-wrap">{student.notes}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4：已刪除學員頁**

替換 `src/app/students/deleted/page.tsx`：

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
    <div className="container mx-auto px-6 py-10 max-w-4xl">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          ARCHIVE
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          已刪除的學員
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          刪除超過 30 天的學員會在下次系統清理時永久移除（目前尚未實作自動清理）。
        </p>
      </header>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          沒有已刪除的學員
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[var(--border-subtle)]">
                <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">姓名</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">刪除時間</TableHead>
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
                  <TableRow
                    key={s.id}
                    className="border-[var(--border-subtle)] last:border-0"
                  >
                    <TableCell className="font-semibold">{s.name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {s.deletedAt}
                    </TableCell>
                    <TableCell>
                      <form action={restoreAction}>
                        <button
                          type="submit"
                          className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline"
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
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5：跑 type check + dev 視覺驗證**

```bash
npx tsc --noEmit
npm run dev
```

巡視 `/students`、`/students/[id]`、`/students/deleted`。

- [ ] **Step 6：commit**

```bash
git add src/app/students/page.tsx src/app/students/[id]/layout.tsx src/app/students/[id]/page.tsx src/app/students/deleted/page.tsx
git commit -m "feat(ui): redesign student pages with charcoal cards and amber accents"
```

---

## Task 7：InBody 與 RecommendationCard

**Files:**
- Modify: `src/components/recommendation-card.tsx`
- Modify: `src/app/students/[id]/inbody/page.tsx`
- Modify: `src/app/students/[id]/inbody/[recordId]/page.tsx`
- Modify: `src/app/students/[id]/sessions/page.tsx`
- Modify: `src/app/students/[id]/weekly-plans/page.tsx`

- [ ] **Step 1：替換 RecommendationCard**

```tsx
import type { Recommendation } from "@/lib/recommendations/basic-inbody";

const variantStyle: Record<Recommendation["severity"], string> = {
  info: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  alert: "border-rose-500/30 bg-rose-500/10 text-rose-400",
};

const severityLabel: Record<Recommendation["severity"], string> = {
  info: "INFO",
  warn: "ADVICE",
  alert: "ALERT",
};

export function RecommendationCard({ recs }: { recs: Recommendation[] }) {
  return (
    <div className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        基本建議
      </h2>
      <div className="space-y-3">
        {recs.map((r) => (
          <div
            key={r.key}
            className={`rounded-md border px-4 py-3 text-sm ${variantStyle[r.severity]}`}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 opacity-80">
              {severityLabel[r.severity]}
            </div>
            <div className="text-foreground">{r.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2：InBody 列表頁**

替換 `src/app/students/[id]/inbody/page.tsx`：

```tsx
import Link from "next/link";
import { listInBodyRecords } from "@/lib/actions/inbody";
import { buttonVariants } from "@/components/ui/button";
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
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const studentId = Number(idStr);
  const records = await listInBodyRecords(studentId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          InBody 紀錄
        </h2>
        <Link
          href={`/students/${studentId}/inbody/new`}
          className={buttonVariants()}
        >
          + 新增紀錄
        </Link>
      </div>

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          尚無紀錄
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[var(--border-subtle)]">
                {["日期", "體重 KG", "體脂 %", "骨骼肌 KG", "BMR", ""].map(
                  (h) => (
                    <TableHead
                      key={h}
                      className="text-[10px] font-bold uppercase tracking-[0.15em]"
                    >
                      {h}
                    </TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow
                  key={r.id}
                  className="border-[var(--border-subtle)] last:border-0 font-mono"
                >
                  <TableCell>{r.measuredAt}</TableCell>
                  <TableCell>{r.weightKg ?? "—"}</TableCell>
                  <TableCell>{r.bodyFatPct ?? "—"}</TableCell>
                  <TableCell>{r.skeletalMuscleKg ?? "—"}</TableCell>
                  <TableCell>{r.bmrKcal ?? "—"}</TableCell>
                  <TableCell>
                    <Link
                      href={`/students/${studentId}/inbody/${r.id}`}
                      className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline"
                    >
                      查看 →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3：InBody 詳細頁**

替換 `src/app/students/[id]/inbody/[recordId]/page.tsx`：

```tsx
import { notFound } from "next/navigation";
import { getInBodyRecord } from "@/lib/actions/inbody";
import { getStudent } from "@/lib/actions/students";
import { generateBasicRecommendations } from "@/lib/recommendations/basic-inbody";
import { RecommendationCard } from "@/components/recommendation-card";
import { getCoachSettings } from "@/lib/coach-settings";
import { Metric } from "@/components/ui/metric";

export default async function InBodyDetailPage({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}) {
  const { id: idStr, recordId: recIdStr } = await params;
  const recordId = Number(recIdStr);
  const studentId = Number(idStr);
  const [record, student] = await Promise.all([
    getInBodyRecord(recordId),
    getStudent(studentId),
  ]);
  if (!record || !student) notFound();

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

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">InBody 紀錄</h2>
        <span className="text-sm font-mono text-muted-foreground">
          {record.measuredAt}
        </span>
      </div>

      {/* 主要指標 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
          <Metric value={record.weightKg ?? "—"} label="體重 KG" />
        </div>
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
          <Metric value={record.bodyFatPct ?? "—"} label="體脂率 %" accent />
        </div>
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
          <Metric value={record.skeletalMuscleKg ?? "—"} label="骨骼肌 KG" />
        </div>
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
          <Metric value={record.bmrKcal ?? "—"} label="BMR KCAL" />
        </div>
      </div>

      {/* 其他欄位 */}
      <div className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
          其他指標
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 font-mono text-sm">
          <Field label="BMI" value={record.bmi} />
          <Field label="體脂量" value={record.bodyFatKg} unit="kg" />
          <Field label="內臟脂肪" value={record.visceralFatLevel} />
          <Field label="身體年齡" value={record.bodyAge} />
          <Field label="全身水分" value={record.totalWaterL} unit="L" />
          <Field label="蛋白質" value={record.proteinKg} unit="kg" />
        </div>

        {record.coachNotes && (
          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              教練筆記
            </div>
            <p className="text-sm">{record.coachNotes}</p>
          </div>
        )}
      </div>

      <RecommendationCard recs={recs} />
    </div>
  );
}

function Field({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null | undefined;
  unit?: string;
}) {
  return (
    <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span>
        {value ?? "—"}
        {value != null && unit && (
          <span className="text-xs text-muted-foreground ml-1">{unit}</span>
        )}
      </span>
    </div>
  );
}
```

- [ ] **Step 4：sessions 列表頁（學員子頁）**

替換 `src/app/students/[id]/sessions/page.tsx`：

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
import { StatusBadge } from "@/components/ui/badge-status";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          訓練紀錄
        </h2>
        <form action={startNew}>
          <button type="submit" className={buttonVariants()}>
            + 開始新一堂課
          </button>
        </form>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          尚無紀錄
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[var(--border-subtle)]">
                {["第幾堂", "開始時間", "目標肌群", "狀態", ""].map((h) => (
                  <TableHead
                    key={h}
                    className="text-[10px] font-bold uppercase tracking-[0.15em]"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow
                  key={s.id}
                  className="border-[var(--border-subtle)] last:border-0"
                >
                  <TableCell>
                    <span className="font-mono text-amber-500 font-bold">
                      #{s.sessionNumber}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground text-sm">
                    {s.startedAt ?? s.scheduledAt ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.targetMuscleGroups
                      .map((m) => MUSCLE_GROUP_LABEL[m] ?? m)
                      .join("、")}
                  </TableCell>
                  <TableCell>
                    {s.status === "in_progress" ? (
                      <StatusBadge variant="live">進行中</StatusBadge>
                    ) : s.status === "completed" ? (
                      <StatusBadge variant="completed">已完成</StatusBadge>
                    ) : (
                      <StatusBadge variant="scheduled">預定</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/sessions/${s.id}`}
                      className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline"
                    >
                      {s.status === "completed" ? "查看 →" : "繼續 →"}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5：weekly plans 列表頁（學員子頁）**

替換 `src/app/students/[id]/weekly-plans/page.tsx`：

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

export default async function StudentWeeklyPlansPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const studentId = Number(idStr);
  const list = await listWeeklyPlansForStudent(studentId);

  return (
    <div className="space-y-6">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        歷次週計劃
      </h2>
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          尚無紀錄。完成一堂課後系統會自動產生。
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[var(--border-subtle)]">
                {["區間", "狀態", ""].map((h) => (
                  <TableHead
                    key={h}
                    className="text-[10px] font-bold uppercase tracking-[0.15em]"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow
                  key={p.id}
                  className="border-[var(--border-subtle)] last:border-0"
                >
                  <TableCell className="font-mono">
                    {p.startDate} → {p.endDate}
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/weekly-plans/${p.id}`}
                      className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline"
                    >
                      編輯 →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6：跑 type check + visual sanity**

```bash
npx tsc --noEmit
npm run dev
```

巡視 InBody 列表 / 詳細、訓練紀錄、週計劃列表。

- [ ] **Step 7：commit**

```bash
git add src/components/recommendation-card.tsx src/app/students/[id]/inbody/ src/app/students/[id]/sessions/page.tsx src/app/students/[id]/weekly-plans/page.tsx
git commit -m "feat(ui): redesign inbody, sessions list, weekly plans list with metric cards"
```

---

## Task 8：WeeklyPlan 編輯頁

**Files:**
- Modify: `src/components/weekly-plan-editor.tsx`
- Modify: `src/components/daily-plan-editor.tsx`

- [ ] **Step 1：替換 WeeklyPlanEditor**

`src/components/weekly-plan-editor.tsx` **整個替換**：

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
import { buttonVariants } from "@/components/ui/button";
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
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-5xl">
      <header className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            WEEKLY PLAN
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            {studentName}
          </h1>
          <p className="text-sm font-mono text-muted-foreground mt-1.5">
            {plan.startDate} → {plan.endDate}
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/api/weekly-plans/${plan.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            預覽 PDF
          </a>
          <a
            href={`/api/weekly-plans/${plan.id}/pdf`}
            download
            className={buttonVariants()}
          >
            下載 PDF
          </a>
        </div>
      </header>

      <section className="rounded-xl border border-border bg-[var(--surface-2)] p-6 mb-6">
        <label
          htmlFor="overall"
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 block"
        >
          教練給整週的話 <span className="text-amber-500 normal-case tracking-normal text-xs ml-2">AI 草稿，可編輯</span>
        </label>
        <Textarea
          id="overall"
          rows={4}
          value={overallMsg}
          onChange={(e) => setOverallMsg(e.target.value)}
          placeholder="如果是空白，可能是 AI 生成失敗，請手動填寫…"
          className="bg-[var(--surface-1)] border-border resize-none"
        />
      </section>

      <Tabs defaultValue={days[0]?.date} className="space-y-4">
        <TabsList className="grid grid-cols-7 h-auto bg-[var(--surface-2)] border border-border p-1 rounded-lg gap-1">
          {days.map((d) => (
            <TabsTrigger
              key={d.id}
              value={d.date}
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 data-[state=active]:shadow-none rounded-md py-2 px-1"
            >
              <div className="flex flex-col items-center text-xs leading-tight">
                <span className="font-bold">星期{DAY_LABEL[d.dayOfWeek]}</span>
                <span className="opacity-70 font-mono text-[10px] mt-0.5">
                  {d.date.slice(5)}
                </span>
                {d.isClassDay && (
                  <span className="text-[9px] uppercase tracking-wider mt-0.5 font-bold">
                    上課
                  </span>
                )}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {days.map((d) => (
          <TabsContent key={d.id} value={d.date} className="mt-4">
            <DailyPlanEditor daily={d} />
          </TabsContent>
        ))}
      </Tabs>

      <p className="mt-8 pt-6 border-t border-[var(--border-subtle)] text-xs text-muted-foreground">
        所有變更會自動儲存
      </p>
    </div>
  );
}
```

- [ ] **Step 2：替換 DailyPlanEditor**

`src/components/daily-plan-editor.tsx` **整個替換**：

```tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
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
    <div className="space-y-6">
      {/* 運動目標 */}
      <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
        <SectionHeading>運動目標</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <NumField
            label="走路步數"
            value={local.walkingStepsTarget}
            onChange={(v) => set("walkingStepsTarget", v)}
          />
          <NumField
            label="有氧分鐘"
            value={local.cardioMinutesTarget}
            onChange={(v) => set("cardioMinutesTarget", v)}
          />
        </div>
      </div>

      {/* 飲食 */}
      <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
        <SectionHeading>飲食</SectionHeading>
        <div className="space-y-4">
          <MealField label="早餐" value={local.mealBreakfast} onChange={(v) => set("mealBreakfast", v)} />
          <MealField label="午餐" value={local.mealLunch} onChange={(v) => set("mealLunch", v)} />
          <MealField label="晚餐" value={local.mealDinner} onChange={(v) => set("mealDinner", v)} />
          <MealField label="點心" value={local.mealSnacks} onChange={(v) => set("mealSnacks", v)} />
        </div>
      </div>

      {/* 補充 */}
      <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
        <SectionHeading>水分 / 教練提醒</SectionHeading>
        <div className="space-y-4">
          <NumField
            label="水分 ml"
            value={local.waterTargetMl}
            onChange={(v) => set("waterTargetMl", v)}
          />
          <div>
            <Label>教練給今天的話</Label>
            <Textarea
              rows={3}
              value={local.coachMessage}
              onChange={(e) => set("coachMessage", e.target.value)}
              className="bg-[var(--surface-1)] border-border resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
      {children}
    </h3>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[var(--surface-1)] border-border font-mono"
      />
    </div>
  );
}

function MealField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[var(--surface-1)] border-border resize-none"
      />
    </div>
  );
}
```

- [ ] **Step 3：跑 type check + visual sanity**

```bash
npx tsc --noEmit
npm run dev
```

到一個 weekly plan，看 7 天 tabs 是否一個是琥珀色（active）、其他是 surface-2。每天的內容分成三張 card。

- [ ] **Step 4：commit**

```bash
git add src/components/weekly-plan-editor.tsx src/components/daily-plan-editor.tsx
git commit -m "feat(ui): redesign weekly plan editor with segmented tabs and grouped sections"
```

---

## Task 9：表單頁面（學員、InBody、動作、設定）

**Files:**
- Modify: `src/components/student-form.tsx`
- Modify: `src/components/inbody-form.tsx`
- Modify: `src/components/exercise-form.tsx`
- Modify: `src/components/settings-form.tsx`
- Modify: `src/app/students/new/page.tsx`
- Modify: `src/app/students/[id]/edit/page.tsx`
- Modify: `src/app/exercises/page.tsx`
- Modify: `src/app/exercises/new/page.tsx`
- Modify: `src/app/exercises/[id]/edit/page.tsx`
- Modify: `src/app/settings/page.tsx`
- Modify: `src/app/students/[id]/inbody/new/page.tsx`

> **策略：** 表單元件本身只需要把 input/textarea 統一加上 `bg-[var(--surface-1)] border-border` 樣式。包頁面則統一改 header 樣式。

- [ ] **Step 1：StudentForm 樣式調整**

修改 `src/components/student-form.tsx`：在每個 `<Input>` 與 `<Textarea>` 加入 `className="bg-[var(--surface-1)] border-border"`（如果元件已有其他 className 則合併）。將 form 容器 `className="space-y-4 max-w-xl"` 改成 `className="space-y-5 max-w-xl"`。每個 `<Label>` 後面加 `className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"`。

具體 diff：把每個欄位的結構從：
```tsx
<div>
  <Label htmlFor="name">姓名 *</Label>
  <Input id="name" {...form.register("name")} />
  ...
</div>
```
改成：
```tsx
<div>
  <Label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">姓名 *</Label>
  <Input id="name" {...form.register("name")} className="bg-[var(--surface-1)] border-border" />
  ...
</div>
```

對所有欄位（包括 birthday、phone、email、weeklyClassCount、weeklyGymCount）做同樣處理。`<Textarea>` 也加 `className="bg-[var(--surface-1)] border-border resize-none"`。Submit Button 加 `className="uppercase tracking-wider font-bold"`。

- [ ] **Step 2：InBodyForm 樣式調整**

修改 `src/components/inbody-form.tsx`：每個 `<Input>` 加 `className="bg-[var(--surface-1)] border-border font-mono"`。`<Textarea>` 加 `className="bg-[var(--surface-1)] border-border resize-none"`。`<Label>` 改 className `="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block"`。

每個 `<section>` 區塊頂部 `<h3>` 改成：
```tsx
<h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">基本</h3>
```

進階欄位摺疊 button 改成：
```tsx
<button
  type="button"
  onClick={() => setShowAdvanced((v) => !v)}
  className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline"
>
  {showAdvanced ? "▼" : "▶"} 進階欄位（部位分析、代謝細項）
</button>
```

進階區塊外框改成：
```tsx
<div className="space-y-6 pl-4 border-l-2 border-amber-500/30">
```

Submit Button 加 `className="uppercase tracking-wider font-bold"`。

- [ ] **Step 3：ExerciseForm 樣式調整**

修改 `src/components/exercise-form.tsx`：跟 StudentForm 同樣改法（每個 Input/Label 加 className，Submit Button 加 uppercase tracking）。

- [ ] **Step 4：SettingsForm 樣式調整**

修改 `src/components/settings-form.tsx`：
- 每個 `<section>` 用 Card 風格包起來（在 className 加 `rounded-xl border border-border bg-[var(--surface-2)] p-6`）
- `<h3>` 改 `className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4"`
- `<Separator />` 移除（card 已經提供視覺分隔）
- `<Input>` 加 `className="bg-[var(--surface-1)] border-border font-mono"`
- `<Textarea>` 加 `className="bg-[var(--surface-1)] border-border font-mono text-xs resize-none"`
- 在 `NumField` 子元件內把 Label className 加 `className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block"`
- Submit Button 加 `className="uppercase tracking-wider font-bold"`

- [ ] **Step 5：包這些 form 的頁面（headers）**

對下列檔案，把 page header 統一改成 `<header><p className="..."/></p><h1 className="..."/></header>` 樣式（同 Task 4 / Task 6 已用過）：

`src/app/students/new/page.tsx`：
```tsx
import { StudentForm } from "@/components/student-form";
import { createStudent } from "@/lib/actions/students";

export default function NewStudentPage() {
  return (
    <div className="container mx-auto px-6 py-10 max-w-3xl">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          NEW STUDENT
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          新增學員
        </h1>
      </header>
      <StudentForm onSubmit={createStudent} submitLabel="建立學員" />
    </div>
  );
}
```

`src/app/students/[id]/edit/page.tsx`：把 wrapper 改成（保留既有 server action 邏輯）：

```tsx
import { getStudent, updateStudent, softDeleteStudent } from "@/lib/actions/students";
import { notFound, redirect } from "next/navigation";
import { StudentForm } from "@/components/student-form";
import type { StudentInput } from "@/lib/validators/student";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const student = await getStudent(id);
  if (!student) notFound();

  async function handle(input: StudentInput) {
    "use server";
    await updateStudent(id, input);
    redirect(`/students/${id}`);
  }

  const deleteAction = async () => {
    "use server";
    await softDeleteStudent(id);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        編輯學員資料
      </h2>
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

      <form action={deleteAction} className="pt-8 border-t border-[var(--border-subtle)]">
        <button
          type="submit"
          className="text-xs uppercase tracking-wider font-semibold text-rose-500 hover:underline"
        >
          刪除這位學員（30 天內可救回）
        </button>
      </form>
    </div>
  );
}
```

`src/app/students/[id]/inbody/new/page.tsx`：
```tsx
import { getStudent } from "@/lib/actions/students";
import { createInBodyRecord } from "@/lib/actions/inbody";
import { InBodyForm } from "@/components/inbody-form";
import { notFound } from "next/navigation";

export default async function NewInBodyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const student = await getStudent(Number(idStr));
  if (!student) notFound();

  return (
    <div className="space-y-6">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        新增 InBody 紀錄
      </h2>
      <InBodyForm studentId={student.id} onSubmit={createInBodyRecord} />
    </div>
  );
}
```

`src/app/exercises/page.tsx`：把現有的 wrapper 改成：

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
    <div className="container mx-auto px-6 py-10 max-w-6xl">
      <header className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            LIBRARY
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            動作主檔
          </h1>
        </div>
        <Link href="/exercises/new" className={buttonVariants()}>
          + 新增自訂動作
        </Link>
      </header>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          尚無動作，請執行 <code className="font-mono text-amber-500">npm run db:seed</code>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[var(--border-subtle)]">
                {["名稱", "肌群", "器材", "來源", ""].map((h) => (
                  <TableHead
                    key={h}
                    className="text-[10px] font-bold uppercase tracking-[0.15em]"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((e) => (
                <TableRow
                  key={e.id}
                  className="border-[var(--border-subtle)] last:border-0"
                >
                  <TableCell className="font-semibold">{e.name}</TableCell>
                  <TableCell>
                    <span className="text-amber-500 text-sm font-semibold">
                      {MUSCLE_GROUP_LABEL[e.muscleGroup] ?? e.muscleGroup}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {e.equipment ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      {e.isCustom ? "自訂" : e.wgerId ? "wger" : "內建"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/exercises/${e.id}/edit`}
                      className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline"
                    >
                      編輯 →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

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
    <div className="container mx-auto px-6 py-10 max-w-3xl">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          NEW EXERCISE
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          新增自訂動作
        </h1>
      </header>
      <ExerciseForm onSubmit={handle} submitLabel="新增" />
    </div>
  );
}
```

`src/app/exercises/[id]/edit/page.tsx`：替換 wrapper：

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
    <div className="container mx-auto px-6 py-10 max-w-3xl">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          EDIT EXERCISE
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          {ex.name}
        </h1>
      </header>
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
      <div className="container mx-auto px-6 py-10 max-w-3xl">
        <p className="text-rose-500">
          coach_settings 尚未初始化，請執行 <code className="font-mono">npm run db:seed</code>
        </p>
      </div>
    );
  }

  async function handle(input: SettingsInput) {
    "use server";
    await updateSettings(input);
  }

  return (
    <div className="container mx-auto px-6 py-10 max-w-4xl">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          SETTINGS
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          設定
        </h1>
      </header>
      <SettingsForm defaults={settings} onSubmit={handle} />
    </div>
  );
}
```

- [ ] **Step 6：跑 type check + visual sanity**

```bash
npx tsc --noEmit
npm run dev
```

巡視所有表單頁。

- [ ] **Step 7：跑全部 tests**

```bash
npm test
npm run test:e2e
```

Expected: 49 unit + 1 e2e 全綠。e2e 用 `id="name"` 等 selector 不會壞。

- [ ] **Step 8：commit**

```bash
git add src/components/student-form.tsx src/components/inbody-form.tsx src/components/exercise-form.tsx src/components/settings-form.tsx src/app/students/new/page.tsx src/app/students/[id]/edit/page.tsx src/app/students/[id]/inbody/new/page.tsx src/app/exercises/ src/app/settings/page.tsx
git commit -m "feat(ui): redesign all form pages with consistent dark surface inputs"
```

---

## Task 10：最終巡檢與小修

**Files:**
- Modify (必要時)：任何在巡檢時發現視覺異常的檔案

- [ ] **Step 1：完整使用者流程巡視**

```bash
npm run dev
```

按以下順序開過：
1. `/` 首頁 → 看 dashboard、metric cards、live badge
2. `/students` → 列表
3. `/students/new` → 新增表單
4. 進入學員 → 總覽 / InBody / 訓練紀錄 / 週計劃 sub-nav
5. 新增 InBody → 列表 → 詳細頁（看建議卡片）
6. 開新一堂課 → session recorder（**最重要**，全頁都要看）
7. 加 2 動作、各加 3 組、填數字、勾力竭、刪一組、完成
8. 自動跳到 weekly plan editor → 看 7 天 tabs、每天三張 card
9. 預覽 PDF
10. `/exercises`、`/exercises/new`、`/exercises/{id}/edit`
11. `/settings`、改一個值、儲存
12. `/students/deleted`

任何看起來「不對勁」（顏色、邊距、字型）的地方就地修。常見問題：
- Tabs 在小螢幕擠 → 加 `min-w-0`
- 表格在小螢幕 overflow → 加 `overflow-x-auto`
- 某些 input focus ring 被 shadcn override → 改 className 加 `focus-visible:ring-amber-500`

- [ ] **Step 2：跑全部測試最後確認**

```bash
npm test
npm run test:e2e
npx tsc --noEmit
```

Expected: 49 unit + 1 e2e 全綠，tsc 無錯。

- [ ] **Step 3：commit**

```bash
git add .
git commit -m "fix(ui): final QA polish pass"
```

如果這個 step 沒有改任何檔案就跳過 commit。

---

## Slice 驗收清單

- [ ] `npm test` 49/49 + `npm run test:e2e` 1/1 全綠
- [ ] `npx tsc --noEmit` 無錯
- [ ] 全站背景為 `#0a0a0a` 或同階深色，不是白色
- [ ] 主色琥珀 `#f59e0b` 出現在：學員目標、metric 強調、active tab、primary button、focus ring
- [ ] 字型：所有頁面為 Inter（中文 fallback 系統字）；數字、ID、日期為 JetBrains Mono
- [ ] Nav 為 `GYM·COACH` 樣式
- [ ] 首頁有 metric cards 與 LIVE badge（如有 in-progress session）
- [ ] 核心紀錄頁完整套用：圓圈組數、力竭大方塊、虛線新增按鈕、recording pulse
- [ ] WeeklyPlan tabs 是 segmented + amber active
- [ ] InBody 詳細頁有 metric cards
- [ ] 表單 input/textarea 都是深底
- [ ] 預期 commits 數：8–10（task 1, 2, 3, 4, 5, 6, 7, 8, 9, 10[?]）

---

## Out of Scope（這份 plan 不做）

- Mobile RWD 微調
- Active state 對 nav links（需要 client component）
- 動畫加碼（hover scale、page transitions）
- 圖示庫（lucide-react 之類）
- InBody 折線圖（Slice 6 之外的 polish）
- PDF 樣式調整（PDF 維持文件感）
