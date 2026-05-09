import { db } from "@/lib/db/client";
import { coachSettings, coachAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SettingsForm } from "@/components/settings-form";
import { updateSettings } from "@/lib/actions/settings";
import { getCoachSession } from "@/lib/auth";
import { hashPassword } from "@/lib/auth/password";
import { redirect } from "next/navigation";
import type { SettingsInput } from "@/lib/validators/settings";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ coachError?: string; coachSuccess?: string }>;
}) {
  const settings = db.select().from(coachSettings).limit(1).get();
  const coaches = db.select().from(coachAccounts).all();
  const session = await getCoachSession();
  const { coachError, coachSuccess } = await searchParams;

  async function handle(input: SettingsInput) {
    "use server";
    await updateSettings(input);
  }

  async function addCoach(formData: FormData) {
    "use server";
    const username = (formData.get("username") as string)?.trim();
    const displayName = (formData.get("displayName") as string)?.trim();
    const password = formData.get("password") as string;
    if (!username || !password || password.length < 4) {
      redirect("/settings?coachError=invalid");
    }
    const existing = db
      .select()
      .from(coachAccounts)
      .where(eq(coachAccounts.username, username))
      .get();
    if (existing) redirect("/settings?coachError=duplicate");

    const hash = await hashPassword(password);
    db.insert(coachAccounts)
      .values({ username, displayName: displayName || username, passwordHash: hash })
      .run();
    redirect("/settings?coachSuccess=1");
  }

  async function removeCoach(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    if (session?.coachId === id) redirect("/settings?coachError=self");
    db.delete(coachAccounts).where(eq(coachAccounts.id, id)).run();
    redirect("/settings?coachSuccess=1");
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-6 py-10 max-w-3xl">
        <p className="text-rose-500">
          coach_settings 尚未初始化，請執行 <code className="font-mono">npm run db:seed</code>
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10 max-w-4xl space-y-12">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">SETTINGS</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">設定</h1>
      </header>

      {/* 規則 / AI 設定 */}
      <SettingsForm defaults={settings} onSubmit={handle} />

      {/* 教練帳號管理 */}
      <section className="space-y-5">
        <h2 className="text-base font-bold border-b border-[var(--border-subtle)] pb-3">教練帳號管理</h2>

        {coachError === "duplicate" && (
          <p className="text-sm text-red-400">此帳號名稱已被使用</p>
        )}
        {coachError === "invalid" && (
          <p className="text-sm text-red-400">請填寫帳號並確認密碼至少 4 個字元</p>
        )}
        {coachError === "self" && (
          <p className="text-sm text-red-400">無法刪除自己的帳號</p>
        )}
        {coachSuccess && (
          <p className="text-sm text-emerald-400">操作成功</p>
        )}

        {/* 現有帳號列表 */}
        <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          {coaches.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">尚無教練帳號</p>
          ) : (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {coaches.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span className="font-semibold">{c.displayName ?? c.username}</span>
                    <span className="text-xs font-mono text-muted-foreground ml-3">@{c.username}</span>
                    {session?.coachId === c.id && (
                      <span className="ml-2 text-[10px] text-amber-500 font-bold uppercase tracking-wider">你</span>
                    )}
                  </div>
                  {session?.coachId !== c.id && (
                    <form action={removeCoach}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        刪除
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 新增教練表單 */}
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">新增教練帳號</p>
          <form action={addCoach} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">帳號</label>
              <input
                name="username"
                type="text"
                required
                placeholder="登入用帳號"
                className="w-full rounded-lg border border-border bg-[var(--surface-3)] px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">顯示名稱</label>
              <input
                name="displayName"
                type="text"
                placeholder="例：王教練（選填）"
                className="w-full rounded-lg border border-border bg-[var(--surface-3)] px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">初始密碼</label>
              <input
                name="password"
                type="password"
                required
                minLength={4}
                placeholder="至少 4 個字元"
                className="w-full rounded-lg border border-border bg-[var(--surface-3)] px-3 py-2.5 text-sm font-mono outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="rounded-lg bg-amber-500 text-background font-bold px-6 py-2.5 text-sm hover:bg-amber-400 transition-colors"
              >
                新增教練
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
