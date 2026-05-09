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

  const filtered = exercises.filter((e) => {
    const term = q.toLowerCase();
    if (!term) return true;
    return (
      e.name.toLowerCase().includes(term) ||
      (e.nameEn?.toLowerCase().includes(term) ?? false)
    );
  });

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        + 新增動作
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>選擇動作</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="搜尋動作名稱…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          <div className="space-y-1 mt-4">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">沒有匹配結果</p>
            ) : (
              filtered.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  disabled={pending}
                  className="w-full text-left p-3 rounded border hover:bg-accent flex justify-between items-center disabled:opacity-50"
                  onClick={() => {
                    startTransition(async () => {
                      await onPick(e.id);
                      setOpen(false);
                      setQ("");
                    });
                  }}
                >
                  <span>
                    <span className="font-medium">{e.name}</span>{" "}
                    <span className="text-xs text-muted-foreground ml-2">
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
