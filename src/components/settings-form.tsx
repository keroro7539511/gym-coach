"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import {
  settingsInputSchema,
  type SettingsInput,
} from "@/lib/validators/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type { CoachSettings } from "@/lib/db/schema";

interface Props {
  defaults: CoachSettings;
  onSubmit: (input: SettingsInput) => Promise<void>;
}

export function SettingsForm({ defaults, onSubmit }: Props) {
  const [pending, startTransition] = useTransition();
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsInputSchema),
    defaultValues: {
      muscleGainStepsMin: defaults.muscleGainStepsMin,
      muscleGainStepsMax: defaults.muscleGainStepsMax,
      fatLossStepsMin: defaults.fatLossStepsMin,
      fatLossStepsMax: defaults.fatLossStepsMax,
      fitnessStepsMin: defaults.fitnessStepsMin,
      fitnessStepsMax: defaults.fitnessStepsMax,
      weightAdjustPct: defaults.weightAdjustPct,
      bodyFatWarnMale: defaults.bodyFatWarnMale,
      bodyFatWarnFemale: defaults.bodyFatWarnFemale,
      aiDietPromptTemplate: defaults.aiDietPromptTemplate ?? "",
      aiMessagePromptTemplate: defaults.aiMessagePromptTemplate ?? "",
    },
  });

  const numReg = (name: keyof SettingsInput) =>
    form.register(name, { valueAsNumber: true });

  return (
    <form
      onSubmit={form.handleSubmit((data) =>
        startTransition(() => onSubmit(data))
      )}
      className="space-y-8 max-w-3xl"
    >
      <section>
        <h3 className="font-semibold mb-3">每日步數規則</h3>
        <div className="grid grid-cols-2 gap-4">
          <NumField
            label="增肌・最低"
            id="mgMin"
            register={numReg("muscleGainStepsMin")}
          />
          <NumField
            label="增肌・最高"
            id="mgMax"
            register={numReg("muscleGainStepsMax")}
          />
          <NumField
            label="減脂・最低"
            id="flMin"
            register={numReg("fatLossStepsMin")}
          />
          <NumField
            label="減脂・最高"
            id="flMax"
            register={numReg("fatLossStepsMax")}
          />
          <NumField
            label="體能・最低"
            id="ftMin"
            register={numReg("fitnessStepsMin")}
          />
          <NumField
            label="體能・最高"
            id="ftMax"
            register={numReg("fitnessStepsMax")}
          />
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="font-semibold mb-3">重量建議</h3>
        <NumField
          label="重量微調百分比 (%)"
          id="wapct"
          register={numReg("weightAdjustPct")}
          step="0.5"
        />
        <p className="text-xs text-muted-foreground mt-1">
          RPE ≤ 7 加重、≥ 10 減重的調整幅度。預設 5%。
        </p>
      </section>

      <Separator />

      <section>
        <h3 className="font-semibold mb-3">體脂警示閾值</h3>
        <div className="grid grid-cols-2 gap-4">
          <NumField
            label="男性體脂率上限 (%)"
            id="bfm"
            register={numReg("bodyFatWarnMale")}
            step="0.5"
          />
          <NumField
            label="女性體脂率上限 (%)"
            id="bff"
            register={numReg("bodyFatWarnFemale")}
            step="0.5"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          超過閾值且目標為增肌時，系統會建議「先減脂」。
        </p>
      </section>

      <Separator />

      <section>
        <h3 className="font-semibold mb-3">AI 飲食 Prompt 模板</h3>
        <Textarea
          rows={10}
          {...form.register("aiDietPromptTemplate")}
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground mt-1">
          可用變數：{"{{gender}}"}、{"{{age}}"}、{"{{goal}}"}、{"{{weight}}"}、
          {"{{bodyFatPct}}"}、{"{{bmr}}"}、{"{{classDays}}"}、{"{{gymDays}}"}
        </p>
      </section>

      <section>
        <h3 className="font-semibold mb-3">AI 教練建議文 Prompt 模板</h3>
        <Textarea
          rows={8}
          {...form.register("aiMessagePromptTemplate")}
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground mt-1">
          可用變數：{"{{sessionSummary}}"}、{"{{inbodyDelta}}"}、{"{{goal}}"}
        </p>
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? "儲存中…" : "儲存設定"}
      </Button>
    </form>
  );
}

function NumField({
  label,
  id,
  register,
  step = "1",
}: {
  label: string;
  id: string;
  register: ReturnType<ReturnType<typeof useForm>["register"]>;
  step?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" step={step} {...register} />
    </div>
  );
}
