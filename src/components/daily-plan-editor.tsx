"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateDailyPlan } from "@/lib/actions/weekly-plans";
import type { DailyPlan } from "@/lib/db/schema";

interface Props {
  daily: DailyPlan;
}

type GymBlock = {
  muscleGroup: string;
  sets: string;
  reps: string;
  weightKg: string;
  restSeconds: string;
  notes: string;
};

const MUSCLE_OPTIONS = ["胸", "背", "腿", "肩", "手臂", "核心", "臀", "有氧"];

function toGymBlocks(src: DailyPlan["gymWorkout"]): GymBlock[] {
  return (src ?? []).map((b) => ({
    muscleGroup: b.muscleGroup,
    sets: String(b.sets),
    reps: String(b.reps),
    weightKg: b.weightKg != null ? String(b.weightKg) : "",
    restSeconds: String(b.restSeconds),
    notes: b.notes ?? "",
  }));
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
    nutritionCaloriesKcal: daily.nutritionCaloriesKcal ?? "",
    nutritionProteinG: daily.nutritionProteinG ?? "",
    nutritionCarbsG: daily.nutritionCarbsG ?? "",
    nutritionFatG: daily.nutritionFatG ?? "",
    nutritionFiberG: daily.nutritionFiberG ?? "",
  });

  const [isGymDay, setIsGymDay] = useState(daily.isGymDay);
  const [gymWorkout, setGymWorkout] = useState<GymBlock[]>(toGymBlocks(daily.gymWorkout));
  const [, startTransition] = useTransition();

  // 自動儲存純量欄位
  useEffect(() => {
    const t = setTimeout(() => {
      startTransition(() => {
        updateDailyPlan(daily.id, {
          walkingStepsTarget: local.walkingStepsTarget === "" ? null : Number(local.walkingStepsTarget),
          cardioMinutesTarget: local.cardioMinutesTarget === "" ? null : Number(local.cardioMinutesTarget),
          mealBreakfast: local.mealBreakfast || null,
          mealLunch: local.mealLunch || null,
          mealDinner: local.mealDinner || null,
          mealSnacks: local.mealSnacks || null,
          waterTargetMl: local.waterTargetMl === "" ? null : Number(local.waterTargetMl),
          coachMessage: local.coachMessage || null,
          nutritionCaloriesKcal: local.nutritionCaloriesKcal === "" ? null : Number(local.nutritionCaloriesKcal),
          nutritionProteinG: local.nutritionProteinG === "" ? null : Number(local.nutritionProteinG),
          nutritionCarbsG: local.nutritionCarbsG === "" ? null : Number(local.nutritionCarbsG),
          nutritionFatG: local.nutritionFatG === "" ? null : Number(local.nutritionFatG),
          nutritionFiberG: local.nutritionFiberG === "" ? null : Number(local.nutritionFiberG),
        });
      });
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  // 自動儲存健身計劃
  useEffect(() => {
    const t = setTimeout(() => {
      startTransition(() => {
        updateDailyPlan(daily.id, {
          isGymDay,
          gymWorkout: gymWorkout.map((b) => ({
            muscleGroup: b.muscleGroup,
            sets: Number(b.sets) || 3,
            reps: Number(b.reps) || 10,
            weightKg: b.weightKg === "" ? null : Number(b.weightKg),
            restSeconds: Number(b.restSeconds) || 60,
            notes: b.notes || null,
          })),
        });
      });
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGymDay, gymWorkout]);

  const set = <K extends keyof typeof local>(k: K, v: (typeof local)[K]) =>
    setLocal((l) => ({ ...l, [k]: v }));

  const updateBlock = (i: number, patch: Partial<GymBlock>) =>
    setGymWorkout((prev) => prev.map((b, idx) => idx === i ? { ...b, ...patch } : b));

  const removeBlock = (i: number) =>
    setGymWorkout((prev) => prev.filter((_, idx) => idx !== i));

  const addBlock = () =>
    setGymWorkout((prev) => [
      ...prev,
      { muscleGroup: "胸", sets: "3", reps: "12", weightKg: "", restSeconds: "60", notes: "" },
    ]);

  return (
    <div className="space-y-6">
      {/* 健身計劃 */}
      <div className={`rounded-xl border p-5 ${isGymDay ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-[var(--surface-2)]"}`}>
        {/* 標題列 + 開關 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {daily.isClassDay ? "上課訓練計劃" : "自主健身計劃"}
          </h3>
          {!daily.isClassDay && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-muted-foreground">健身日</span>
              <button
                type="button"
                role="switch"
                aria-checked={isGymDay}
                onClick={() => setIsGymDay((v) => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors ${isGymDay ? "bg-emerald-500" : "bg-zinc-600"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isGymDay ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </label>
          )}
        </div>

        {/* 訓練區塊列表 */}
        <div className="space-y-3">
          {gymWorkout.map((block, i) => (
            <div key={i} className="rounded-lg border border-border bg-[var(--surface-1)] p-3 space-y-2">
              {/* 第一行：部位 + 數字欄 + 刪除 */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={block.muscleGroup}
                  onChange={(e) => updateBlock(i, { muscleGroup: e.target.value })}
                  className="rounded-md border border-border bg-[var(--surface-2)] px-2 py-1 text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500 w-20"
                >
                  {MUSCLE_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1" max="10"
                  value={block.sets}
                  onChange={(e) => updateBlock(i, { sets: e.target.value })}
                  className="w-12 rounded-md border border-border bg-[var(--surface-2)] px-2 py-1 text-xs font-mono text-center outline-none focus:border-amber-500"
                />
                <span className="text-xs text-muted-foreground">組</span>

                <span className="text-xs text-muted-foreground">×</span>

                <input
                  type="number"
                  min="1" max="50"
                  value={block.reps}
                  onChange={(e) => updateBlock(i, { reps: e.target.value })}
                  className="w-12 rounded-md border border-border bg-[var(--surface-2)] px-2 py-1 text-xs font-mono text-center outline-none focus:border-amber-500"
                />
                <span className="text-xs text-muted-foreground">下</span>

                <input
                  type="number"
                  min="0"
                  step="2.5"
                  placeholder="徒手"
                  value={block.weightKg}
                  onChange={(e) => updateBlock(i, { weightKg: e.target.value })}
                  className="w-16 rounded-md border border-border bg-[var(--surface-2)] px-2 py-1 text-xs font-mono text-center outline-none focus:border-amber-500"
                />
                <span className="text-xs text-muted-foreground">kg</span>

                <span className="text-xs text-muted-foreground">休息</span>
                <input
                  type="number"
                  min="15" max="300" step="15"
                  value={block.restSeconds}
                  onChange={(e) => updateBlock(i, { restSeconds: e.target.value })}
                  className="w-14 rounded-md border border-border bg-[var(--surface-2)] px-2 py-1 text-xs font-mono text-center outline-none focus:border-amber-500"
                />
                <span className="text-xs text-muted-foreground">秒</span>

                <button
                  type="button"
                  onClick={() => removeBlock(i)}
                  className="ml-auto text-muted-foreground hover:text-red-400 transition-colors text-sm leading-none"
                >
                  ✕
                </button>
              </div>

              {/* 第二行：備註 */}
              <input
                type="text"
                placeholder="教練提示（例：器械或自由重量皆可，注意動作控制）"
                value={block.notes}
                onChange={(e) => updateBlock(i, { notes: e.target.value })}
                className="w-full rounded-md border border-border bg-[var(--surface-2)] px-2 py-1 text-xs text-muted-foreground outline-none focus:border-amber-500"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addBlock}
          className="mt-3 w-full rounded-lg border border-dashed border-emerald-500/40 py-2 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/5 transition-colors"
        >
          + 新增訓練部位
        </button>
      </div>

      {/* 運動目標 */}
      <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
        <SectionHeading>運動目標</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <NumField label="走路步數" value={local.walkingStepsTarget} onChange={(v) => set("walkingStepsTarget", v)} />
          <NumField label="有氧分鐘" value={local.cardioMinutesTarget} onChange={(v) => set("cardioMinutesTarget", v)} />
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

      {/* 每日營養目標 */}
      <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
        <SectionHeading>每日營養攝取目標</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <NumField label="熱量 (kcal)" value={local.nutritionCaloriesKcal} onChange={(v) => set("nutritionCaloriesKcal", v)} />
          <NumField label="蛋白質 (g)" value={local.nutritionProteinG} onChange={(v) => set("nutritionProteinG", v)} />
          <NumField label="碳水化合物 (g)" value={local.nutritionCarbsG} onChange={(v) => set("nutritionCarbsG", v)} />
          <NumField label="脂肪 (g)" value={local.nutritionFatG} onChange={(v) => set("nutritionFatG", v)} />
          <NumField label="膳食纖維 (g)" value={local.nutritionFiberG} onChange={(v) => set("nutritionFiberG", v)} />
        </div>
      </div>

      {/* 水分 / 提醒 */}
      <div className="rounded-xl border border-border bg-[var(--surface-2)] p-5">
        <SectionHeading>水分 / 教練提醒</SectionHeading>
        <div className="space-y-4">
          <NumField label="水分 ml" value={local.waterTargetMl} onChange={(v) => set("waterTargetMl", v)} />
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

function NumField({ label, value, onChange }: { label: string; value: string | number; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="bg-[var(--surface-1)] border-border font-mono" />
    </div>
  );
}

function MealField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} className="bg-[var(--surface-1)] border-border resize-none" />
    </div>
  );
}
