import { listDeletedStudents, restoreStudent } from "@/lib/actions/students";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DeletedStudentsPage() {
  const list = await listDeletedStudents();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">已刪除的學員</h1>
      <p className="text-sm text-muted-foreground mb-4">
        刪除超過 30 天的學員會在下次系統清理時永久移除（目前尚未實作自動清理）。
      </p>

      {list.length === 0 ? (
        <p className="text-muted-foreground">沒有已刪除的學員。</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>刪除時間</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((s) => {
              const restoreAction = async () => {
                "use server";
                await restoreStudent(s.id);
              };
              return (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.deletedAt}</TableCell>
                  <TableCell>
                    <form action={restoreAction}>
                      <button
                        type="submit"
                        className="text-sm text-primary hover:underline"
                      >
                        救回
                      </button>
                    </form>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
