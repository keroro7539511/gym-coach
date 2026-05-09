import { getStudent, updateStudent } from "@/lib/actions/students";
import { notFound, redirect } from "next/navigation";
import { StudentForm } from "@/components/student-form";
import type { StudentInput } from "@/lib/validators/student";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const student = await getStudent(id);
  if (!student) notFound();

  async function handle(input: StudentInput) {
    "use server";
    await updateStudent(id, input);
    redirect(`/students/${id}`);
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">編輯學員資料</h2>
      <StudentForm
        defaultValues={{
          name: student.name,
          gender: student.gender,
          birthday: student.birthday ?? undefined,
          phone: student.phone ?? undefined,
          email: student.email ?? undefined,
          goal: student.goal,
          customGoal: student.customGoal ?? undefined,
          weeklyClassCount: student.weeklyClassCount,
          weeklyGymCount: student.weeklyGymCount,
          notes: student.notes ?? undefined,
        }}
        onSubmit={handle}
        submitLabel="儲存修改"
      />
    </div>
  );
}
