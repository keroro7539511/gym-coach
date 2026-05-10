"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  studentInputSchema,
  type StudentInput,
} from "@/lib/validators/student";
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
import { useTransition } from "react";

interface Props {
  defaultValues?: Partial<StudentInput>;
  onSubmit: (input: StudentInput) => Promise<void>;
  submitLabel?: string;
  showPasswordField?: boolean;
}

const LABEL_CLS =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block";
const INPUT_CLS = "bg-[var(--surface-1)] border-border";

export function StudentForm({ defaultValues, onSubmit, submitLabel = "儲存", showPasswordField = false }: Props) {
  const [pending, startTransition] = useTransition();
  const form = useForm<StudentInput>({
    resolver: zodResolver(studentInputSchema),
    defaultValues: {
      name: "",
      gender: "M",
      goal: ["muscle_gain"] as ("muscle_gain" | "fat_loss" | "fitness" | "custom")[],
      weeklyClassCount: 1,
      weeklyGymCount: 3,
      dietaryRestrictions: "",
      ...defaultValues,
    },
  });

  const goal = form.watch("goal") as string[];

  return (
    <form
      onSubmit={form.handleSubmit((data) =>
        startTransition(() => onSubmit(data))
      )}
      className="space-y-5 max-w-xl"
    >
      <div>
        <Label htmlFor="name" className={LABEL_CLS}>姓名 *</Label>
        <Input id="name" {...form.register("name")} className={INPUT_CLS} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label className={LABEL_CLS}>性別 *</Label>
        <Select
          value={form.watch("gender")}
          onValueChange={(v) => form.setValue("gender", v as "M" | "F")}
        >
          <SelectTrigger className={INPUT_CLS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="M">男</SelectItem>
            <SelectItem value="F">女</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="birthday" className={LABEL_CLS}>生日</Label>
        <Input
          id="birthday"
          type="date"
          {...form.register("birthday")}
          className={INPUT_CLS}
        />
      </div>

      <div>
        <Label htmlFor="phone" className={LABEL_CLS}>電話</Label>
        <Input id="phone" {...form.register("phone")} className={INPUT_CLS} />
      </div>

      <div>
        <Label htmlFor="email" className={LABEL_CLS}>Email</Label>
        <Input id="email" type="email" {...form.register("email")} className={INPUT_CLS} />
      </div>

      <div>
        <Label className={LABEL_CLS}>目標 * <span className="normal-case tracking-normal text-xs font-normal">（可多選）</span></Label>
        <div className="flex flex-wrap gap-2">
          {([
            { value: "muscle_gain", label: "增肌" },
            { value: "fat_loss",    label: "減脂" },
            { value: "fitness",     label: "體能" },
            { value: "custom",      label: "其他" },
          ] as const).map(({ value, label }) => {
            const checked = goal?.includes(value) ?? false;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  const next = checked
                    ? goal.filter((g) => g !== value)
                    : [...(goal ?? []), value];
                  form.setValue("goal", next as StudentInput["goal"], { shouldValidate: true });
                }}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  checked
                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                    : "border-border bg-[var(--surface-1)] text-muted-foreground hover:border-amber-500/50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {form.formState.errors.goal && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.goal.message as string}
          </p>
        )}
      </div>

      {goal?.includes("custom") && (
        <div>
          <Label htmlFor="customGoal" className={LABEL_CLS}>自訂目標 *</Label>
          <Input id="customGoal" {...form.register("customGoal")} className={INPUT_CLS} />
          {form.formState.errors.customGoal && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.customGoal.message}
            </p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="weeklyClassCount" className={LABEL_CLS}>每週上課次數 *</Label>
        <Input
          id="weeklyClassCount"
          type="number"
          min="0"
          max="7"
          {...form.register("weeklyClassCount", { valueAsNumber: true })}
          className={INPUT_CLS}
        />
      </div>

      <div>
        <Label htmlFor="weeklyGymCount" className={LABEL_CLS}>每週可進健身房次數 *</Label>
        <Input
          id="weeklyGymCount"
          type="number"
          min="0"
          max="7"
          {...form.register("weeklyGymCount", { valueAsNumber: true })}
          className={INPUT_CLS}
        />
      </div>

      <div>
        <Label htmlFor="dietaryRestrictions" className={LABEL_CLS}>飲食限制</Label>
        <Textarea
          id="dietaryRestrictions"
          rows={3}
          {...form.register("dietaryRestrictions")}
          placeholder="例：素食、不吃牛肉、不吃香菜、乳糖不耐…"
          className="bg-[var(--surface-1)] border-border resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">AI 生成飲食建議時會自動排除這些食物</p>
      </div>

      <div>
        <Label htmlFor="notes" className={LABEL_CLS}>備註（受傷史、過敏…）</Label>
        <Textarea
          id="notes"
          rows={4}
          {...form.register("notes")}
          className="bg-[var(--surface-1)] border-border resize-none"
        />
      </div>

      {showPasswordField && (
        <div className="rounded-xl border border-border bg-[var(--surface-2)] p-4 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            學員登入帳號（選填）
          </p>
          <p className="text-xs text-muted-foreground -mt-1">
            填入後學員可直接用姓名＋此密碼登入，不填則稍後透過 QR code 配對
          </p>
          <div>
            <Label htmlFor="initialPassword" className={LABEL_CLS}>初始密碼</Label>
            <Input
              id="initialPassword"
              type="password"
              {...form.register("initialPassword")}
              className={INPUT_CLS}
              placeholder="至少 4 個字元"
              autoComplete="new-password"
            />
            {form.formState.errors.initialPassword && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.initialPassword.message}
              </p>
            )}
          </div>
        </div>
      )}

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
