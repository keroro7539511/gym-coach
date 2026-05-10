import { getStudentSession } from "@/lib/auth";
import { getStudent } from "@/lib/actions/students";
import { listInBodyRecords } from "@/lib/actions/inbody";
import { getExercisePRsForStudent } from "@/lib/actions/sessions";
import { notFound } from "next/navigation";
import { InBodyTrendChart } from "@/components/inbody-trend-chart";
import { ExercisePRList } from "@/components/exercise-pr-list";
import Link from "next/link";

export default async function StudentDashboardPage() {
  const session = await getStudentSession();
  if (!session) notFound();

  const [student, records, prs] = await Promise.all([
    getStudent(session.studentId),
    listInBodyRecords(session.studentId),
    getExercisePRsForStudent(session.studentId),
  ]);
  if (!student) notFound();

  const goalLabel: Record<string, string> = {
    muscle_gain: "增肌",
    fat_loss: "減脂",
    fitness: "體能",
    custom: "自訂",
  };

  const latestInbody = records[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">MY PROFILE</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">{student.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          目標：<span className="text-amber-500 font-semibold">
            {(Array.isArray(student.goal) ? student.goal : [student.goal])
              .map((g) => g === "custom" ? (student.customGoal || "其他") : goalLabel[g])
              .join(" + ")}
          </span>
        </p>
      </header>

      {/* 最新 InBody 快覽 */}
      {latestInbody && (
        <section className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">最新體組成</h2>
            <span className="text-xs font-mono text-muted-foreground">{latestInbody.measuredAt?.slice(0, 10)}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "體重", value: latestInbody.weightKg, unit: "kg" },
              { label: "體脂率", value: latestInbody.bodyFatPct, unit: "%" },
              { label: "骨骼肌", value: latestInbody.skeletalMuscleKg, unit: "kg" },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-2xl font-bold font-mono text-amber-500">
                  {m.value?.toFixed(1) ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{m.label} {m.unit}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* InBody 趨勢 */}
      {records.length >= 2 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">體組成趨勢</h2>
            <Link href="/student/inbody" className="text-xs text-amber-500 hover:underline">查看全部 →</Link>
          </div>
          <InBodyTrendChart records={records} />
        </section>
      )}

      {/* 動作 PR */}
      {prs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">動作最佳紀錄</h2>
            <Link href="/student/sessions" className="text-xs text-amber-500 hover:underline">查看全部 →</Link>
          </div>
          <ExercisePRList prs={prs.slice(0, 6)} />
        </section>
      )}
    </div>
  );
}
