import Link from "next/link";
import { listSessionsForStudent, startSession, getExercisePRsForStudent } from "@/lib/actions/sessions";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge-status";
import { MUSCLE_GROUP_LABEL } from "@/components/exercise-form";
import { ExercisePRList } from "@/components/exercise-pr-list";

export default async function SessionsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const studentId = Number(idStr);
  const [sessions, prs] = await Promise.all([
    listSessionsForStudent(studentId),
    getExercisePRsForStudent(studentId),
  ]);

  async function startNew() {
    "use server";
    await startSession({ studentId });
  }

  return (
    <div className="space-y-8">
      {/* 動作 PR */}
      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
          動作最佳紀錄
        </h2>
        <ExercisePRList prs={prs} />
      </section>

      {/* 課程列表 */}
      <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          訓練紀錄
        </h2>
        <form action={startNew}>
          <button type="submit" className={buttonVariants()}>
            + 開始新一堂課
          </button>
        </form>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          尚無紀錄
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[var(--border-subtle)]">
                {["第幾堂", "開始時間", "目標肌群", "狀態", ""].map((h) => (
                  <TableHead
                    key={h}
                    className="text-[10px] font-bold uppercase tracking-[0.15em]"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow
                  key={s.id}
                  className="border-[var(--border-subtle)] last:border-0"
                >
                  <TableCell>
                    <span className="font-mono text-amber-500 font-bold">
                      #{s.sessionNumber}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground text-sm">
                    {s.startedAt ?? s.scheduledAt ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.targetMuscleGroups
                      .map((m) => MUSCLE_GROUP_LABEL[m] ?? m)
                      .join("、")}
                  </TableCell>
                  <TableCell>
                    {s.status === "in_progress" ? (
                      <StatusBadge variant="live">進行中</StatusBadge>
                    ) : s.status === "completed" ? (
                      <StatusBadge variant="completed">已完成</StatusBadge>
                    ) : (
                      <StatusBadge variant="scheduled">預定</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/sessions/${s.id}`}
                      className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline"
                    >
                      {s.status === "completed" ? "查看 →" : "繼續 →"}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      </div>
    </div>
  );
}
