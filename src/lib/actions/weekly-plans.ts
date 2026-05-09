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
import { eq, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { recommendDailyActivity } from "@/lib/recommendations/daily-activity";
import {
  generateFullWeeklyPlan,
  type DaySpec,
} from "@/lib/ai/generate-full-weekly-plan";
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
  const sessionDate = (
    session.endedAt ?? session.startedAt ?? new Date().toISOString()
  ).slice(0, 10);
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

  // 組成 dailyPlans 結構（含上課日標記）
  const daySpecs: DaySpec[] = days.map((d) => ({
    date: d.date,
    dayOfWeek: d.dayOfWeek,
    isClassDay: simulateClassDay(d.dayOfWeek, student.weeklyClassCount),
  }));

  // AI 呼叫
  const aiResult = await generateFullWeeklyPlan({
    geminiApiKey: settings.geminiApiKey,
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

  // 註：故意不在這裡呼叫 revalidatePath，因為這個 function 通常從
  // page render 觸發（/sessions/[id]/done），而 Next 16 不允許在 render
  // 期間呼叫 revalidatePath。後續編輯流程會在各自的 mutation 中觸發 revalidate。

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

function summarizeInbodyDelta(
  latest?: typeof inbodyRecords.$inferSelect,
  prev?: typeof inbodyRecords.$inferSelect
): string {
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
export async function regenerateWeeklyPlanAI(
  weeklyPlanId: number
): Promise<{ ok: boolean; error?: string }> {
  const wp = db
    .select()
    .from(weeklyPlans)
    .where(eq(weeklyPlans.id, weeklyPlanId))
    .get();
  if (!wp) return { ok: false, error: "週計劃不存在" };

  const student = db
    .select()
    .from(students)
    .where(eq(students.id, wp.studentId))
    .get();
  if (!student) return { ok: false, error: "找不到學員" };

  const settings = getCoachSettings();

  // 取得現有 dailyPlans 的日期/星期資訊
  const existingDays = db
    .select()
    .from(dailyPlans)
    .where(eq(dailyPlans.weeklyPlanId, weeklyPlanId))
    .orderBy(asc(dailyPlans.date))
    .all();

  const daySpecs: DaySpec[] = existingDays.map((d) => ({
    date: d.date,
    dayOfWeek: d.dayOfWeek,
    isClassDay: d.isClassDay,
  }));

  const recentInbody = db
    .select()
    .from(inbodyRecords)
    .where(eq(inbodyRecords.studentId, student.id))
    .orderBy(desc(inbodyRecords.measuredAt))
    .limit(2)
    .all();
  const latestInbody = recentInbody[0];
  const prevInbody = recentInbody[1];

  const aiResult = await generateFullWeeklyPlan({
    geminiApiKey: settings.geminiApiKey,
    student: {
      gender: student.gender,
      age: student.birthday
        ? new Date().getFullYear() - new Date(student.birthday).getFullYear()
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
    sessionSummary: await summarizeSession(wp.sourceSessionId),
    inbodyDelta: summarizeInbodyDelta(latestInbody, prevInbody),
    startDate: wp.startDate,
    daySpecs,
    promptTemplate: settings.aiDietPromptTemplate ?? "",
  });

  if (aiResult.source === "fallback") {
    return { ok: false, error: aiResult.error ?? "AI 生成失敗" };
  }

  // 更新整週訊息
  db.update(weeklyPlans)
    .set({
      coachOverallMessage: aiResult.data.overallMessage || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(weeklyPlans.id, weeklyPlanId))
    .run();

  // 更新每日計劃（飲食、水分、有氧、訓練建議）
  for (const aiDay of aiResult.data.days) {
    const dp = existingDays.find((d) => d.date === aiDay.date);
    if (!dp) continue;
    db.update(dailyPlans)
      .set({
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
        updatedAt: new Date().toISOString(),
      })
      .where(eq(dailyPlans.id, dp.id))
      .run();
  }

  revalidatePath(`/weekly-plans/${weeklyPlanId}`);
  return { ok: true };
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
    Object.entries(patch).filter(([, v]) => v !== undefined)
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
