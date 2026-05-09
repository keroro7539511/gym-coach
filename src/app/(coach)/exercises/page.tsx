import Link from "next/link";
import { listExercises } from "@/lib/actions/exercises";
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

export default async function ExercisesPage() {
  const list = await listExercises();

  return (
    <div className="container mx-auto px-6 py-10 max-w-6xl">
      <header className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            LIBRARY
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            動作主檔
          </h1>
        </div>
        <Link href="/exercises/new" className={buttonVariants()}>
          + 新增自訂動作
        </Link>
      </header>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          尚無動作，請執行 <code className="font-mono text-amber-500">npm run db:seed</code>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[var(--border-subtle)]">
                {["名稱", "肌群", "器材", "來源", ""].map((h) => (
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
              {list.map((e) => (
                <TableRow
                  key={e.id}
                  className="border-[var(--border-subtle)] last:border-0"
                >
                  <TableCell className="font-semibold">{e.name}</TableCell>
                  <TableCell>
                    <span className="text-amber-500 text-sm font-semibold">
                      {MUSCLE_GROUP_LABEL[e.muscleGroup] ?? e.muscleGroup}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {e.equipment ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      {e.isCustom ? "自訂" : e.wgerId ? "wger" : "內建"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/exercises/${e.id}/edit`}
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
