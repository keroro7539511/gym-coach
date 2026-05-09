"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import type { ExercisePR } from "@/lib/actions/sessions";
import { MUSCLE_GROUP_LABEL } from "@/components/exercise-form";

interface Props {
  prs: ExercisePR[];
}

const TOOLTIP_STYLE = {
  backgroundColor: "#161616",
  border: "1px solid #2a2a2a",
  borderRadius: "6px",
  fontSize: "11px",
  color: "#ededed",
  padding: "4px 8px",
};

function Sparkline({ history }: { history: ExercisePR["history"] }) {
  if (history.length < 2) {
    return (
      <span className="text-[10px] font-mono text-muted-foreground">
        {history.length === 1 ? `${history[0].maxWeightKg} kg` : "—"}
      </span>
    );
  }

  const first = history[0].maxWeightKg;
  const last = history[history.length - 1].maxWeightKg;
  const trending = last > first ? "#10b981" : last < first ? "#ef4444" : "#888";

  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={history} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: number) => [`${v} kg`, ""]}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
        />
        <Line
          type="monotone"
          dataKey="maxWeightKg"
          stroke={trending}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

const muscleOrder = ["chest", "back", "legs", "shoulder", "arm", "core", "small_muscles"];

export function ExercisePRList({ prs }: Props) {
  if (prs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        完成課程後即可看到動作進度
      </div>
    );
  }

  const groups = muscleOrder
    .map((mg) => ({
      key: mg,
      label: MUSCLE_GROUP_LABEL[mg] ?? mg,
      items: prs.filter((p) => p.muscleGroup === mg),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.key} className="rounded-xl border border-border bg-[var(--surface-2)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {group.label}
            </span>
          </div>
          <ul className="divide-y divide-[var(--border-subtle)]">
            {group.items.map((pr) => (
              <li key={pr.exerciseId} className="flex items-center gap-4 px-5 py-3">
                <span className="flex-1 text-sm font-semibold">{pr.exerciseName}</span>
                <span className="text-sm font-mono text-amber-500 font-bold whitespace-nowrap">
                  {pr.bestWeightKg} kg
                  {pr.bestReps > 0 && (
                    <span className="text-muted-foreground font-normal"> × {pr.bestReps}</span>
                  )}
                </span>
                <Sparkline history={pr.history} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
