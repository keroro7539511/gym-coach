"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>走路步數目標</Label>
          <Input
            type="number"
            value={local.walkingStepsTarget}
            onChange={(e) => set("walkingStepsTarget", e.target.value)}
          />
        </div>
        <div>
          <Label>有氧分鐘</Label>
          <Input
            type="number"
            value={local.cardioMinutesTarget}
            onChange={(e) => set("cardioMinutesTarget", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>早餐</Label>
        <Textarea
          rows={2}
          value={local.mealBreakfast}
          onChange={(e) => set("mealBreakfast", e.target.value)}
          placeholder="如果是空白，可能是 AI 生成失敗，請手動填寫…"
        />
      </div>
      <div>
        <Label>午餐</Label>
        <Textarea
          rows={2}
          value={local.mealLunch}
          onChange={(e) => set("mealLunch", e.target.value)}
          placeholder="如果是空白，可能是 AI 生成失敗，請手動填寫…"
        />
      </div>
      <div>
        <Label>晚餐</Label>
        <Textarea
          rows={2}
          value={local.mealDinner}
          onChange={(e) => set("mealDinner", e.target.value)}
          placeholder="如果是空白，可能是 AI 生成失敗，請手動填寫…"
        />
      </div>
      <div>
        <Label>點心</Label>
        <Textarea
          rows={2}
          value={local.mealSnacks}
          onChange={(e) => set("mealSnacks", e.target.value)}
          placeholder="如果是空白，可能是 AI 生成失敗，請手動填寫…"
        />
      </div>

      <div>
        <Label>水分目標 (ml)</Label>
        <Input
          type="number"
          value={local.waterTargetMl}
          onChange={(e) => set("waterTargetMl", e.target.value)}
        />
      </div>

      <div>
        <Label>教練給今天的話</Label>
        <Textarea
          rows={3}
          value={local.coachMessage}
          onChange={(e) => set("coachMessage", e.target.value)}
        />
      </div>
    </div>
  );
}
