import { getStudentSession } from "@/lib/auth";
import { listSessionsForStudent, getExercisePRsForStudent } from "@/lib/actions/sessions";
import { notFound } from "next/navigation";
import { ExercisePRList } from "@/components/exercise-pr-list";
import { MUSCLE_GROUP_LABEL } from "@/components/exercise-form";
import { StatusBadge } from "@/components/ui/badge-status";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default async function StudentSessionsPage() {
  const session = await getStudentSession();
  if (!session) notFound();

  const [sessions, prs] = await Promise.all([
    listSessionsForStudent(session.studentId),
    getExercisePRsForStudent(session.studentId),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">TRAINING</p>
        <h1 className="text-2xl font-extrabold tracking-tight mt-1">訓練紀錄</h1>
      </header>

      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">動作最佳紀錄</h2>
        <ExercisePRList prs={prs} />
      </section>

      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">課程紀錄</h2>
        {sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            尚無訓練紀錄
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-[var(--border-subtle)]">
                  {["堂數", "日期", "目標肌群", "狀態"].map((h) => (
                    <TableHead key={h} className="text-[10px] font-bold uppercase tracking-[0.15em]">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.filter(s => s.status === "completed").map((s) => (
                  <TableRow key={s.id} className="border-[var(--border-subtle)] last:border-0">
                    <TableCell>
                      <span className="font-mono text-amber-500 font-bold">#{s.sessionNumber}</span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {s.startedAt?.slice(0, 10) ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.targetMuscleGroups.map((m) => MUSCLE_GROUP_LABEL[m] ?? m).join("、")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant="completed">已完成</StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
