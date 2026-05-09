"use server";

import { db } from "@/lib/db/client";
import { inbodyRecords } from "@/lib/db/schema";
import {
  inbodyInputSchema,
  type InBodyInput,
} from "@/lib/validators/inbody";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createInBodyRecord(input: InBodyInput) {
  const parsed = inbodyInputSchema.parse(input);
  const result = db
    .insert(inbodyRecords)
    .values(parsed)
    .returning({ id: inbodyRecords.id })
    .all();

  revalidatePath(`/students/${parsed.studentId}/inbody`);
  redirect(`/students/${parsed.studentId}/inbody/${result[0].id}`);
}

export async function listInBodyRecords(studentId: number) {
  return db
    .select()
    .from(inbodyRecords)
    .where(eq(inbodyRecords.studentId, studentId))
    .orderBy(desc(inbodyRecords.measuredAt))
    .all();
}

export async function getInBodyRecord(id: number) {
  return db
    .select()
    .from(inbodyRecords)
    .where(eq(inbodyRecords.id, id))
    .get();
}
