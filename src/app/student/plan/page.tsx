import { getStudentSession } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { weeklyPlans, dailyPlans } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";

const DAY_LABEL = ["日", "一", "二", "三", "四", "五", "六"];

export default async function StudentPlanPage() {
  const session = await getStudentSession();
  if (!session) notFound();

  const plan = db
    .select()
    .from(weeklyPlans)
    .where(eq(weeklyPlans.studentId, session.studentId))
    .orderBy(desc(weeklyPlans.generatedAt))
    .get();

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">WEEKLY PLAN</p>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">週計劃</h1>
        </header>
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          教練尚未產生週計劃
        </div>
      </div>
    );
  }

  const days = db
    .select()
    .from(dailyPlans)
    .where(eq(dailyPlans.weeklyPlanId, plan.id))
    .orderBy(dailyPlans.dayOfWeek)
    .all();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">WEEKLY PLAN</p>
        <h1 className="text-2xl font-extrabold tracking-tight mt-1">週計劃</h1>
        <p className="text-sm font-mono text-muted-foreground mt-1">
          {plan.startDate} → {plan.endDate}
        </p>
      </header>

      {plan.coachOverallMessage && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500 mb-2">教練的話</p>
          <p className="text-sm whitespace-pre-wrap">{plan.coachOverallMessage}</p>
        </div>
      )}

      <div className="grid gap-4">
        {days.map((day) => (
          <div
            key={day.id}
            className={`rounded-xl border p-5 ${day.isClassDay ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-[var(--surface-2)]"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg font-extrabold font-mono text-amber-500">
                週{DAY_LABEL[day.dayOfWeek]}
              </span>
              <span className="text-xs font-mono text-muted-foreground">{day.date}</span>
              {day.isClassDay && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 rounded px-2 py-0.5">
                  上課日
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {day.walkingStepsTarget && (
                <Metric label="步數目標" value={`${day.walkingStepsTarget.toLocaleString()} 步`} />
              )}
              {day.cardioMinutesTarget && (
                <Metric label="有氧時間" value={`${day.cardioMinutesTarget} 分鐘`} />
              )}
              {day.waterTargetMl && (
                <Metric label="飲水目標" value={`${(day.waterTargetMl / 1000).toFixed(1)} 公升`} />
              )}
              {(day.sleepTargetHoursMin || day.sleepTargetHoursMax) && (
                <Metric label="睡眠目標" value={`${day.sleepTargetHoursMin ?? "?"}–${day.sleepTargetHoursMax ?? "?"} 小時`} />
              )}
            </div>

            {(day.mealBreakfast || day.mealLunch || day.mealDinner || day.mealSnacks) && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">飲食建議</p>
                {[
                  { label: "早餐", value: day.mealBreakfast },
                  { label: "午餐", value: day.mealLunch },
                  { label: "晚餐", value: day.mealDinner },
                  { label: "點心", value: day.mealSnacks },
                ].filter((m) => m.value).map((m) => (
                  <div key={m.label} className="flex gap-3 text-sm">
                    <span className="text-muted-foreground w-10 shrink-0">{m.label}</span>
                    <span>{m.value}</span>
                  </div>
                ))}
              </div>
            )}

            {day.coachMessage && (
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">教練備註</p>
                <p className="text-sm text-muted-foreground">{day.coachMessage}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface-3)] px-3 py-2">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <p className="font-mono font-bold text-sm">{value}</p>
    </div>
  );
}
