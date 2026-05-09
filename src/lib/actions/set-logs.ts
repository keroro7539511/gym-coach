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
    Object.entries(input).filter(([, v]) => v !== undefined)
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
