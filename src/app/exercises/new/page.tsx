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
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">新增自訂動作</h1>
      <ExerciseForm onSubmit={handle} submitLabel="新增" />
    </div>
  );
}
