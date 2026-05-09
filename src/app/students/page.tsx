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
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">學員列表</h1>
        <Link href="/students/new" className={buttonVariants()}>
          + 新增學員
        </Link>
      </div>

      {students.length === 0 ? (
        <p className="text-muted-foreground">尚無學員，按右上角新增。</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>性別</TableHead>
              <TableHead>目標</TableHead>
              <TableHead>每週上課</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.gender === "M" ? "男" : "女"}</TableCell>
                <TableCell>
                  {s.goal === "custom" ? s.customGoal : goalLabel[s.goal]}
                </TableCell>
                <TableCell>{s.weeklyClassCount} 次</TableCell>
                <TableCell>
                  <Link
                    href={`/students/${s.id}`}
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
