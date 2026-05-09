import { notFound } from "next/navigation";
import { getInBodyRecord } from "@/lib/actions/inbody";
import { getStudent } from "@/lib/actions/students";
import { generateBasicRecommendations } from "@/lib/recommendations/basic-inbody";
import { RecommendationCard } from "@/components/recommendation-card";
import { getCoachSettings } from "@/lib/coach-settings";
import { Metric } from "@/components/ui/metric";

export default async function InBodyDetailPage({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}) {
  const { id: idStr, recordId: recIdStr } = await params;
  const recordId = Number(recIdStr);
  const studentId = Number(idStr);
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
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">InBody 紀錄</h2>
        <span className="text-sm font-mono text-muted-foreground">
          {record.measuredAt}
        </span>
      </div>

      {/* 主要指標 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
          <Metric value={record.weightKg ?? "—"} label="體重 KG" />
        </div>
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
          <Metric value={record.bodyFatPct ?? "—"} label="體脂率 %" accent />
        </div>
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
          <Metric value={record.skeletalMuscleKg ?? "—"} label="骨骼肌 KG" />
        </div>
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
          <Metric value={record.bmrKcal ?? "—"} label="BMR KCAL" />
        </div>
      </div>

      {/* 其他欄位 */}
      <div className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
          其他指標
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 font-mono text-sm">
          <Field label="BMI" value={record.bmi} />
          <Field label="體脂量" value={record.bodyFatKg} unit="kg" />
          <Field label="內臟脂肪" value={record.visceralFatLevel} />
          <Field label="身體年齡" value={record.bodyAge} />
          <Field label="全身水分" value={record.totalWaterL} unit="L" />
          <Field label="蛋白質" value={record.proteinKg} unit="kg" />
        </div>

        {record.coachNotes && (
          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              教練筆記
            </div>
            <p className="text-sm">{record.coachNotes}</p>
          </div>
        )}
      </div>

      <RecommendationCard recs={recs} />
    </div>
  );
}

function Field({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null | undefined;
  unit?: string;
}) {
  return (
    <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span>
        {value ?? "—"}
        {value != null && unit && (
          <span className="text-xs text-muted-foreground ml-1">{unit}</span>
        )}
      </span>
    </div>
  );
}
