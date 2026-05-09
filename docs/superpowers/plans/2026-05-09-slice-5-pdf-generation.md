# Slice 5：PDF 產生 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** 把 WeeklyPlan 渲染成 8 頁 A4 PDF（封面 + 7 天），用 `@react-pdf/renderer` 在 server side 產出，內建思源黑體支援中文。WeeklyPlan 編輯頁加上「預覽 PDF」和「下載 PDF」按鈕。

**Architecture:** PDF 由 React 元件描述。中文字型在 `public/fonts/` 內建 Noto Sans TC 並透過 `Font.register` 註冊。產出後存到 `data/pdfs/{studentId}/{weeklyPlanId}.pdf`。下載走 Next.js Route Handler。

**Tech additions:**
- `@react-pdf/renderer`
- 字型：Noto Sans TC（思源黑體繁中）— Open Font License，可商用

**Spec reference:** §7 PDF 產生

**前置依賴：** Slice 4 完成（WeeklyPlan + DailyPlan 資料、49 unit tests）

---

## Slice 5 共 4 個 Tasks

| # | Task | 重點 |
|---|------|------|
| 1 | 安裝 react-pdf + 下載字型 | 前置 |
| 2 | PDF document 元件（8 頁） | 渲染 |
| 3 | 產生 PDF 的 server action + Route Handler | 後端 |
| 4 | WeeklyPlan 編輯頁加「預覽」「下載」按鈕 | UI |

---

## Task 1：安裝 + 字型

**Files:**
- Create: `public/fonts/.gitkeep`
- Create: `scripts/download-fonts.ts`
- Modify: `package.json`（加 postinstall + 字型路徑）
- Modify: `.gitignore`（忽略 .ttf 大檔，但保留 .gitkeep）

策略：
- 字型約 8 MB，不適合 commit 到 repo
- 寫一個下載腳本（`postinstall` 自動跑，或手動 `npm run fonts`）
- 字型來源：[Google Fonts noto-tc](https://github.com/notofonts/noto-cjk)
- Fallback URL：[jsDelivr CDN](https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/TC/)

- [ ] **Step 1：安裝 @react-pdf/renderer**

```bash
npm install @react-pdf/renderer
```

- [ ] **Step 2：建立 fonts 目錄**

```bash
mkdir -p public/fonts
touch public/fonts/.gitkeep
```

- [ ] **Step 3：寫下載字型的腳本**

`scripts/download-fonts.ts`：

```ts
import { writeFile, mkdir, access } from "fs/promises";
import { constants } from "fs";
import path from "path";

const FONTS_DIR = path.join(process.cwd(), "public", "fonts");

const FONTS = [
  {
    name: "NotoSansTC-Regular.otf",
    url: "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/TC/NotoSansCJKtc-Regular.otf",
  },
  {
    name: "NotoSansTC-Bold.otf",
    url: "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/TC/NotoSansCJKtc-Bold.otf",
  },
];

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function downloadFont(url: string, dest: string) {
  console.log(`下載 ${path.basename(dest)}…`);
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buffer);
  console.log(`  → ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
}

(async () => {
  await mkdir(FONTS_DIR, { recursive: true });
  for (const f of FONTS) {
    const dest = path.join(FONTS_DIR, f.name);
    if (await exists(dest)) {
      console.log(`已存在 ${f.name}，跳過`);
      continue;
    }
    try {
      await downloadFont(f.url, dest);
    } catch (err) {
      console.error(`下載失敗：${f.name}`, err);
      console.error("PDF 中文可能會變方框。可手動下載字型放到 public/fonts/");
    }
  }
})();
```

- [ ] **Step 4：在 package.json 加 scripts**

```json
"fonts": "tsx scripts/download-fonts.ts",
"postinstall": "tsx scripts/download-fonts.ts || true"
```

> 用 `|| true` 確保字型下載失敗不會阻擋 `npm install`。

- [ ] **Step 5：更新 .gitignore**

加：
```
public/fonts/*.otf
public/fonts/*.ttf
!public/fonts/.gitkeep
```

- [ ] **Step 6：跑下載**

```bash
npm run fonts
```

Expected: `public/fonts/` 出現兩個 `.otf` 檔，總共約 18 MB。

- [ ] **Step 7：commit**

```bash
git add .
git commit -m "feat: install react-pdf and add font download script"
```

---

## Task 2：PDF document 元件

**Files:**
- Create: `src/lib/pdf/font-register.ts`（一次性註冊字型）
- Create: `src/lib/pdf/weekly-plan-document.tsx`

- [ ] **Step 1：寫字型註冊**

`src/lib/pdf/font-register.ts`：

```ts
import "server-only";
import path from "path";
import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerFonts() {
  if (registered) return;
  registered = true;
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: "NotoSansTC",
    fonts: [
      {
        src: path.join(fontsDir, "NotoSansTC-Regular.otf"),
        fontWeight: "normal",
      },
      {
        src: path.join(fontsDir, "NotoSansTC-Bold.otf"),
        fontWeight: "bold",
      },
    ],
  });
  // 預防斷詞錯誤：把中文當作每字可斷
  Font.registerHyphenationCallback((word) =>
    word.length > 1 ? Array.from(word) : [word]
  );
}
```

- [ ] **Step 2：寫 PDF document 元件**

`src/lib/pdf/weekly-plan-document.tsx`：

```tsx
import "server-only";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { registerFonts } from "./font-register";
import type {
  WeeklyPlan,
  DailyPlan,
  Student,
  InBodyRecord,
} from "@/lib/db/schema";

registerFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansTC",
    fontSize: 10,
    padding: 32,
    color: "#1a1a1a",
  },
  h1: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  h2: { fontSize: 13, fontWeight: "bold", marginTop: 12, marginBottom: 6 },
  h3: { fontSize: 11, fontWeight: "bold", marginTop: 8, marginBottom: 4 },
  muted: { color: "#666" },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 80, color: "#666" },
  value: { flex: 1 },
  card: {
    border: "1pt solid #ddd",
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  classBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    alignSelf: "flex-start",
  },
});

const DAY_LABEL = ["日", "一", "二", "三", "四", "五", "六"];

interface SessionSummary {
  exerciseName: string;
  bestSet: string;
}

interface Props {
  plan: WeeklyPlan;
  days: DailyPlan[];
  student: Student;
  latestInbody: InBodyRecord | null;
  prevInbody: InBodyRecord | null;
  sessionSummary: SessionSummary[];
}

export function WeeklyPlanDocument({
  plan,
  days,
  student,
  latestInbody,
  prevInbody,
  sessionSummary,
}: Props) {
  return (
    <Document>
      {/* 封面 / 總覽 */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>
          {student.name} · 訓練計劃
        </Text>
        <Text style={styles.muted}>
          區間 {plan.startDate} ～ {plan.endDate}
        </Text>

        <Text style={styles.h2}>本次訓練紀錄</Text>
        {sessionSummary.length === 0 ? (
          <Text style={styles.muted}>無紀錄</Text>
        ) : (
          sessionSummary.map((s, i) => (
            <Text key={i}>
              · {s.exerciseName}：{s.bestSet}
            </Text>
          ))
        )}

        <Text style={styles.h2}>教練的話</Text>
        <Text>
          {plan.coachOverallMessage || "（請手動填寫）"}
        </Text>

        {latestInbody && (
          <>
            <Text style={styles.h2}>InBody 對照</Text>
            <InBodyDelta latest={latestInbody} prev={prevInbody} />
          </>
        )}

        <Text style={styles.h2}>本週目標數字</Text>
        <Text>
          ・水分：每天 2500ml
        </Text>
        <Text>
          ・睡眠：每天 7–8 小時
        </Text>
        <Text>
          ・走路 / 有氧：見每日頁
        </Text>
      </Page>

      {/* 7 天每天一頁 */}
      {days.map((d) => (
        <Page key={d.id} size="A4" style={styles.page}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.h1}>
              {d.date} · 星期{DAY_LABEL[d.dayOfWeek]}
            </Text>
            {d.isClassDay && (
              <Text style={styles.classBadge}>上課日</Text>
            )}
          </View>

          <Text style={styles.h2}>飲食</Text>
          <View style={styles.card}>
            <Row label="早餐" value={d.mealBreakfast} />
            <Row label="午餐" value={d.mealLunch} />
            <Row label="晚餐" value={d.mealDinner} />
            <Row label="點心" value={d.mealSnacks} />
          </View>

          <Text style={styles.h2}>運動目標</Text>
          <View style={styles.card}>
            <Row
              label="走路"
              value={
                d.walkingStepsTarget
                  ? `${d.walkingStepsTarget} 步`
                  : "—"
              }
            />
            <Row
              label="有氧"
              value={
                d.cardioMinutesTarget != null
                  ? `${d.cardioMinutesTarget} 分鐘`
                  : "—"
              }
            />
          </View>

          {d.extraExercises && d.extraExercises.length > 0 && (
            <>
              <Text style={styles.h2}>補充小訓練</Text>
              <View style={styles.card}>
                {d.extraExercises.map((ex, i) => (
                  <Text key={i}>
                    · {ex.name} {ex.sets} 組 × {ex.reps} 下
                  </Text>
                ))}
              </View>
            </>
          )}

          <Text style={styles.h2}>水分 / 睡眠</Text>
          <View style={styles.card}>
            <Row
              label="水分"
              value={d.waterTargetMl ? `${d.waterTargetMl} ml` : "2500 ml"}
            />
            <Row
              label="睡眠"
              value={
                d.sleepTargetHoursMin && d.sleepTargetHoursMax
                  ? `${d.sleepTargetHoursMin}–${d.sleepTargetHoursMax} 小時`
                  : "7–8 小時"
              }
            />
          </View>

          {d.coachMessage && (
            <>
              <Text style={styles.h2}>教練提醒</Text>
              <View style={styles.card}>
                <Text>{d.coachMessage}</Text>
              </View>
            </>
          )}
        </Page>
      ))}
    </Document>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  );
}

function InBodyDelta({
  latest,
  prev,
}: {
  latest: InBodyRecord;
  prev: InBodyRecord | null;
}) {
  const fmt = (a?: number | null, b?: number | null, unit = "") => {
    if (a == null) return "—";
    if (b == null) return `${a}${unit}`;
    const d = +(a - b).toFixed(1);
    const sign = d > 0 ? "+" : "";
    return `${a}${unit}（${sign}${d}${unit}）`;
  };
  return (
    <View style={styles.card}>
      <Row label="體重" value={fmt(latest.weightKg, prev?.weightKg, "kg")} />
      <Row label="體脂率" value={fmt(latest.bodyFatPct, prev?.bodyFatPct, "%")} />
      <Row
        label="骨骼肌"
        value={fmt(latest.skeletalMuscleKg, prev?.skeletalMuscleKg, "kg")}
      />
      <Row label="BMI" value={fmt(latest.bmi, prev?.bmi)} />
      {latest.bmrKcal != null && (
        <Row label="BMR" value={`${latest.bmrKcal} kcal`} />
      )}
    </View>
  );
}
```

- [ ] **Step 3：跑 type check**

```bash
npx tsc --noEmit
```

Expected: 無錯。

- [ ] **Step 4：commit**

```bash
git add .
git commit -m "feat: pdf document component for weekly plan (8 pages)"
```

---

## Task 3：產生 PDF 的 server action + Route Handler

**Files:**
- Create: `src/lib/actions/render-pdf.ts`
- Create: `src/app/api/weekly-plans/[id]/pdf/route.ts`

- [ ] **Step 1：寫 render server action**

`src/lib/actions/render-pdf.ts`：

```ts
"use server";

import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db/client";
import {
  weeklyPlans,
  dailyPlans,
  students,
  inbodyRecords,
  sessions,
  sessionExercises,
  setLogs,
  exercises,
} from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { WeeklyPlanDocument } from "@/lib/pdf/weekly-plan-document";

const PDF_ROOT = path.join(process.cwd(), "data", "pdfs");

interface RenderResult {
  pdfPath: string;
  fileName: string;
}

export async function renderWeeklyPlanPdf(
  weeklyPlanId: number
): Promise<RenderResult> {
  const plan = db
    .select()
    .from(weeklyPlans)
    .where(eq(weeklyPlans.id, weeklyPlanId))
    .get();
  if (!plan) throw new Error("WeeklyPlan not found");

  const days = db
    .select()
    .from(dailyPlans)
    .where(eq(dailyPlans.weeklyPlanId, weeklyPlanId))
    .orderBy(asc(dailyPlans.date))
    .all();

  const student = db
    .select()
    .from(students)
    .where(eq(students.id, plan.studentId))
    .get();
  if (!student) throw new Error("Student not found");

  const inbodyList = db
    .select()
    .from(inbodyRecords)
    .where(eq(inbodyRecords.studentId, plan.studentId))
    .orderBy(desc(inbodyRecords.measuredAt))
    .limit(2)
    .all();
  const latestInbody = inbodyList[0] ?? null;
  const prevInbody = inbodyList[1] ?? null;

  // 訓練摘要：從 sourceSession 抓
  const summary = await summarizeSession(plan.sourceSessionId);

  const buffer = await renderToBuffer(
    WeeklyPlanDocument({
      plan,
      days,
      student,
      latestInbody,
      prevInbody,
      sessionSummary: summary,
    })
  );

  // 落檔
  const studentDir = path.join(PDF_ROOT, String(plan.studentId));
  await mkdir(studentDir, { recursive: true });
  const fileName = `${student.name}_${plan.startDate.replace(/-/g, "")}-${plan.endDate.replace(/-/g, "")}.pdf`;
  const fullPath = path.join(studentDir, fileName);
  await writeFile(fullPath, buffer);

  // 更新 DB
  db.update(weeklyPlans)
    .set({
      pdfPath: fullPath,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(weeklyPlans.id, weeklyPlanId))
    .run();

  revalidatePath(`/weekly-plans/${weeklyPlanId}`);

  return { pdfPath: fullPath, fileName };
}

async function summarizeSession(
  sessionId: number
): Promise<{ exerciseName: string; bestSet: string }[]> {
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

  const summary: { exerciseName: string; bestSet: string }[] = [];
  for (const [name, sets] of byExercise) {
    const last = sets[sets.length - 1];
    summary.push({
      exerciseName: name,
      bestSet: `${sets.length} 組，最後一組 ${last.weightKg ?? "?"}kg × ${last.reps ?? "?"} RPE${last.rpe ?? "?"}`,
    });
  }
  return summary;
}
```

- [ ] **Step 2：寫 API route 用於下載**

`src/app/api/weekly-plans/[id]/pdf/route.ts`：

```ts
import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { db } from "@/lib/db/client";
import { weeklyPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderWeeklyPlanPdf } from "@/lib/actions/render-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  let plan = db
    .select()
    .from(weeklyPlans)
    .where(eq(weeklyPlans.id, id))
    .get();
  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 確保 PDF 已產出（若沒有就生成）
  let needsRender = !plan.pdfPath;
  if (plan.pdfPath) {
    try {
      await stat(plan.pdfPath);
    } catch {
      needsRender = true;
    }
  }

  if (needsRender) {
    await renderWeeklyPlanPdf(id);
    plan = db
      .select()
      .from(weeklyPlans)
      .where(eq(weeklyPlans.id, id))
      .get()!;
  }

  if (!plan.pdfPath) {
    return NextResponse.json({ error: "PDF not generated" }, { status: 500 });
  }
  const buffer = await readFile(plan.pdfPath);
  const fileName = plan.pdfPath.split("/").pop() ?? "weekly-plan.pdf";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}
```

- [ ] **Step 3：跑 type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4：手動驗證 PDF 產出**

```bash
npm run dev
```

到一個有資料的 weeklyPlan，curl：

```bash
curl -L "http://localhost:3000/api/weekly-plans/1/pdf" -o /tmp/test.pdf
open /tmp/test.pdf
```

PDF 應該打開、可看到中文（不是方框）、有 8 頁。

- [ ] **Step 5：commit**

```bash
git add .
git commit -m "feat: pdf rendering server action and download route"
```

---

## Task 4：UI 加 PDF 按鈕

**Files:**
- Modify: `src/components/weekly-plan-editor.tsx`

- [ ] **Step 1：在 WeeklyPlanEditor 加按鈕區**

修改 `src/components/weekly-plan-editor.tsx`，在 `<header>` 後面、`<section>` 前面加：

```tsx
<div className="flex gap-3 mb-6">
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
```

> **註：** 「預覽」和「下載」目前都用同一個 endpoint，差別在 `download` attribute。瀏覽器預設會在新分頁顯示 PDF（預覽）；點下載按鈕則會觸發 download。如果要更精細，未來可以加 `?download=1` query。

記得 import `buttonVariants`：

```tsx
import { buttonVariants } from "@/components/ui/button";
```

- [ ] **Step 2：手動測試完整流程**

1. 進到任一 weekly plan
2. 編輯幾個欄位（讓自動存生效）
3. 點「預覽 PDF」 → 新分頁開啟，看到 PDF 內容
4. 點「下載 PDF」 → 瀏覽器下載 PDF

驗證：
- 中文字正常顯示
- 8 頁完整
- 上課日 badge 顯示
- 空欄位顯示「—」或預設值

- [ ] **Step 3：跑全部測試**

```bash
npm test
npx tsc --noEmit
```

Expected: 49 passed, tsc 無錯。

- [ ] **Step 4：commit**

```bash
git add .
git commit -m "feat: pdf preview and download buttons in weekly plan editor"
```

---

## Slice 5 驗收清單

- [ ] `npm test` 仍 49/49
- [ ] `npx tsc --noEmit` 無錯
- [ ] `public/fonts/` 有兩個 .otf 字型檔
- [ ] `npm run fonts` 可重複執行（已存在會跳過）
- [ ] PDF API endpoint 可下載 8 頁 PDF
- [ ] 中文字顯示正常（非方框）
- [ ] WeeklyPlan 編輯頁有「預覽 / 下載」兩顆按鈕
- [ ] PDF 檔案落在 `data/pdfs/{studentId}/{weeklyPlanId}.pdf`
- [ ] 4 個 commits

---

## Out of Scope（slice 5 不做）

- 動作示範圖（補充小訓練的圖片）→ Slice 6
- PDF 上 InBody 折線圖 → Slice 6
- LINE 分享 → 未來
- PDF 命名 / 路徑可設定 → 未來
