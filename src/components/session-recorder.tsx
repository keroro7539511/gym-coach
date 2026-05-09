"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExercisePicker } from "@/components/exercise-picker";
import { SetRow } from "@/components/set-row";
import { MUSCLE_GROUP_LABEL } from "@/components/exercise-form";
import {
  addExerciseToSession,
  removeExerciseFromSession,
  completeSession,
} from "@/lib/actions/sessions";
import { createSetLog } from "@/lib/actions/set-logs";
import type {
  Exercise,
  Session,
  SessionExercise,
  SetLog,
} from "@/lib/db/schema";

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
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">
          {studentName} · 第 {session.sessionNumber} 堂課
        </h1>
        <p className="text-sm text-muted-foreground">
          目標：
          {session.targetMuscleGroups
            .map((m) => MUSCLE_GROUP_LABEL[m] ?? m)
            .join("、")}
          {session.startedAt && (
            <> · 開始 {session.startedAt.slice(11, 16)}</>
          )}
          {isCompleted && <> · 已完成</>}
        </p>
      </header>

      <div className="space-y-6">
        {exercises.map(
          ({ sessionExercise, exercise, sets, weightSuggestion }) => (
            <div key={sessionExercise.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{exercise.name}</h3>
                {!isCompleted && (
                  <Button
                    variant="ghost"
                    size="sm"
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
                  </Button>
                )}
              </div>

              <table className="w-full">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="p-2">組</th>
                    <th className="p-2">重量</th>
                    <th className="p-2">次數</th>
                    <th className="p-2">RPE</th>
                    <th className="p-2">力竭</th>
                    <th className="p-2">心率</th>
                    <th className="p-2"></th>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    // 新組數預設：繼承上一組；如果還沒有任何組，用建議重量
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
                  disabled={pending}
                >
                  + 新增一組
                </Button>
              )}
            </div>
          )
        )}

        {!isCompleted && (
          <div className="flex gap-3">
            <ExercisePicker
              exercises={allExercises}
              onPick={async (exerciseId) => {
                await addExerciseToSession(session.id, exerciseId);
                router.refresh();
              }}
            />
          </div>
        )}
      </div>

      {!isCompleted && (
        <div className="mt-8 pt-6 border-t">
          <Button
            size="lg"
            onClick={() =>
              startTransition(async () => {
                if (
                  !confirm(
                    "確定要結束這堂課嗎？結束後就不能再加 / 改紀錄。"
                  )
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
