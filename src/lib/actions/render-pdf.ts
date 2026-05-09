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
