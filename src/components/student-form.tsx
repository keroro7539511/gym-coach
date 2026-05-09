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
}

export function StudentForm({ defaultValues, onSubmit, submitLabel = "儲存" }: Props) {
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
      className="space-y-4 max-w-xl"
    >
      <div>
        <Label htmlFor="name">姓名 *</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label>性別 *</Label>
        <Select
          value={form.watch("gender")}
          onValueChange={(v) => form.setValue("gender", v as "M" | "F")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="M">男</SelectItem>
            <SelectItem value="F">女</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="birthday">生日</Label>
        <Input
          id="birthday"
          type="date"
          {...form.register("birthday")}
        />
      </div>

      <div>
        <Label htmlFor="phone">電話</Label>
        <Input id="phone" {...form.register("phone")} />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} />
      </div>

      <div>
        <Label>目標 *</Label>
        <Select
          value={goal}
          onValueChange={(v) =>
            form.setValue("goal", v as StudentInput["goal"])
          }
        >
          <SelectTrigger>
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
          <Label htmlFor="customGoal">自訂目標 *</Label>
          <Input id="customGoal" {...form.register("customGoal")} />
          {form.formState.errors.customGoal && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.customGoal.message}
            </p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="weeklyClassCount">每週上課次數 *</Label>
        <Input
          id="weeklyClassCount"
          type="number"
          min="0"
          max="7"
          {...form.register("weeklyClassCount", { valueAsNumber: true })}
        />
      </div>

      <div>
        <Label htmlFor="weeklyGymCount">每週可進健身房次數 *</Label>
        <Input
          id="weeklyGymCount"
          type="number"
          min="0"
          max="7"
          {...form.register("weeklyGymCount", { valueAsNumber: true })}
        />
      </div>

      <div>
        <Label htmlFor="notes">備註（受傷史、過敏…）</Label>
        <Textarea id="notes" rows={4} {...form.register("notes")} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "儲存中…" : submitLabel}
      </Button>
    </form>
  );
}
