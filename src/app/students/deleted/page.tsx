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
    <div className="container mx-auto px-6 py-10 max-w-4xl">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          ARCHIVE
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          已刪除的學員
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          刪除超過 30 天的學員會在下次系統清理時永久移除（目前尚未實作自動清理）。
        </p>
      </header>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          沒有已刪除的學員
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[var(--border-subtle)]">
                <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">姓名</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">刪除時間</TableHead>
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
                  <TableRow
                    key={s.id}
                    className="border-[var(--border-subtle)] last:border-0"
                  >
                    <TableCell className="font-semibold">{s.name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {s.deletedAt}
                    </TableCell>
                    <TableCell>
                      <form action={restoreAction}>
                        <button
                          type="submit"
                          className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline"
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
        </div>
      )}
    </div>
  );
}
