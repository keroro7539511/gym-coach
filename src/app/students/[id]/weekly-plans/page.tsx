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
import { buttonVariants } from "@/components/ui/button";

export default async function StudentWeeklyPlansPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const studentId = Number(idStr);
  const list = await listWeeklyPlansForStudent(studentId);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">歷次週計劃</h2>
      {list.length === 0 ? (
        <p className="text-muted-foreground">
          尚無紀錄。完成一堂課後系統會自動產生。
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>區間</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.startDate} – {p.endDate}
                </TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell>
                  <Link
                    href={`/weekly-plans/${p.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    編輯
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
