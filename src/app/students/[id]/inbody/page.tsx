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

export default async function InBodyListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);
  const records = await listInBodyRecords(studentId);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">InBody 紀錄</h2>
        <Link
          href={`/students/${studentId}/inbody/new`}
          className={buttonVariants()}
        >
          + 新增紀錄
        </Link>
      </div>

      {records.length === 0 ? (
        <p className="text-muted-foreground">尚無紀錄。</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>體重</TableHead>
              <TableHead>體脂率</TableHead>
              <TableHead>骨骼肌</TableHead>
              <TableHead>BMR</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.measuredAt}</TableCell>
                <TableCell>{r.weightKg ?? "—"}</TableCell>
                <TableCell>{r.bodyFatPct ?? "—"}</TableCell>
                <TableCell>{r.skeletalMuscleKg ?? "—"}</TableCell>
                <TableCell>{r.bmrKcal ?? "—"}</TableCell>
                <TableCell>
                  <Link
                    href={`/students/${studentId}/inbody/${r.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    查看
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
