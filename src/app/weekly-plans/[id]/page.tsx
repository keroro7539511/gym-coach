import { notFound } from "next/navigation";
import { getWeeklyPlanWithDays } from "@/lib/actions/weekly-plans";
import { getStudent } from "@/lib/actions/students";
import { WeeklyPlanEditor } from "@/components/weekly-plan-editor";

export default async function WeeklyPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const data = await getWeeklyPlanWithDays(id);
  if (!data) notFound();
  const student = await getStudent(data.plan.studentId);
  if (!student) notFound();

  return (
    <WeeklyPlanEditor
      plan={data.plan}
      days={data.days}
      studentName={student.name}
    />
  );
}
