import { notFound } from "next/navigation";
import { getPairingTokenInfo, completePairing } from "@/lib/actions/pairing";

export default async function PairPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const info = await getPairingTokenInfo(token);
  if (!info) notFound();

  async function handleSubmit(formData: FormData) {
    "use server";
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;
    if (!password || password.length < 4 || password !== confirm) return;
    await completePairing(token, password);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-extrabold tracking-[3px] uppercase text-amber-500">
            GYM · COACH
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight mt-3">
            {info.hasAccount ? "重設密碼" : "建立帳號"}
          </h1>
          <p className="text-muted-foreground mt-2">
            學員：<span className="text-foreground font-semibold">{info.studentName}</span>
          </p>
          {!info.hasAccount && (
            <p className="text-sm text-muted-foreground mt-1">
              設定你的登入密碼（至少 4 個字元）
            </p>
          )}
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              密碼
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={4}
              autoFocus
              className="w-full rounded-lg border border-border bg-[var(--surface-2)] px-4 py-3 text-sm font-mono outline-none focus:border-amber-500 transition-colors"
              placeholder="輸入密碼"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              確認密碼
            </label>
            <input
              name="confirm"
              type="password"
              required
              minLength={4}
              className="w-full rounded-lg border border-border bg-[var(--surface-2)] px-4 py-3 text-sm font-mono outline-none focus:border-amber-500 transition-colors"
              placeholder="再輸入一次"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-amber-500 text-background font-bold py-3 text-sm hover:bg-amber-400 transition-colors"
          >
            {info.hasAccount ? "重設並登入" : "建立帳號並登入"}
          </button>
        </form>
      </div>
    </div>
  );
}
