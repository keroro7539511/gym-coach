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
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">動作主檔</h1>
        <Link href="/exercises/new" className={buttonVariants()}>
          + 新增自訂動作
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="text-muted-foreground">
          尚無動作，請執行 `npm run db:seed` 載入預設清單。
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名稱</TableHead>
              <TableHead>肌群</TableHead>
              <TableHead>器材</TableHead>
              <TableHead>來源</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell>
                  {MUSCLE_GROUP_LABEL[e.muscleGroup] ?? e.muscleGroup}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {e.equipment ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {e.isCustom ? "自訂" : e.wgerId ? "wger" : "內建"}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/exercises/${e.id}/edit`}
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
