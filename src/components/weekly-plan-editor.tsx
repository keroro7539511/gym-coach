"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { DailyPlanEditor } from "@/components/daily-plan-editor";
import { updateWeeklyPlanMessage } from "@/lib/actions/weekly-plans";
import type { WeeklyPlan, DailyPlan } from "@/lib/db/schema";

const DAY_LABEL = ["日", "一", "二", "三", "四", "五", "六"];

interface Props {
  plan: WeeklyPlan;
  days: DailyPlan[];
  studentName: string;
}

export function WeeklyPlanEditor({ plan, days, studentName }: Props) {
  const [overallMsg, setOverallMsg] = useState(plan.coachOverallMessage ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (overallMsg === (plan.coachOverallMessage ?? "")) return;
    const t = setTimeout(() => {
      startTransition(() => {
        updateWeeklyPlanMessage(plan.id, overallMsg);
      });
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overallMsg]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">
          {studentName} 的下週計劃
        </h1>
        <p className="text-sm text-muted-foreground">
          {plan.startDate} → {plan.endDate}
        </p>
      </header>

      <div className="flex gap-3 mb-6">
        <a
          href={`/api/weekly-plans/${plan.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          預覽 PDF
        </a>
        <a
          href={`/api/weekly-plans/${plan.id}/pdf`}
          download
          className={buttonVariants()}
        >
          下載 PDF
        </a>
      </div>

      <section className="mb-8">
        <Label htmlFor="overall">教練給整週的話 (AI 草稿，可編輯)</Label>
        <Textarea
          id="overall"
          rows={4}
          value={overallMsg}
          onChange={(e) => setOverallMsg(e.target.value)}
          placeholder="如果是空白，可能是 AI 生成失敗，請手動填寫…"
          className="mt-1"
        />
      </section>

      <Tabs defaultValue={days[0]?.date}>
        <TabsList className="grid grid-cols-7 mb-4 h-auto">
          {days.map((d) => (
            <TabsTrigger key={d.id} value={d.date}>
              <div className="flex flex-col items-center text-xs">
                <span>星期{DAY_LABEL[d.dayOfWeek]}</span>
                <span className="text-muted-foreground">
                  {d.date.slice(5)}
                </span>
                {d.isClassDay && (
                  <span className="text-[10px] text-primary">上課</span>
                )}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {days.map((d) => (
          <TabsContent key={d.id} value={d.date}>
            <DailyPlanEditor daily={d} />
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-8 pt-6 border-t text-sm text-muted-foreground">
        所有變更會自動儲存。
      </div>
    </div>
  );
}
