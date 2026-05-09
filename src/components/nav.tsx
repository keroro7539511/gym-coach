import Link from "next/link";
import { redirect } from "next/navigation";
import { clearCoachSession, getCoachSession } from "@/lib/auth";

const links = [
  { href: "/students", label: "學員" },
  { href: "/exercises", label: "動作主檔" },
  { href: "/settings", label: "設定" },
];

async function logout() {
  "use server";
  await clearCoachSession();
  redirect("/login");
}

export async function Nav() {
  const session = await getCoachSession();

  return (
    <nav className="border-b border-[var(--border-subtle)] bg-[var(--background)] sticky top-0 z-30">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="text-sm font-extrabold tracking-[2px] uppercase"
        >
          GYM<span className="text-amber-500 mx-0.5">·</span>COACH
        </Link>
        <div className="flex items-center gap-6 text-sm text-zinc-400">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-amber-500"
            >
              {l.label}
            </Link>
          ))}
          {session && (
            <span className="text-xs text-muted-foreground border-l border-[var(--border-subtle)] pl-4">
              {session.username}
            </span>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="transition-colors hover:text-amber-500"
            >
              登出
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
