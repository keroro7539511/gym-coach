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
import { eq, desc, asc, inArray, and } from "drizzle-orm";
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

  return {
    session,
    exercises: exerciseRows.map(({ sessionExercise, exercise }) => ({
      sessionExercise,
      exercise,
      sets: sets.filter((s) => s.sessionExerciseId === sessionExercise.id),
    })),
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
