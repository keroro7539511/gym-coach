"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import {
  inbodyInputSchema,
  type InBodyInput,
} from "@/lib/validators/inbody";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const num = { type: "number", step: "0.1" } as const;

const LABEL_CLS =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block";
const INPUT_CLS = "bg-[var(--surface-1)] border-border font-mono";
const SECTION_HEADING_CLS =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4";

interface Props {
  studentId: number;
  onSubmit: (input: InBodyInput) => Promise<void>;
}

export function InBodyForm({ studentId, onSubmit }: Props) {
  const [pending, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<InBodyInput>({
    resolver: zodResolver(inbodyInputSchema),
    defaultValues: {
      studentId,
      measuredAt: new Date().toISOString().slice(0, 10),
    },
  });

  // Convert empty string -> undefined (instead of NaN) so the optional
  // numeric Zod fields accept blank inputs.
  const numReg = (name: keyof InBodyInput) =>
    form.register(name, {
      setValueAs: (v) =>
        v === "" || v === null || v === undefined ? undefined : Number(v),
    });

  return (
    <form
      onSubmit={form.handleSubmit((data) =>
        startTransition(() => onSubmit(data))
      )}
      className="space-y-6 max-w-3xl"
    >
      {/* 基本欄位 */}
      <section className="space-y-4">
        <h3 className={SECTION_HEADING_CLS}>基本</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="measuredAt" className={LABEL_CLS}>量測日期 *</Label>
            <Input
              id="measuredAt"
              type="date"
              {...form.register("measuredAt")}
              className={INPUT_CLS}
            />
            {form.formState.errors.measuredAt && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.measuredAt.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="weightKg" className={LABEL_CLS}>體重 (kg)</Label>
            <Input id="weightKg" {...num} {...numReg("weightKg")} className={INPUT_CLS} />
          </div>
          <div>
            <Label htmlFor="bodyFatPct" className={LABEL_CLS}>體脂率 (%)</Label>
            <Input id="bodyFatPct" {...num} {...numReg("bodyFatPct")} className={INPUT_CLS} />
          </div>
          <div>
            <Label htmlFor="skeletalMuscleKg" className={LABEL_CLS}>骨骼肌量 (kg)</Label>
            <Input
              id="skeletalMuscleKg"
              {...num}
              {...numReg("skeletalMuscleKg")}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <Label htmlFor="bmi" className={LABEL_CLS}>BMI</Label>
            <Input id="bmi" {...num} {...numReg("bmi")} className={INPUT_CLS} />
          </div>
          <div>
            <Label htmlFor="bmrKcal" className={LABEL_CLS}>BMR (kcal)</Label>
            <Input id="bmrKcal" {...num} {...numReg("bmrKcal")} className={INPUT_CLS} />
          </div>
        </div>
      </section>

      {/* 進階欄位（可摺疊） */}
      <section className="space-y-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs uppercase tracking-wider font-semibold text-amber-500 hover:underline"
        >
          {showAdvanced ? "▼" : "▶"} 進階欄位（部位分析、代謝細項）
        </button>

        {showAdvanced && (
          <div className="space-y-6 pl-4 border-l-2 border-amber-500/30">
            <div>
              <h4 className={SECTION_HEADING_CLS}>代謝</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalWaterL" className={LABEL_CLS}>全身水分 (L)</Label>
                  <Input {...num} {...numReg("totalWaterL")} id="totalWaterL" className={INPUT_CLS} />
                </div>
                <div>
                  <Label htmlFor="proteinKg" className={LABEL_CLS}>蛋白質 (kg)</Label>
                  <Input {...num} {...numReg("proteinKg")} id="proteinKg" className={INPUT_CLS} />
                </div>
                <div>
                  <Label htmlFor="bodyFatKg" className={LABEL_CLS}>體脂量 (kg)</Label>
                  <Input {...num} {...numReg("bodyFatKg")} id="bodyFatKg" className={INPUT_CLS} />
                </div>
                <div>
                  <Label htmlFor="visceralFatLevel" className={LABEL_CLS}>內臟脂肪等級</Label>
                  <Input
                    {...num}
                    {...numReg("visceralFatLevel")}
                    id="visceralFatLevel"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <Label htmlFor="bodyAge" className={LABEL_CLS}>身體年齡</Label>
                  <Input {...num} {...numReg("bodyAge")} id="bodyAge" className={INPUT_CLS} />
                </div>
              </div>
            </div>

            <div>
              <h4 className={SECTION_HEADING_CLS}>部位肌肉量 (kg)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="muscleLeftArm" className={LABEL_CLS}>左臂</Label>
                  <Input {...num} {...numReg("muscleLeftArm")} id="muscleLeftArm" className={INPUT_CLS} />
                </div>
                <div>
                  <Label htmlFor="muscleRightArm" className={LABEL_CLS}>右臂</Label>
                  <Input
                    {...num}
                    {...numReg("muscleRightArm")}
                    id="muscleRightArm"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <Label htmlFor="muscleTrunk" className={LABEL_CLS}>軀幹</Label>
                  <Input {...num} {...numReg("muscleTrunk")} id="muscleTrunk" className={INPUT_CLS} />
                </div>
                <div>
                  <Label htmlFor="muscleLeftLeg" className={LABEL_CLS}>左腿</Label>
                  <Input {...num} {...numReg("muscleLeftLeg")} id="muscleLeftLeg" className={INPUT_CLS} />
                </div>
                <div>
                  <Label htmlFor="muscleRightLeg" className={LABEL_CLS}>右腿</Label>
                  <Input
                    {...num}
                    {...numReg("muscleRightLeg")}
                    id="muscleRightLeg"
                    className={INPUT_CLS}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className={SECTION_HEADING_CLS}>部位體脂量 (kg)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fatLeftArm" className={LABEL_CLS}>左臂</Label>
                  <Input {...num} {...numReg("fatLeftArm")} id="fatLeftArm" className={INPUT_CLS} />
                </div>
                <div>
                  <Label htmlFor="fatRightArm" className={LABEL_CLS}>右臂</Label>
                  <Input {...num} {...numReg("fatRightArm")} id="fatRightArm" className={INPUT_CLS} />
                </div>
                <div>
                  <Label htmlFor="fatTrunk" className={LABEL_CLS}>軀幹</Label>
                  <Input {...num} {...numReg("fatTrunk")} id="fatTrunk" className={INPUT_CLS} />
                </div>
                <div>
                  <Label htmlFor="fatLeftLeg" className={LABEL_CLS}>左腿</Label>
                  <Input {...num} {...numReg("fatLeftLeg")} id="fatLeftLeg" className={INPUT_CLS} />
                </div>
                <div>
                  <Label htmlFor="fatRightLeg" className={LABEL_CLS}>右腿</Label>
                  <Input {...num} {...numReg("fatRightLeg")} id="fatRightLeg" className={INPUT_CLS} />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <div>
        <Label htmlFor="coachNotes" className={LABEL_CLS}>教練筆記</Label>
        <Textarea
          id="coachNotes"
          rows={3}
          {...form.register("coachNotes")}
          className="bg-[var(--surface-1)] border-border resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="uppercase tracking-wider font-bold"
      >
        {pending ? "儲存中…" : "儲存 InBody 紀錄"}
      </Button>
    </form>
  );
}
