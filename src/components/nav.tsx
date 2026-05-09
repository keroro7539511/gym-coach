import Link from "next/link";

const links = [
  { href: "/students", label: "學員" },
  { href: "/exercises", label: "動作主檔" },
  { href: "/settings", label: "設定" },
];

export function Nav() {
  return (
    <nav className="border-b border-[var(--border-subtle)] bg-[var(--background)] sticky top-0 z-30">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="text-sm font-extrabold tracking-[2px] uppercase"
        >
          GYM<span className="text-amber-500 mx-0.5">·</span>COACH
        </Link>
        <div className="flex gap-6 text-sm text-zinc-400">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-amber-500"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
