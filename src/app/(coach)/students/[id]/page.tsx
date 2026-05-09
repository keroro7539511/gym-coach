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
  const { id: idStr } = await params;
  const student = await getStudent(Number(idStr));
  if (!student) notFound();

  const fields: { label: string; value: string | number | null | undefined; mono?: boolean; accent?: boolean }[] = [
    { label: "性別", value: student.gender === "M" ? "男" : "女" },
    { label: "生日", value: student.birthday ?? "—", mono: true },
    { label: "電話", value: student.phone ?? "—", mono: true },
    { label: "EMAIL", value: student.email ?? "—", mono: true },
    {
      label: "目標",
      value: student.goal === "custom" ? student.customGoal : goalLabel[student.goal],
      accent: true,
    },
    { label: "每週上課", value: `${student.weeklyClassCount} 次`, mono: true },
    { label: "每週可進健身房", value: `${student.weeklyGymCount} 次`, mono: true },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
          基本資料
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {fields.map((f) => (
            <div key={f.label} className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3 last:border-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {f.label}
              </span>
              <span
                className={`text-sm font-semibold ${f.mono ? "font-mono" : ""} ${f.accent ? "text-amber-500" : ""}`}
              >
                {f.value ?? "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {student.notes && (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            備註
          </h2>
          <p className="text-sm whitespace-pre-wrap">{student.notes}</p>
        </div>
      )}
    </div>
  );
}
