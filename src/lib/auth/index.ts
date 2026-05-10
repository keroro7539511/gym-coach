import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COACH_COOKIE = "gs_coach";
const STUDENT_COOKIE = "gs_student";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 天

function getSecret() {
  const s = process.env.JWT_SECRET ?? "gym-coach-dev-secret-change-before-deploy";
  return new TextEncoder().encode(s);
}

export type CoachSession = { role: "coach"; coachId: number; username: string };
export type StudentSession = { role: "student"; studentId: number };
export type Session = CoachSession | StudentSession;

export async function signCoachToken(coachId: number, username: string): Promise<string> {
  return new SignJWT({ role: "coach", coachId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function signStudentToken(studentId: number): Promise<string> {
  return new SignJWT({ role: "student", studentId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as Session;
  } catch {
    return null;
  }
}

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

export async function setCoachSession(token: string) {
  const jar = await cookies();
  jar.set(COACH_COOKIE, token, cookieOpts);
}

export async function setStudentSession(token: string) {
  const jar = await cookies();
  jar.set(STUDENT_COOKIE, token, cookieOpts);
}

export async function clearCoachSession() {
  const jar = await cookies();
  jar.delete(COACH_COOKIE);
}

export async function clearStudentSession() {
  const jar = await cookies();
  jar.delete(STUDENT_COOKIE);
}

export async function getCoachSession(): Promise<CoachSession | null> {
  const jar = await cookies();
  const token = jar.get(COACH_COOKIE)?.value;
  if (!token) return null;
  const s = await verifyToken(token);
  return s?.role === "coach" ? s : null;
}

export async function getStudentSession(): Promise<StudentSession | null> {
  const jar = await cookies();
  const token = jar.get(STUDENT_COOKIE)?.value;
  if (!token) return null;
  const s = await verifyToken(token);
  return s?.role === "student" ? s : null;
}
