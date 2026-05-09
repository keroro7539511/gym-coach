"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { updateSetLog, deleteSetLog } from "@/lib/actions/set-logs";
import type { SetLog } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface Props {
  set: SetLog;
  weightSuggestion: number | null;
  readOnly?: boolean;
}

export function SetRow({ set, weightSuggestion, readOnly = false }: Props) {
  const isInitialMount = useRef(true);
  const [local, setLocal] = useState({
    weightKg: set.weightKg ?? "",
    reps: set.reps ?? "",
    rpe: set.rpe ?? "",
    toFailure: set.toFailure,
    heartRateBpm: set.heartRateBpm ?? "",
  });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        await updateSetLog(set.id, {
          weightKg: local.weightKg === "" ? null : Number(local.weightKg),
          reps: local.reps === "" ? null : Number(local.reps),
          rpe: local.rpe === "" ? null : Number(local.rpe),
          toFailure: local.toFailure,
          heartRateBpm:
            local.heartRateBpm === "" ? null : Number(local.heartRateBpm),
        });
      });
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  const numCls =
    "h-10 w-20 text-center font-mono font-semibold tabular-nums bg-[var(--surface-1)] border-border focus-visible:ring-2 focus-visible:ring-amber-500";

  return (
    <tr className="border-b border-[var(--border-subtle)] last:border-0">
      <td className="py-3 pr-2">
        <div className="size-9 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-amber-500 font-mono font-extrabold text-sm">
          {set.setNumber}
        </div>
      </td>
      <td className="py-3 px-2">
        <Input
          type="number"
          step="2.5"
          inputMode="decimal"
          value={local.weightKg}
          onChange={(e) => setLocal((l) => ({ ...l, weightKg: e.target.value }))}
          placeholder={
            weightSuggestion != null ? `建議 ${weightSuggestion}` : "kg"
          }
          className={numCls}
          readOnly={readOnly}
          disabled={readOnly}
        />
      </td>
      <td className="py-3 px-2">
        <Input
          type="number"
          inputMode="numeric"
          value={local.reps}
          onChange={(e) => setLocal((l) => ({ ...l, reps: e.target.value }))}
          placeholder="次"
          className={numCls}
          readOnly={readOnly}
          disabled={readOnly}
        />
      </td>
      <td className="py-3 px-2">
        <Input
          type="number"
          min="1"
          max="10"
          value={local.rpe}
          onChange={(e) => setLocal((l) => ({ ...l, rpe: e.target.value }))}
          placeholder="—"
          className={cn(numCls, local.rpe !== "" && "text-amber-500")}
          readOnly={readOnly}
          disabled={readOnly}
        />
      </td>
      <td className="py-3 px-2 text-center">
        <button
          type="button"
          onClick={() =>
            !readOnly &&
            setLocal((l) => ({ ...l, toFailure: !l.toFailure }))
          }
          disabled={readOnly}
          className={cn(
            "size-7 rounded border-2 transition-colors flex items-center justify-center",
            local.toFailure
              ? "bg-amber-500 border-amber-500 text-zinc-950"
              : "bg-[var(--surface-2)] border-border hover:border-amber-500"
          )}
          aria-label="力竭"
        >
          {local.toFailure && (
            <span className="text-xs font-extrabold leading-none">✓</span>
          )}
        </button>
      </td>
      <td className="py-3 px-2">
        <Input
          type="number"
          inputMode="numeric"
          value={local.heartRateBpm}
          onChange={(e) =>
            setLocal((l) => ({ ...l, heartRateBpm: e.target.value }))
          }
          placeholder="—"
          className={numCls}
          readOnly={readOnly}
          disabled={readOnly}
        />
      </td>
      <td className="py-3 pl-2 text-center">
        {!readOnly && (
          <button
            type="button"
            className="text-zinc-600 hover:text-rose-500 transition-colors size-8"
            disabled={pending}
            onClick={() => startTransition(() => deleteSetLog(set.id))}
            aria-label="刪除組"
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  );
}
