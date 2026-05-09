"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-5xl">
      <header className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            WEEKLY PLAN
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            {studentName}
          </h1>
          <p className="text-sm font-mono text-muted-foreground mt-1.5">
            {plan.startDate} → {plan.endDate}
          </p>
        </div>
        <div className="flex gap-3">
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
      </header>

      <section className="rounded-xl border border-border bg-[var(--surface-2)] p-6 mb-6">
        <label
          htmlFor="overall"
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 block"
        >
          教練給整週的話 <span className="text-amber-500 normal-case tracking-normal text-xs ml-2">AI 草稿，可編輯</span>
        </label>
        <Textarea
          id="overall"
          rows={4}
          value={overallMsg}
          onChange={(e) => setOverallMsg(e.target.value)}
          placeholder="如果是空白，可能是 AI 生成失敗，請手動填寫…"
          className="bg-[var(--surface-1)] border-border resize-none"
        />
      </section>

      <Tabs defaultValue={days[0]?.date} className="space-y-4">
        <TabsList className="grid grid-cols-7 h-auto bg-[var(--surface-2)] border border-border p-1 rounded-lg gap-1">
          {days.map((d) => (
            <TabsTrigger
              key={d.id}
              value={d.date}
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 data-[state=active]:shadow-none data-active:bg-amber-500 data-active:text-zinc-950 data-active:shadow-none rounded-md py-2 px-1"
            >
              <div className="flex flex-col items-center text-xs leading-tight">
                <span className="font-bold">星期{DAY_LABEL[d.dayOfWeek]}</span>
                <span className="opacity-70 font-mono text-[10px] mt-0.5">
                  {d.date.slice(5)}
                </span>
                {d.isClassDay && (
                  <span className="text-[9px] uppercase tracking-wider mt-0.5 font-bold">
                    上課
                  </span>
                )}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {days.map((d) => (
          <TabsContent key={d.id} value={d.date} className="mt-4">
            <DailyPlanEditor daily={d} />
          </TabsContent>
        ))}
      </Tabs>

      <p className="mt-8 pt-6 border-t border-[var(--border-subtle)] text-xs text-muted-foreground">
        所有變更會自動儲存
      </p>
    </div>
  );
}
