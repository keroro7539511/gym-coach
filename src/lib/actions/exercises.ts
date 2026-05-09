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
