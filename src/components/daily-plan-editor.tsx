"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateDailyPlan } from "@/lib/actions/weekly-plans";
import type { DailyPlan } from "@/lib/db/schema";

interface Props {
  daily: DailyPlan;
}

export function DailyPlanEditor({ daily }: Props) {
  const [local, setLocal] = useState({
    walkingStepsTarget: daily.walkingStepsTarget ?? "",
    cardioMinutesTarget: daily.cardioMinutesTarget ?? "",
    mealBreakfast: daily.mealBreakfast ?? "",
    mealLunch: daily.mealLunch ?? "",
    mealDinner: daily.mealDinner ?? "",
    mealSnacks: daily.mealSnacks ?? "",
    waterTargetMl: daily.waterTargetMl ?? "",
    coachMessage: daily.coachMessage ?? "",
  });
  const [, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      startTransition(() => {
        updateDailyPlan(daily.id, {
          walkingStepsTarget:
            local.walkingStepsTarget === "" ? null : Number(local.walkingStepsTarget),
          cardioMinutesTarget:
            local.cardioMinutesTarget === "" ? null : Number(local.cardioMinutesTarget),
          mealBreakfast: local.mealBreakfast || null,
          mealLunch: local.mealLunch || null,
          mealDinner: local.mealDinner || null,
          mealSnacks: local.mealSnacks || null,
          waterTargetMl:
            local.waterTargetMl === "" ? null : Number(local.waterTargetMl),
          coachMessage: local.coachMessage || null,
        });
      });
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  const set = <K extends keyof typeof local>(k: K, v: (typeof local)[K]) =>
    setLocal((l) => ({ ...l, [k]: v }));

  return (
    <div className="space-y-6">
      {/* 運動目標 */}
      <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
        <SectionHeading>運動目標</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <NumField
            label="走路步數"
            value={local.walkingStepsTarget}
            onChange={(v) => set("walkingStepsTarget", v)}
          />
          <NumField
            label="有氧分鐘"
            value={local.cardioMinutesTarget}
            onChange={(v) => set("cardioMinutesTarget", v)}
          />
        </div>
      </div>

      {/* 飲食 */}
      <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
        <SectionHeading>飲食</SectionHeading>
        <div className="space-y-4">
          <MealField label="早餐" value={local.mealBreakfast} onChange={(v) => set("mealBreakfast", v)} />
          <MealField label="午餐" value={local.mealLunch} onChange={(v) => set("mealLunch", v)} />
          <MealField label="晚餐" value={local.mealDinner} onChange={(v) => set("mealDinner", v)} />
          <MealField label="點心" value={local.mealSnacks} onChange={(v) => set("mealSnacks", v)} />
        </div>
      </div>

      {/* 補充 */}
      <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
        <SectionHeading>水分 / 教練提醒</SectionHeading>
        <div className="space-y-4">
          <NumField
            label="水分 ml"
            value={local.waterTargetMl}
            onChange={(v) => set("waterTargetMl", v)}
          />
          <div>
            <Label>教練給今天的話</Label>
            <Textarea
              rows={3}
              value={local.coachMessage}
              onChange={(e) => set("coachMessage", e.target.value)}
              className="bg-[var(--surface-1)] border-border resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
      {children}
    </h3>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[var(--surface-1)] border-border font-mono"
      />
    </div>
  );
}

function MealField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[var(--surface-1)] border-border resize-none"
      />
    </div>
  );
}
