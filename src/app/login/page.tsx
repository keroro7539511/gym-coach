import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { coachAccounts, students, studentAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import {
  signCoachToken, setCoachSession, getCoachSession,
  signStudentToken, setStudentSession, getStudentSession,
} from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string }>;
}) {
  const [coachSession, studentSession] = await Promise.all([
    getCoachSession(),
    getStudentSession(),
  ]);
  if (coachSession) redirect("/");
  if (studentSession) redirect("/student");

  const { tab, error } = await searchParams;
  const isCoachTab = tab === "coach";

  const coachCount = db.select().from(coachAccounts).all().length;
  const isFirstCoach = coachCount === 0;

  // ── Server Actions ────────────────────────────────────

  async function coachLogin(formData: FormData) {
    "use server";
    const username = (formData.get("username") as string)?.trim();
    const password = formData.get("password") as string;
    if (!username || !password) redirect("/login?tab=coach&error=1");

    const account = db
      .select()
      .from(coachAccounts)
      .where(eq(coachAccounts.username, username))
      .get();
    if (!account) redirect("/login?tab=coach&error=1");

    const ok = await verifyPassword(password, account.passwordHash);
    if (!ok) redirect("/login?tab=coach&error=1");

    const token = await signCoachToken(account.id, account.username);
    await setCoachSession(token);
    redirect("/");
  }

  async function createFirstCoach(formData: FormData) {
    "use server";
    const username = (formData.get("username") as string)?.trim();
    const displayName = (formData.get("displayName") as string)?.trim();
    const password = formData.get("password") as string;
    if (!username || !password || password.length < 4) redirect("/login?tab=coach&error=1");

    const existing = db
      .select()
      .from(coachAccounts)
      .where(eq(coachAccounts.username, username))
      .get();
    if (existing) redirect("/login?tab=coach&error=2");

    const hash = await hashPassword(password);
    const result = db
      .insert(coachAccounts)
      .values({ username, displayName: displayName || username, passwordHash: hash })
      .returning({ id: coachAccounts.id })
      .get();

    const token = await signCoachToken(result.id, username);
    await setCoachSession(token);
    redirect("/");
  }

  async function studentLogin(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string)?.trim();
    const password = formData.get("password") as string;
    if (!name || !password) redirect("/login?error=1");

    const student = db.select().from(students).where(eq(students.name, name)).get();
    if (!student) redirect("/login?error=1");

    const account = db
      .select()
      .from(studentAccounts)
      .where(eq(studentAccounts.studentId, student.id))
      .get();
    if (!account) redirect("/login?error=1");

    const ok = await verifyPassword(password, account.passwordHash);
    if (!ok) redirect("/login?error=1");

    db.update(studentAccounts)
      .set({ lastLoginAt: new Date().toISOString() })
      .where(eq(studentAccounts.studentId, student.id))
      .run();

    const jwt = await signStudentToken(student.id);
    await setStudentSession(jwt);
    redirect("/student");
  }

  const errorMsg = error === "2"
    ? "此帳號名稱已被使用"
    : isCoachTab
      ? "帳號或密碼錯誤"
      : "姓名或密碼錯誤";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">

        {/* 品牌 */}
        <div className="mb-8 text-center">
          <p className="text-sm font-extrabold tracking-[3px] uppercase text-amber-500">
            GYM · COACH
          </p>
          <p className="text-xs text-muted-foreground mt-2">健身教練管理系統</p>
        </div>

        {/* Tab */}
        <div className="flex rounded-lg border border-border bg-[var(--surface-2)] p-1 mb-6">
          <Link
            href="/login"
            className={`flex-1 rounded-md py-2 text-center text-sm font-semibold transition-colors ${
              !isCoachTab
                ? "bg-amber-500 text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            學員登入
          </Link>
          <Link
            href="/login?tab=coach"
            className={`flex-1 rounded-md py-2 text-center text-sm font-semibold transition-colors ${
              isCoachTab
                ? "bg-amber-500 text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            教練登入
          </Link>
        </div>

        {/* 錯誤 */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 mb-4">
            {errorMsg}
          </div>
        )}

        {/* ── 學員表單 ── */}
        {!isCoachTab && (
          <form action={studentLogin} className="space-y-4">
            <Field name="name" label="姓名" type="text" placeholder="輸入你的姓名" autoFocus />
            <Field name="password" label="密碼" type="password" placeholder="輸入密碼" />
            <SubmitBtn>登入</SubmitBtn>
          </form>
        )}

        {/* ── 教練表單（首次建立）── */}
        {isCoachTab && isFirstCoach && (
          <>
            <p className="text-sm text-muted-foreground text-center mb-4">
              尚無教練帳號，請建立第一個帳號
            </p>
            <form action={createFirstCoach} className="space-y-4">
              <Field name="username" label="帳號" type="text" placeholder="設定帳號名稱" autoFocus />
              <Field name="displayName" label="顯示名稱（選填）" type="text" placeholder="例：王教練" />
              <Field name="password" label="密碼" type="password" placeholder="至少 4 個字元" />
              <SubmitBtn>建立帳號並登入</SubmitBtn>
            </form>
          </>
        )}

        {/* ── 教練表單（登入）── */}
        {isCoachTab && !isFirstCoach && (
          <form action={coachLogin} className="space-y-4">
            <Field name="username" label="帳號" type="text" placeholder="輸入帳號" autoFocus />
            <Field name="password" label="密碼" type="password" placeholder="輸入密碼" />
            <SubmitBtn>登入</SubmitBtn>
          </form>
        )}

      </div>
    </div>
  );
}

// ── 共用小元件 ────────────────────────────────────────

function Field({
  name, label, type, placeholder, autoFocus,
}: {
  name: string; label: string; type: string; placeholder: string; autoFocus?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-border bg-[var(--surface-3)] px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors"
        placeholder={placeholder}
      />
    </div>
  );
}

function SubmitBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="w-full rounded-lg bg-amber-500 text-background font-bold py-3 text-sm hover:bg-amber-400 transition-colors"
    >
      {children}
    </button>
  );
}
