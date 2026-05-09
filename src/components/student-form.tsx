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
      goal: "muscle_gain",
      weeklyClassCount: 1,
      weeklyGymCount: 3,
      ...defaultValues,
    },
  });

  const goal = form.watch("goal");

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
        <Label className={LABEL_CLS}>目標 *</Label>
        <Select
          value={goal}
          onValueChange={(v) =>
            form.setValue("goal", v as StudentInput["goal"])
          }
        >
          <SelectTrigger className={INPUT_CLS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="muscle_gain">增肌</SelectItem>
            <SelectItem value="fat_loss">減脂</SelectItem>
            <SelectItem value="fitness">體能</SelectItem>
            <SelectItem value="custom">其他</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {goal === "custom" && (
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
