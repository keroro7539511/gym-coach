import Link from "next/link";
import { db } from "@/lib/db/client";
import { sessions, students, weeklyPlans } from "@/lib/db/schema";
import { eq, isNull, desc, count } from "drizzle-orm";
import { buttonVariants } from "@/components/ui/button";
import { Metric } from "@/components/ui/metric";
import { StatusBadge } from "@/components/ui/badge-status";

export default async function HomePage() {
  const inProgress = db
    .select({
      sessionId: sessions.id,
      sessionNumber: sessions.sessionNumber,
      startedAt: sessions.startedAt,
      studentName: students.name,
    })
    .from(sessions)
    .innerJoin(students, eq(sessions.studentId, students.id))
    .where(eq(sessions.status, "in_progress"))
    .orderBy(desc(sessions.startedAt))
    .all();

  const studentCount = db
    .select({ c: count() })
    .from(students)
    .where(isNull(students.deletedAt))
    .get();

  const recentPlans = db
    .select({
      id: weeklyPlans.id,
      studentName: students.name,
      startDate: weeklyPlans.startDate,
      endDate: weeklyPlans.endDate,
    })
    .from(weeklyPlans)
    .innerJoin(students, eq(weeklyPlans.studentId, students.id))
    .orderBy(desc(weeklyPlans.generatedAt))
    .limit(5)
    .all();

  return (
    <div className="container mx-auto px-6 py-10 space-y-10 max-w-6xl">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            DASHBOARD
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            今日課表
          </h1>
        </div>
      </header>

      {/* 進行中課程 */}
      <section className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold flex items-center gap-3">
            進行中課程
            {inProgress.length > 0 && (
              <StatusBadge variant="live">LIVE</StatusBadge>
            )}
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {inProgress.length} active
          </span>
        </div>

        {inProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            沒有進行中課程
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {inProgress.map((s) => (
              <li
                key={s.sessionId}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <div className="font-semibold">{s.studentName}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-0.5">
                    第 <span className="text-amber-500 font-bold">{s.sessionNumber}</span> 堂 · {s.startedAt?.slice(11, 16) ?? "?"}
                  </div>
                </div>
                <Link
                  href={`/sessions/${s.sessionId}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  繼續紀錄
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 數據區 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
          <Metric value={studentCount?.c ?? 0} label="學員數" />
        </div>
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
          <Metric value={recentPlans.length} label="最近週計劃" suffix="份" />
        </div>
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
          <Metric value={inProgress.length} label="進行中" accent />
        </div>
        <Link
          href="/students"
          className="rounded-xl border border-dashed border-border bg-transparent p-6 hover:border-amber-500 hover:text-amber-500 transition-colors flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <span className="text-2xl">+</span>
          <span className="text-xs uppercase tracking-wider font-semibold">新增學員</span>
        </Link>
      </section>

      {/* 最近週計劃 */}
      <section className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
        <h2 className="text-base font-bold mb-4">最近的週計劃</h2>
        {recentPlans.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            尚無紀錄
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {recentPlans.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{p.studentName}</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {p.startDate} → {p.endDate}
                  </span>
                </div>
                <Link
                  href={`/weekly-plans/${p.id}`}
                  className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline"
                >
                  查看 →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
