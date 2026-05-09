import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudent } from "@/lib/actions/students";
import { PairingQR } from "@/components/pairing-qr";

const subnavLinks = [
  { suffix: "", label: "總覽" },
  { suffix: "/inbody", label: "InBody" },
  { suffix: "/sessions", label: "訓練紀錄" },
  { suffix: "/weekly-plans", label: "週計劃" },
];

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const student = await getStudent(id);
  if (!student) notFound();

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <header className="flex items-end justify-between mb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            STUDENT
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            {student.name}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <PairingQR
            studentId={id}
            studentName={student.name}
            appUrl={process.env.APP_URL ?? "http://localhost:3000"}
          />
          <Link
            href={`/students/${id}/edit`}
            className="text-xs text-muted-foreground hover:text-amber-500 transition-colors"
          >
            編輯資料 →
          </Link>
        </div>
      </header>

      <nav className="flex gap-1 mt-6 mb-6 border-b border-[var(--border-subtle)]">
        {subnavLinks.map((l) => (
          <Link
            key={l.suffix}
            href={`/students/${id}${l.suffix}`}
            className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-amber-500 transition-colors border-b-2 border-transparent"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
