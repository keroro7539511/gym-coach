import { getStudent } from "@/lib/actions/students";
import { notFound } from "next/navigation";

const goalLabel: Record<string, string> = {
  muscle_gain: "增肌",
  fat_loss: "減脂",
  fitness: "體能",
  custom: "其他",
};

export default async function StudentOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudent(Number(id));
  if (!student) notFound();

  return (
    <div className="space-y-3">
      <Field label="性別">{student.gender === "M" ? "男" : "女"}</Field>
      <Field label="生日">{student.birthday ?? "—"}</Field>
      <Field label="電話">{student.phone ?? "—"}</Field>
      <Field label="Email">{student.email ?? "—"}</Field>
      <Field label="目標">
        {student.goal === "custom" ? student.customGoal : goalLabel[student.goal]}
      </Field>
      <Field label="每週上課">{student.weeklyClassCount} 次</Field>
      <Field label="每週可進健身房">{student.weeklyGymCount} 次</Field>
      <Field label="備註">{student.notes ?? "—"}</Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}
