import { getStudent, updateStudent, softDeleteStudent } from "@/lib/actions/students";
import { notFound, redirect } from "next/navigation";
import { StudentForm } from "@/components/student-form";
import type { StudentInput } from "@/lib/validators/student";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const student = await getStudent(id);
  if (!student) notFound();

  async function handle(input: StudentInput) {
    "use server";
    await updateStudent(id, input);
    redirect(`/students/${id}`);
  }

  const deleteAction = async () => {
    "use server";
    await softDeleteStudent(id);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        編輯學員資料
      </h2>
      <StudentForm
        defaultValues={{
          name: student.name,
          gender: student.gender,
          birthday: student.birthday ?? undefined,
          phone: student.phone ?? undefined,
          email: student.email ?? undefined,
          goal: student.goal as ("muscle_gain" | "fat_loss" | "fitness" | "custom")[],
          customGoal: student.customGoal ?? undefined,
          weeklyClassCount: student.weeklyClassCount,
          weeklyGymCount: student.weeklyGymCount,
          dietaryRestrictions: student.dietaryRestrictions ?? undefined,
          notes: student.notes ?? undefined,
        }}
        onSubmit={handle}
        submitLabel="儲存修改"
      />

      <form action={deleteAction} className="pt-8 border-t border-[var(--border-subtle)]">
        <button
          type="submit"
          className="text-xs uppercase tracking-wider font-semibold text-rose-500 hover:underline"
        >
          刪除這位學員（30 天內可救回）
        </button>
      </form>
    </div>
  );
}
