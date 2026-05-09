import Link from "next/link";
import { listSessionsForStudent, startSession } from "@/lib/actions/sessions";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MUSCLE_GROUP_LABEL } from "@/components/exercise-form";

export default async function SessionsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const studentId = Number(idStr);
  const sessions = await listSessionsForStudent(studentId);

  async function startNew() {
    "use server";
    await startSession({ studentId });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">訓練紀錄</h2>
        <form action={startNew}>
          <button type="submit" className={buttonVariants()}>
            + 開始新一堂課
          </button>
        </form>
      </div>

      {sessions.length === 0 ? (
        <p className="text-muted-foreground">尚無紀錄。</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>第幾堂</TableHead>
              <TableHead>開始時間</TableHead>
              <TableHead>目標肌群</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.id}>
                <TableCell>第 {s.sessionNumber} 堂</TableCell>
                <TableCell>{s.startedAt ?? s.scheduledAt ?? "—"}</TableCell>
                <TableCell>
                  {s.targetMuscleGroups
                    .map((m) => MUSCLE_GROUP_LABEL[m] ?? m)
                    .join("、")}
                </TableCell>
                <TableCell>
                  {s.status === "in_progress"
                    ? "進行中"
                    : s.status === "completed"
                    ? "已完成"
                    : "預定"}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/sessions/${s.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    {s.status === "completed" ? "查看" : "繼續"}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
