import Link from "next/link";
import { listActiveStudents } from "@/lib/actions/students";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const goalLabel: Record<string, string> = {
  muscle_gain: "增肌",
  fat_loss: "減脂",
  fitness: "體能",
  custom: "其他",
};

export default async function StudentsPage() {
  const students = await listActiveStudents();

  return (
    <div className="container mx-auto px-6 py-10 max-w-6xl">
      <header className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            STUDENTS
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            學員
          </h1>
        </div>
        <div className="flex gap-3 items-center">
          <Link
            href="/students/deleted"
            className="text-xs text-muted-foreground hover:text-amber-500 transition-colors"
          >
            已刪除
          </Link>
          <Link
            href="/students/new"
            className={buttonVariants()}
          >
            + 新增學員
          </Link>
        </div>
      </header>

      {students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">尚無學員</p>
          <Link
            href="/students/new"
            className={buttonVariants({ variant: "outline" })}
          >
            新增第一位學員
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[var(--border-subtle)]">
                <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">姓名</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">性別</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">目標</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">每週上課</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow
                  key={s.id}
                  className="border-[var(--border-subtle)] last:border-0"
                >
                  <TableCell className="font-semibold">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.gender === "M" ? "男" : "女"}</TableCell>
                  <TableCell>
                    <span className="text-amber-500 font-mono text-sm">
                      {s.goal === "custom" ? s.customGoal : goalLabel[s.goal]}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">{s.weeklyClassCount} 次</TableCell>
                  <TableCell>
                    <Link
                      href={`/students/${s.id}`}
                      className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline"
                    >
                      查看 →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
