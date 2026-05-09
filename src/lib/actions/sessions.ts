"use server";

import { db } from "@/lib/db/client";
import {
  sessions,
  sessionExercises,
  setLogs,
  exercises,
  students,
} from "@/lib/db/schema";
import {
  sessionStartInputSchema,
  type SessionStartInput,
} from "@/lib/validators/session";
import { eq, desc, asc, inArray, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recommendNextMuscleGroups } from "@/lib/recommendations/next-muscle-groups";
import { suggestNextWeight } from "@/lib/recommendations/weight-suggestion";

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
  const muscleGroups =
    parsed.targetMuscleGroups ??
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

  const sessionExerciseIds = exerciseRows.map((r) => r.sessionExercise.id);
  let sets: (typeof setLogs.$inferSelect)[] = [];
  if (sessionExerciseIds.length > 0) {
    sets = db
      .select()
      .from(setLogs)
      .where(inArray(setLogs.sessionExerciseId, sessionExerciseIds))
      .orderBy(asc(setLogs.sessionExerciseId), asc(setLogs.setNumber))
      .all();
  }

  // 為每個動作算重量建議（取該學員上次同動作最後一組，但排除目前 session）
  const exercisesWithSuggestion = exerciseRows.map(
    ({ sessionExercise, exercise }) => {
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
    }
  );

  return {
    session,
    exercises: exercisesWithSuggestion,
  };
}

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

/**
 * 找學員 X 上一次做動作 Y 的最後一組（最新 session 的最大 setNumber）
 * 用來推算 weight suggestion
 */
export async function getLastSetForExercise(
  studentId: number,
  exerciseId: number
): Promise<{
  weightKg: number | null;
  rpe: number | null;
  toFailure: boolean;
} | null> {
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
    .orderBy(desc(sessions.sessionNumber), desc(setLogs.setNumber))
    .limit(1)
    .get();

  return row ?? null;
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
