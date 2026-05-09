"use server";

import { db } from "@/lib/db/client";
import { students, studentAccounts } from "@/lib/db/schema";
import { studentInputSchema, type StudentInput } from "@/lib/validators/student";
import { eq, isNull, isNotNull, desc, asc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCoachSession } from "@/lib/auth";
import { hashPassword } from "@/lib/auth/password";

export async function createStudent(input: StudentInput) {
  const parsed = studentInputSchema.parse(input);
  const session = await getCoachSession();
  const coachId = session?.coachId ?? 1;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { initialPassword, ...studentData } = parsed;

  const result = db
    .insert(students)
    .values({
      ...studentData,
      coachId,
      email: studentData.email || null,
    })
    .returning({ id: students.id })
    .get();

  // 若有填初始密碼，同步建立學員登入帳號
  if (parsed.initialPassword) {
    const hash = await hashPassword(parsed.initialPassword);
    db.insert(studentAccounts)
      .values({ studentId: result.id, passwordHash: hash })
      .run();
  }

  revalidatePath("/students");
  redirect(`/students/${result.id}`);
}

export async function listActiveStudents() {
  const session = await getCoachSession();
  const coachId = session?.coachId ?? 1;

  return db
    .select()
    .from(students)
    .where(and(isNull(students.deletedAt), eq(students.coachId, coachId)))
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

export async function listDeletedStudents() {
  return db
    .select()
    .from(students)
    .where(isNotNull(students.deletedAt))
    .orderBy(asc(students.deletedAt))
    .all();
}

export async function restoreStudent(id: number) {
  db.update(students)
    .set({
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(students.id, id))
    .run();

  revalidatePath("/students");
  revalidatePath("/students/deleted");
}
