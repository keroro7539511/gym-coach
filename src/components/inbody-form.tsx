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
        <h3 className="font-semibold">基本</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="measuredAt">量測日期 *</Label>
            <Input id="measuredAt" type="date" {...form.register("measuredAt")} />
            {form.formState.errors.measuredAt && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.measuredAt.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="weightKg">體重 (kg)</Label>
            <Input id="weightKg" {...num} {...numReg("weightKg")} />
          </div>
          <div>
            <Label htmlFor="bodyFatPct">體脂率 (%)</Label>
            <Input id="bodyFatPct" {...num} {...numReg("bodyFatPct")} />
          </div>
          <div>
            <Label htmlFor="skeletalMuscleKg">骨骼肌量 (kg)</Label>
            <Input
              id="skeletalMuscleKg"
              {...num}
              {...numReg("skeletalMuscleKg")}
            />
          </div>
          <div>
            <Label htmlFor="bmi">BMI</Label>
            <Input id="bmi" {...num} {...numReg("bmi")} />
          </div>
          <div>
            <Label htmlFor="bmrKcal">BMR (kcal)</Label>
            <Input id="bmrKcal" {...num} {...numReg("bmrKcal")} />
          </div>
        </div>
      </section>

      {/* 進階欄位（可摺疊） */}
      <section className="space-y-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-sm text-primary hover:underline"
        >
          {showAdvanced ? "▼" : "▶"} 進階欄位（部位分析、代謝細項）
        </button>

        {showAdvanced && (
          <div className="space-y-6 pl-2 border-l-2">
            <div>
              <h4 className="font-medium mb-2">代謝</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalWaterL">全身水分 (L)</Label>
                  <Input {...num} {...numReg("totalWaterL")} id="totalWaterL" />
                </div>
                <div>
                  <Label htmlFor="proteinKg">蛋白質 (kg)</Label>
                  <Input {...num} {...numReg("proteinKg")} id="proteinKg" />
                </div>
                <div>
                  <Label htmlFor="bodyFatKg">體脂量 (kg)</Label>
                  <Input {...num} {...numReg("bodyFatKg")} id="bodyFatKg" />
                </div>
                <div>
                  <Label htmlFor="visceralFatLevel">內臟脂肪等級</Label>
                  <Input
                    {...num}
                    {...numReg("visceralFatLevel")}
                    id="visceralFatLevel"
                  />
                </div>
                <div>
                  <Label htmlFor="bodyAge">身體年齡</Label>
                  <Input {...num} {...numReg("bodyAge")} id="bodyAge" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">部位肌肉量 (kg)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="muscleLeftArm">左臂</Label>
                  <Input {...num} {...numReg("muscleLeftArm")} id="muscleLeftArm" />
                </div>
                <div>
                  <Label htmlFor="muscleRightArm">右臂</Label>
                  <Input
                    {...num}
                    {...numReg("muscleRightArm")}
                    id="muscleRightArm"
                  />
                </div>
                <div>
                  <Label htmlFor="muscleTrunk">軀幹</Label>
                  <Input {...num} {...numReg("muscleTrunk")} id="muscleTrunk" />
                </div>
                <div>
                  <Label htmlFor="muscleLeftLeg">左腿</Label>
                  <Input {...num} {...numReg("muscleLeftLeg")} id="muscleLeftLeg" />
                </div>
                <div>
                  <Label htmlFor="muscleRightLeg">右腿</Label>
                  <Input
                    {...num}
                    {...numReg("muscleRightLeg")}
                    id="muscleRightLeg"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">部位體脂量 (kg)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fatLeftArm">左臂</Label>
                  <Input {...num} {...numReg("fatLeftArm")} id="fatLeftArm" />
                </div>
                <div>
                  <Label htmlFor="fatRightArm">右臂</Label>
                  <Input {...num} {...numReg("fatRightArm")} id="fatRightArm" />
                </div>
                <div>
                  <Label htmlFor="fatTrunk">軀幹</Label>
                  <Input {...num} {...numReg("fatTrunk")} id="fatTrunk" />
                </div>
                <div>
                  <Label htmlFor="fatLeftLeg">左腿</Label>
                  <Input {...num} {...numReg("fatLeftLeg")} id="fatLeftLeg" />
                </div>
                <div>
                  <Label htmlFor="fatRightLeg">右腿</Label>
                  <Input {...num} {...numReg("fatRightLeg")} id="fatRightLeg" />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <div>
        <Label htmlFor="coachNotes">教練筆記</Label>
        <Textarea
          id="coachNotes"
          rows={3}
          {...form.register("coachNotes")}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "儲存中…" : "儲存 InBody 紀錄"}
      </Button>
    </form>
  );
}
