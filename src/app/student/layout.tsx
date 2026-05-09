import Link from "next/link";
import { redirect } from "next/navigation";
import { clearStudentSession, getStudentSession } from "@/lib/auth";

async function logout() {
  "use server";
  await clearStudentSession();
  redirect("/login");
}

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getStudentSession();

  return (
    <>
      <nav className="border-b border-[var(--border-subtle)] bg-[var(--background)] sticky top-0 z-30">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <span className="text-sm font-extrabold tracking-[2px] uppercase">
            GYM<span className="text-amber-500 mx-0.5">·</span>COACH
          </span>
          <div className="flex items-center gap-5 text-sm text-zinc-400">
            {session && (
              <>
                <Link href="/student" className="hover:text-amber-500 transition-colors">總覽</Link>
                <Link href="/student/inbody" className="hover:text-amber-500 transition-colors">InBody</Link>
                <Link href="/student/sessions" className="hover:text-amber-500 transition-colors">訓練</Link>
                <Link href="/student/plan" className="hover:text-amber-500 transition-colors">週計劃</Link>
                <form action={logout}>
                  <button type="submit" className="hover:text-amber-500 transition-colors">登出</button>
                </form>
              </>
            )}
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </>
  );
}
