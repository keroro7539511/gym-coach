import Link from "next/link";
import { listInBodyRecords } from "@/lib/actions/inbody";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InBodyTrendChart } from "@/components/inbody-trend-chart";

export default async function InBodyListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const studentId = Number(idStr);
  const records = await listInBodyRecords(studentId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          InBody 紀錄
        </h2>
        <Link
          href={`/students/${studentId}/inbody/new`}
          className={buttonVariants()}
        >
          + 新增紀錄
        </Link>
      </div>

      <InBodyTrendChart records={records} />

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          尚無紀錄
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[var(--border-subtle)]">
                {["日期", "體重 KG", "體脂 %", "骨骼肌 KG", "BMR", ""].map(
                  (h) => (
                    <TableHead
                      key={h}
                      className="text-[10px] font-bold uppercase tracking-[0.15em]"
                    >
                      {h}
                    </TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow
                  key={r.id}
                  className="border-[var(--border-subtle)] last:border-0 font-mono"
                >
                  <TableCell>{r.measuredAt}</TableCell>
                  <TableCell>{r.weightKg ?? "—"}</TableCell>
                  <TableCell>{r.bodyFatPct ?? "—"}</TableCell>
                  <TableCell>{r.skeletalMuscleKg ?? "—"}</TableCell>
                  <TableCell>{r.bmrKcal ?? "—"}</TableCell>
                  <TableCell>
                    <Link
                      href={`/students/${studentId}/inbody/${r.id}`}
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
