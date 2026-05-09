"use server";

import { ExerciseForm } from "@/components/exercise-form";
import { createExercise } from "@/lib/actions/exercises";
import { redirect } from "next/navigation";
import type { ExerciseInput } from "@/lib/validators/exercise";

export default async function NewExercisePage() {
  async function handle(input: ExerciseInput) {
    "use server";
    await createExercise(input);
    redirect("/exercises");
  }

  return (
    <div className="container mx-auto px-6 py-10 max-w-3xl">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          NEW EXERCISE
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          新增自訂動作
        </h1>
      </header>
      <ExerciseForm onSubmit={handle} submitLabel="新增" />
    </div>
  );
}
