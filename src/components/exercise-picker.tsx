"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MUSCLE_GROUP_LABEL } from "@/components/exercise-form";
import type { Exercise } from "@/lib/db/schema";

interface Props {
  exercises: Exercise[];
  onPick: (exerciseId: number) => Promise<void>;
}

export function ExercisePicker({ exercises, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(q.toLowerCase()) ||
      (e.nameEn ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full border-dashed h-14 text-sm uppercase tracking-wider font-semibold hover:border-amber-500 hover:text-amber-500"
      >
        + 新增動作
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-[var(--surface-2)] border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">選擇動作</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="搜尋動作名稱（中／英）…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            className="bg-[var(--surface-1)]"
          />
          <div className="space-y-1 mt-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                沒有匹配結果
              </p>
            ) : (
              filtered.map((e) => (
                <button
                  key={e.id}
                  disabled={pending}
                  className="w-full text-left p-3 rounded-md border border-border bg-transparent hover:border-amber-500 hover:bg-[var(--surface-3)] transition-colors flex justify-between items-center"
                  onClick={() => {
                    startTransition(async () => {
                      await onPick(e.id);
                      setOpen(false);
                      setQ("");
                    });
                  }}
                >
                  <span>
                    <span className="font-semibold">{e.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-2">
                      {MUSCLE_GROUP_LABEL[e.muscleGroup] ?? e.muscleGroup}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {e.equipment ?? ""}
                  </span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
