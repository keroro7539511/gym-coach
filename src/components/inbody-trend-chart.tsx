"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { InBodyRecord } from "@/lib/db/schema";

interface Props {
  records: InBodyRecord[];
}

interface ChartCardProps {
  data: Record<string, string | number | undefined>[];
  dataKey: string;
  label: string;
  unit: string;
  color: string;
  decimals?: number;
}

const TOOLTIP_STYLE = {
  backgroundColor: "#161616",
  border: "1px solid #2a2a2a",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#ededed",
};

function ChartCard({ data, dataKey, label, unit, color, decimals = 1 }: ChartCardProps) {
  const values = data.map((d) => d[dataKey]).filter((v): v is number => v != null);
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const latest = values[values.length - 1];
  const first = values[0];
  const delta = latest - first;
  const deltaStr = (delta >= 0 ? "+" : "") + delta.toFixed(decimals);

  return (
    <div className="rounded-xl border border-border bg-[var(--surface-2)] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <div className="text-right">
          <span className="text-lg font-bold font-mono" style={{ color }}>
            {latest.toFixed(decimals)}
            <span className="text-xs text-muted-foreground ml-1">{unit.trim()}</span>
          </span>
          <div
            className="text-[11px] font-mono"
            style={{ color: delta === 0 ? "#888" : delta > 0 ? "#f97316" : "#10b981" }}
          >
            {deltaStr} {unit.trim()}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#555", fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#555" }}
            tickLine={false}
            axisLine={false}
            domain={[min * 0.97, max * 1.03]}
            tickCount={3}
            tickFormatter={(v: number) => v.toFixed(0)}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: "#888", marginBottom: 4 }}
            formatter={(v) => [`${Number(v).toFixed(decimals)} ${unit.trim()}`, label]}
          />
          <ReferenceLine y={first} stroke="#2a2a2a" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between mt-1 text-[10px] font-mono text-muted-foreground">
        <span>最低 {min.toFixed(decimals)}</span>
        <span>最高 {max.toFixed(decimals)}</span>
      </div>
    </div>
  );
}

export function InBodyTrendChart({ records }: Props) {
  if (records.length < 2) return null;

  const data = [...records]
    .reverse()
    .map((r) => ({
      date: r.measuredAt.slice(0, 10),
      weightKg: r.weightKg ?? undefined,
      bodyFatPct: r.bodyFatPct ?? undefined,
      skeletalMuscleKg: r.skeletalMuscleKg ?? undefined,
    }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ChartCard data={data} dataKey="weightKg" label="體重" unit="kg" color="#f59e0b" />
      <ChartCard data={data} dataKey="bodyFatPct" label="體脂率" unit="%" color="#f97316" />
      <ChartCard data={data} dataKey="skeletalMuscleKg" label="骨骼肌" unit="kg" color="#10b981" />
    </div>
  );
}
