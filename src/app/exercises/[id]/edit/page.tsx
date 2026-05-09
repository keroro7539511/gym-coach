import { notFound, redirect } from "next/navigation";
import { ExerciseForm } from "@/components/exercise-form";
import { getExercise, updateExercise } from "@/lib/actions/exercises";
import type { ExerciseInput } from "@/lib/validators/exercise";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const ex = await getExercise(id);
  if (!ex) notFound();

  async function handle(input: ExerciseInput) {
    "use server";
    await updateExercise(id, input);
    redirect("/exercises");
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">編輯動作 — {ex.name}</h1>
      <ExerciseForm
        defaultValues={{
          name: ex.name,
          nameEn: ex.nameEn ?? undefined,
          muscleGroup: ex.muscleGroup,
          equipment: ex.equipment ?? undefined,
          demoImageUrl: ex.demoImageUrl ?? undefined,
          description: ex.description ?? undefined,
        }}
        onSubmit={handle}
        submitLabel="儲存修改"
      />
    </div>
  );
}
