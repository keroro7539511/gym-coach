"use server";

import { db } from "@/lib/db/client";
import { pairingTokens, studentAccounts, students } from "@/lib/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { signStudentToken, setStudentSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createPairingToken(studentId: number): Promise<string> {
  // 讓舊 token 作廢
  const existing = db
    .select()
    .from(pairingTokens)
    .where(
      and(eq(pairingTokens.studentId, studentId), isNull(pairingTokens.usedAt))
    )
    .all();

  // 刪除未使用的舊 token
  for (const t of existing) {
    db.delete(pairingTokens).where(eq(pairingTokens.id, t.id)).run();
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  db.insert(pairingTokens).values({ studentId, token, expiresAt }).run();
  return token;
}

export type PairingTokenInfo = {
  studentId: number;
  studentName: string;
  hasAccount: boolean;
};

export async function getPairingTokenInfo(token: string): Promise<PairingTokenInfo | null> {
  const now = new Date().toISOString();
  const row = db
    .select({
      studentId: pairingTokens.studentId,
      studentName: students.name,
      usedAt: pairingTokens.usedAt,
      expiresAt: pairingTokens.expiresAt,
    })
    .from(pairingTokens)
    .innerJoin(students, eq(pairingTokens.studentId, students.id))
    .where(eq(pairingTokens.token, token))
    .get();

  if (!row) return null;
  if (row.usedAt) return null;
  if (row.expiresAt < now) return null;

  const account = db
    .select()
    .from(studentAccounts)
    .where(eq(studentAccounts.studentId, row.studentId))
    .get();

  return {
    studentId: row.studentId,
    studentName: row.studentName,
    hasAccount: !!account,
  };
}

export async function completePairing(token: string, password: string) {
  const info = await getPairingTokenInfo(token);
  if (!info) redirect("/pair/invalid");

  const hash = await hashPassword(password);

  const existing = db
    .select()
    .from(studentAccounts)
    .where(eq(studentAccounts.studentId, info.studentId))
    .get();

  if (existing) {
    db.update(studentAccounts)
      .set({ passwordHash: hash })
      .where(eq(studentAccounts.studentId, info.studentId))
      .run();
  } else {
    db.insert(studentAccounts)
      .values({ studentId: info.studentId, passwordHash: hash })
      .run();
  }

  // 標記 token 已使用
  db.update(pairingTokens)
    .set({ usedAt: new Date().toISOString() })
    .where(eq(pairingTokens.token, token))
    .run();

  // 自動登入
  const jwt = await signStudentToken(info.studentId);
  await setStudentSession(jwt);
  redirect("/student");
}
