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
