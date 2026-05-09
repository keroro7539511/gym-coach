import { notFound } from "next/navigation";
import { getSessionWithDetails } from "@/lib/actions/sessions";
import { listExercises } from "@/lib/actions/exercises";
import { getStudent } from "@/lib/actions/students";
import { SessionRecorder } from "@/components/session-recorder";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);

  const [details, allExercises] = await Promise.all([
    getSessionWithDetails(id),
    listExercises(),
  ]);
  if (!details) notFound();

  const student = await getStudent(details.session.studentId);
  if (!student) notFound();

  return (
    <SessionRecorder
      session={details.session}
      exercises={details.exercises}
      allExercises={allExercises}
      studentName={student.name}
    />
  );
}
