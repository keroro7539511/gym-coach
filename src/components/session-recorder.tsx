"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExercisePicker } from "@/components/exercise-picker";
import { SetRow } from "@/components/set-row";
import { StatusBadge } from "@/components/ui/badge-status";
import { MUSCLE_GROUP_LABEL } from "@/components/exercise-form";
import {
  addExerciseToSession,
  removeExerciseFromSession,
  completeSession,
} from "@/lib/actions/sessions";
import { createSetLog } from "@/lib/actions/set-logs";
import type { Exercise, Session, SessionExercise, SetLog } from "@/lib/db/schema";

interface Props {
  session: Session;
  exercises: {
    sessionExercise: SessionExercise;
    exercise: Exercise;
    sets: SetLog[];
    weightSuggestion: number | null;
  }[];
  allExercises: Exercise[];
  studentName: string;
}

export function SessionRecorder({
  session,
  exercises,
  allExercises,
  studentName,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isCompleted = session.status === "completed";

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-5xl">
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {studentName}
          </h1>
          <p className="text-sm font-mono text-muted-foreground mt-1.5">
            第 <span className="text-amber-500 font-bold">{session.sessionNumber}</span> 堂 ·{" "}
            目標{" "}
            <span className="text-foreground">
              {session.targetMuscleGroups
                .map((m) => MUSCLE_GROUP_LABEL[m] ?? m)
                .join("、")}
            </span>
            {session.startedAt && (
              <>
                {" · "}
                <span className="text-muted-foreground">
                  {session.startedAt.slice(11, 16)} 開始
                </span>
              </>
            )}
          </p>
        </div>
        <StatusBadge variant={isCompleted ? "completed" : "live"}>
          {isCompleted ? "已完成" : "RECORDING"}
        </StatusBadge>
      </header>

      <div className="space-y-4">
        {exercises.map(
          ({ sessionExercise, exercise, sets, weightSuggestion }) => (
            <div
              key={sessionExercise.id}
              className="rounded-xl border border-border bg-[var(--surface-2)] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-bold">{exercise.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-[var(--surface-3)] px-2 py-0.5 rounded">
                    {MUSCLE_GROUP_LABEL[exercise.muscleGroup] ?? exercise.muscleGroup}
                  </span>
                  {weightSuggestion != null && !isCompleted && (
                    <span className="text-[11px] font-mono text-amber-500">
                      ↑ 建議 {weightSuggestion}kg
                    </span>
                  )}
                </div>
                {!isCompleted && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-rose-500 transition-colors"
                    onClick={() =>
                      startTransition(() =>
                        removeExerciseFromSession(
                          sessionExercise.id,
                          session.id
                        )
                      )
                    }
                    disabled={pending}
                  >
                    刪除動作
                  </button>
                )}
              </div>

              <table className="w-full">
                <thead>
                  <tr>
                    {["組", "重量 kg", "次數", "RPE", "力竭", "心率", ""].map(
                      (h, i) => (
                        <th
                          key={i}
                          className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground text-left pb-2 px-2 first:pl-0 last:pr-0"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sets.map((s) => (
                    <SetRow
                      key={s.id}
                      set={s}
                      weightSuggestion={weightSuggestion}
                      readOnly={isCompleted}
                    />
                  ))}
                </tbody>
              </table>

              {!isCompleted && (
                <button
                  type="button"
                  className="mt-3 w-full border border-dashed border-border rounded-md py-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:border-amber-500 hover:text-amber-500 transition-colors"
                  disabled={pending}
                  onClick={() => {
                    const last = sets[sets.length - 1];
                    startTransition(async () => {
                      await createSetLog({
                        sessionExerciseId: sessionExercise.id,
                        setNumber: sets.length + 1,
                        weightKg:
                          last?.weightKg ?? weightSuggestion ?? null,
                        reps: last?.reps ?? null,
                        rpe: null,
                        toFailure: false,
                      });
                      router.refresh();
                    });
                  }}
                >
                  + 新增一組
                </button>
              )}
            </div>
          )
        )}

        {!isCompleted && (
          <ExercisePicker
            exercises={allExercises}
            onPick={async (exerciseId) => {
              await addExerciseToSession(session.id, exerciseId);
              router.refresh();
            }}
          />
        )}
      </div>

      {!isCompleted && (
        <div className="mt-10 pt-6 border-t border-[var(--border-subtle)] flex justify-end">
          <Button
            size="lg"
            className="uppercase tracking-[0.15em] font-extrabold"
            onClick={() =>
              startTransition(async () => {
                if (
                  !confirm("確定要結束這堂課嗎？結束後就不能再加 / 改紀錄。")
                )
                  return;
                await completeSession(session.id);
                router.refresh();
              })
            }
            disabled={pending}
          >
            完成課程
          </Button>
        </div>
      )}
    </div>
  );
}
