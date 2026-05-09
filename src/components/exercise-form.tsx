"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import {
  exerciseInputSchema,
  type ExerciseInput,
} from "@/lib/validators/exercise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  defaultValues?: Partial<ExerciseInput>;
  onSubmit: (input: ExerciseInput) => Promise<void>;
  submitLabel?: string;
}

export const MUSCLE_GROUP_LABEL: Record<string, string> = {
  chest: "胸",
  back: "背",
  legs: "腿",
  shoulder: "肩",
  arm: "手臂",
  core: "核心",
  small_muscles: "小肌群",
};

const LABEL_CLS =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block";
const INPUT_CLS = "bg-[var(--surface-1)] border-border";

export function ExerciseForm({
  defaultValues,
  onSubmit,
  submitLabel = "儲存",
}: Props) {
  const [pending, startTransition] = useTransition();
  const form = useForm<ExerciseInput>({
    resolver: zodResolver(exerciseInputSchema),
    defaultValues: {
      name: "",
      muscleGroup: "chest",
      ...defaultValues,
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) =>
        startTransition(() => onSubmit(data))
      )}
      className="space-y-5 max-w-xl"
    >
      <div>
        <Label htmlFor="name" className={LABEL_CLS}>動作名稱（中文） *</Label>
        <Input id="name" {...form.register("name")} className={INPUT_CLS} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="nameEn" className={LABEL_CLS}>英文名稱</Label>
        <Input id="nameEn" {...form.register("nameEn")} className={INPUT_CLS} />
      </div>

      <div>
        <Label className={LABEL_CLS}>肌群 *</Label>
        <Select
          value={form.watch("muscleGroup")}
          onValueChange={(v) =>
            form.setValue("muscleGroup", v as ExerciseInput["muscleGroup"])
          }
        >
          <SelectTrigger className={INPUT_CLS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MUSCLE_GROUP_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="equipment" className={LABEL_CLS}>器材</Label>
        <Input id="equipment" {...form.register("equipment")} className={INPUT_CLS} />
      </div>

      <div>
        <Label htmlFor="demoImageUrl" className={LABEL_CLS}>示範圖網址</Label>
        <Input id="demoImageUrl" {...form.register("demoImageUrl")} className={INPUT_CLS} />
      </div>

      <div>
        <Label htmlFor="description" className={LABEL_CLS}>說明</Label>
        <Textarea
          id="description"
          rows={4}
          {...form.register("description")}
          className="bg-[var(--surface-1)] border-border resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="uppercase tracking-wider font-bold"
      >
        {pending ? "儲存中…" : submitLabel}
      </Button>
    </form>
  );
}
