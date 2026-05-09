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
    <div className="container mx-auto px-6 py-10 max-w-3xl">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          EDIT EXERCISE
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          {ex.name}
        </h1>
      </header>
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
