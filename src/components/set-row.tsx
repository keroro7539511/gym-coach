"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateSetLog, deleteSetLog } from "@/lib/actions/set-logs";
import type { SetLog } from "@/lib/db/schema";

interface Props {
  set: SetLog;
  weightSuggestion: number | null;
  readOnly?: boolean;
}

export function SetRow({ set, weightSuggestion, readOnly = false }: Props) {
  const [local, setLocal] = useState({
    weightKg: set.weightKg ?? "",
    reps: set.reps ?? "",
    rpe: set.rpe ?? "",
    toFailure: set.toFailure,
    heartRateBpm: set.heartRateBpm ?? "",
  });
  const [pending, startTransition] = useTransition();
  const isInitialMount = useRef(true);

  // Debounced auto-save when local state changes (skip initial mount).
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (readOnly) return;
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

  return (
    <tr className="border-t">
      <td className="p-2 text-center text-sm font-medium">{set.setNumber}</td>
      <td className="p-1">
        <Input
          type="number"
          step="2.5"
          inputMode="decimal"
          value={local.weightKg}
          onChange={(e) =>
            setLocal((l) => ({ ...l, weightKg: e.target.value }))
          }
          placeholder={
            weightSuggestion != null ? `建議 ${weightSuggestion}kg` : "kg"
          }
          className="w-24 text-center"
          disabled={readOnly}
        />
      </td>
      <td className="p-1">
        <Input
          type="number"
          inputMode="numeric"
          value={local.reps}
          onChange={(e) => setLocal((l) => ({ ...l, reps: e.target.value }))}
          placeholder="次"
          className="w-20 text-center"
          disabled={readOnly}
        />
      </td>
      <td className="p-1">
        <Input
          type="number"
          min="1"
          max="10"
          value={local.rpe}
          onChange={(e) => setLocal((l) => ({ ...l, rpe: e.target.value }))}
          placeholder="1-10"
          className="w-20 text-center"
          disabled={readOnly}
        />
      </td>
      <td className="p-1 text-center">
        <input
          type="checkbox"
          checked={local.toFailure}
          onChange={(e) =>
            setLocal((l) => ({ ...l, toFailure: e.target.checked }))
          }
          className="size-5"
          disabled={readOnly}
        />
      </td>
      <td className="p-1">
        <Input
          type="number"
          inputMode="numeric"
          value={local.heartRateBpm}
          onChange={(e) =>
            setLocal((l) => ({ ...l, heartRateBpm: e.target.value }))
          }
          placeholder="bpm"
          className="w-20 text-center"
          disabled={readOnly}
        />
      </td>
      <td className="p-1 text-center">
        {!readOnly && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startTransition(() => deleteSetLog(set.id))}
            disabled={pending}
          >
            ✕
          </Button>
        )}
      </td>
    </tr>
  );
}
