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
import { updateWeeklyPlanMessage, regenerateWeeklyPlanAI } from "@/lib/actions/weekly-plans";
import type { WeeklyPlan, DailyPlan } from "@/lib/db/schema";

const DAY_LABEL = ["日", "一", "二", "三", "四", "五", "六"];

interface Props {
  plan: WeeklyPlan;
  days: DailyPlan[];
  studentName: string;
}

export function WeeklyPlanEditor({ plan, days, studentName }: Props) {
  const [overallMsg, setOverallMsg] = useState(plan.coachOverallMessage ?? "");
  const [aiPending, startAiTransition] = useTransition();
  const [, startTransition] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);

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
        <div className="flex items-center justify-between mb-3">
          <label
            htmlFor="overall"
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground"
          >
            教練給整週的話
            <span className="text-amber-500 normal-case tracking-normal text-xs ml-2">AI 草稿，可編輯</span>
          </label>
          <button
            type="button"
            disabled={aiPending}
            onClick={() => {
              setAiError(null);
              startAiTransition(async () => {
                const result = await regenerateWeeklyPlanAI(plan.id);
                if (!result.ok) {
                  setAiError(result.error ?? "AI 生成失敗");
                } else {
                  // 重新整理頁面以取得最新資料
                  window.location.reload();
                }
              });
            }}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-500 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiPending ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AI 生成中…
              </>
            ) : (
              <>✦ AI 重新生成</>
            )}
          </button>
        </div>
        {aiError && (
          <p className="text-xs text-red-400 mb-2">{aiError}</p>
        )}
        <Textarea
          id="overall"
          rows={4}
          value={overallMsg}
          onChange={(e) => setOverallMsg(e.target.value)}
          placeholder="點右上角「✦ AI 重新生成」按鈕，根據 InBody 和課程內容自動生成…"
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
