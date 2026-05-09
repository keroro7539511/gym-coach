import Link from "next/link";
import { listWeeklyPlansForStudent } from "@/lib/actions/weekly-plans";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function StudentWeeklyPlansPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const studentId = Number(idStr);
  const list = await listWeeklyPlansForStudent(studentId);

  return (
    <div className="space-y-6">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        歷次週計劃
      </h2>
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          尚無紀錄。完成一堂課後系統會自動產生。
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[var(--border-subtle)]">
                {["區間", "狀態", ""].map((h) => (
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
              {list.map((p) => (
                <TableRow
                  key={p.id}
                  className="border-[var(--border-subtle)] last:border-0"
                >
                  <TableCell className="font-mono">
                    {p.startDate} → {p.endDate}
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/weekly-plans/${p.id}`}
                      className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline"
                    >
                      編輯 →
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
