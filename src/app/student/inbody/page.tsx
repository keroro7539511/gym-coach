import { getStudentSession } from "@/lib/auth";
import { listInBodyRecords } from "@/lib/actions/inbody";
import { notFound } from "next/navigation";
import { InBodyTrendChart } from "@/components/inbody-trend-chart";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default async function StudentInBodyPage() {
  const session = await getStudentSession();
  if (!session) notFound();

  const records = await listInBodyRecords(session.studentId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">BODY COMPOSITION</p>
        <h1 className="text-2xl font-extrabold tracking-tight mt-1">體組成紀錄</h1>
      </header>

      <InBodyTrendChart records={records} />

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          尚無 InBody 紀錄
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[var(--border-subtle)]">
                {["日期", "體重 KG", "體脂 %", "骨骼肌 KG", "BMI"].map((h) => (
                  <TableHead key={h} className="text-[10px] font-bold uppercase tracking-[0.15em]">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id} className="border-[var(--border-subtle)] last:border-0 font-mono">
                  <TableCell>{r.measuredAt?.slice(0, 10)}</TableCell>
                  <TableCell className="text-amber-500 font-bold">{r.weightKg?.toFixed(1) ?? "—"}</TableCell>
                  <TableCell>{r.bodyFatPct?.toFixed(1) ?? "—"}</TableCell>
                  <TableCell>{r.skeletalMuscleKg?.toFixed(1) ?? "—"}</TableCell>
                  <TableCell>{r.bmi?.toFixed(1) ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
