import { notFound } from "next/navigation";
import { getInBodyRecord } from "@/lib/actions/inbody";
import { getStudent } from "@/lib/actions/students";
import { generateBasicRecommendations } from "@/lib/recommendations/basic-inbody";
import { RecommendationCard } from "@/components/recommendation-card";
import { getCoachSettings } from "@/lib/coach-settings";

export default async function InBodyDetailPage({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}) {
  const { id, recordId: recordIdParam } = await params;
  const recordId = Number(recordIdParam);
  const studentId = Number(id);
  const [record, student] = await Promise.all([
    getInBodyRecord(recordId),
    getStudent(studentId),
  ]);
  if (!record || !student) notFound();

  const settings = getCoachSettings();
  const recs = generateBasicRecommendations({
    gender: student.gender,
    goal: student.goal,
    inbody: {
      weightKg: record.weightKg,
      bodyFatPct: record.bodyFatPct,
      bmrKcal: record.bmrKcal,
      visceralFatLevel: record.visceralFatLevel,
    },
    bodyFatWarnMale: settings.bodyFatWarnMale,
    bodyFatWarnFemale: settings.bodyFatWarnFemale,
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-2">
          InBody 紀錄 · {record.measuredAt}
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Field label="體重">{fmt(record.weightKg, "kg")}</Field>
          <Field label="體脂率">{fmt(record.bodyFatPct, "%")}</Field>
          <Field label="骨骼肌量">{fmt(record.skeletalMuscleKg, "kg")}</Field>
          <Field label="體脂量">{fmt(record.bodyFatKg, "kg")}</Field>
          <Field label="BMI">{fmt(record.bmi)}</Field>
          <Field label="BMR">{fmt(record.bmrKcal, "kcal")}</Field>
          <Field label="內臟脂肪等級">{fmt(record.visceralFatLevel)}</Field>
          <Field label="身體年齡">{fmt(record.bodyAge)}</Field>
          <Field label="全身水分">{fmt(record.totalWaterL, "L")}</Field>
          <Field label="蛋白質">{fmt(record.proteinKg, "kg")}</Field>
        </div>
        {record.coachNotes && (
          <div className="mt-4 text-sm">
            <span className="text-muted-foreground">教練筆記：</span>
            {record.coachNotes}
          </div>
        )}
      </div>

      <RecommendationCard recs={recs} />
    </div>
  );
}

function fmt(v: number | null | undefined, unit?: string) {
  if (v == null) return "—";
  return unit ? `${v} ${unit}` : `${v}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}：</span>
      <span>{children}</span>
    </div>
  );
}
