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
import type { CoachSettings } from "@/lib/db/schema";

interface Props {
  defaults: CoachSettings;
  onSubmit: (input: SettingsInput) => Promise<void>;
}

const LABEL_CLS =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block";
const INPUT_CLS = "bg-[var(--surface-1)] border-border font-mono";
const SECTION_CARD_CLS =
  "rounded-xl border border-border bg-[var(--surface-2)] p-6";
const SECTION_HEADING_CLS =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4";

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
      geminiApiKey: defaults.geminiApiKey ?? "",
    },
  });

  const numReg = (name: keyof SettingsInput) =>
    form.register(name, { valueAsNumber: true });

  const apiKey = form.watch("geminiApiKey");

  return (
    <form
      onSubmit={form.handleSubmit((data) =>
        startTransition(() => onSubmit(data))
      )}
      className="space-y-6 max-w-3xl"
    >
      <section className={SECTION_CARD_CLS}>
        <h3 className={SECTION_HEADING_CLS}>AI 設定</h3>
        <div>
          <Label htmlFor="geminiApiKey" className={LABEL_CLS}>
            Gemini API Key
          </Label>
          <div className="relative">
            <Input
              id="geminiApiKey"
              type="password"
              autoComplete="off"
              placeholder="AIzaSy…（至 Google AI Studio 取得）"
              {...form.register("geminiApiKey")}
              className={INPUT_CLS}
            />
            {apiKey && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                已設定
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            用於 AI 自動生成週計劃。前往{" "}
            <span className="font-mono text-amber-500">aistudio.google.com/app/apikey</span>{" "}
            建立免費 API Key，填入後點「儲存設定」即生效。
          </p>
        </div>
      </section>

      <section className={SECTION_CARD_CLS}>
        <h3 className={SECTION_HEADING_CLS}>每日步數規則</h3>
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

      <section className={SECTION_CARD_CLS}>
        <h3 className={SECTION_HEADING_CLS}>重量建議</h3>
        <NumField
          label="重量微調百分比 (%)"
          id="wapct"
          register={numReg("weightAdjustPct")}
          step="0.5"
        />
        <p className="text-xs text-muted-foreground mt-2">
          RPE ≤ 7 加重、≥ 10 減重的調整幅度。預設 5%。
        </p>
      </section>

      <section className={SECTION_CARD_CLS}>
        <h3 className={SECTION_HEADING_CLS}>體脂警示閾值</h3>
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
        <p className="text-xs text-muted-foreground mt-2">
          超過閾值且目標為增肌時，系統會建議「先減脂」。
        </p>
      </section>

      <section className={SECTION_CARD_CLS}>
        <h3 className={SECTION_HEADING_CLS}>AI 飲食 Prompt 模板</h3>
        <Textarea
          rows={10}
          {...form.register("aiDietPromptTemplate")}
          className="bg-[var(--surface-1)] border-border font-mono text-xs resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          可用變數：{"{{gender}}"}、{"{{age}}"}、{"{{goal}}"}、{"{{weight}}"}、
          {"{{bodyFatPct}}"}、{"{{bmr}}"}、{"{{classDays}}"}、{"{{gymDays}}"}
        </p>
      </section>

      <section className={SECTION_CARD_CLS}>
        <h3 className={SECTION_HEADING_CLS}>AI 教練建議文 Prompt 模板</h3>
        <Textarea
          rows={8}
          {...form.register("aiMessagePromptTemplate")}
          className="bg-[var(--surface-1)] border-border font-mono text-xs resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          可用變數：{"{{sessionSummary}}"}、{"{{inbodyDelta}}"}、{"{{goal}}"}
        </p>
      </section>

      <Button
        type="submit"
        disabled={pending}
        className="uppercase tracking-wider font-bold"
      >
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
      <Label htmlFor={id} className={LABEL_CLS}>{label}</Label>
      <Input id={id} type="number" step={step} {...register} className={INPUT_CLS} />
    </div>
  );
}
