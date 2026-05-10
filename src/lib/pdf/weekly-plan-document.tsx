import "server-only";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { registerFonts } from "./font-register";
import type {
  WeeklyPlan,
  DailyPlan,
  Student,
  InBodyRecord,
} from "@/lib/db/schema";

registerFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansTC",
    fontSize: 10,
    padding: 32,
    color: "#1a1a1a",
  },
  h1: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  h2: { fontSize: 13, fontWeight: "bold", marginTop: 12, marginBottom: 6 },
  h3: { fontSize: 11, fontWeight: "bold", marginTop: 8, marginBottom: 4 },
  muted: { color: "#666" },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 80, color: "#666" },
  value: { flex: 1 },
  card: {
    border: "1pt solid #ddd",
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  classBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    alignSelf: "flex-start",
  },
  gymBadge: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    alignSelf: "flex-start",
    marginLeft: 4,
  },
  muscleTag: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
    fontSize: 9,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 6,
  },
  gymRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 3,
    flexWrap: "wrap" as const,
  },
  gymNote: {
    fontSize: 8,
    color: "#666",
    marginLeft: 2,
    marginBottom: 4,
  },
  nutritionGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 4,
    marginBottom: 2,
  },
  nutritionItem: {
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    minWidth: 58,
  },
  nutritionLabel: { fontSize: 7, color: "#888", marginBottom: 1 },
  nutritionValue: { fontSize: 10, fontWeight: "bold" as const },
});

const DAY_LABEL = ["日", "一", "二", "三", "四", "五", "六"];

interface SessionSummary {
  exerciseName: string;
  bestSet: string;
}

interface Props {
  plan: WeeklyPlan;
  days: DailyPlan[];
  student: Student;
  latestInbody: InBodyRecord | null;
  prevInbody: InBodyRecord | null;
  sessionSummary: SessionSummary[];
}

export function WeeklyPlanDocument({
  plan,
  days,
  student,
  latestInbody,
  prevInbody,
  sessionSummary,
}: Props) {
  return (
    <Document>
      {/* 封面 / 總覽 */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>
          {student.name} · 訓練計劃
        </Text>
        <Text style={styles.muted}>
          區間 {plan.startDate} ～ {plan.endDate}
        </Text>

        <Text style={styles.h2}>本次訓練紀錄</Text>
        {sessionSummary.length === 0 ? (
          <Text style={styles.muted}>無紀錄</Text>
        ) : (
          sessionSummary.map((s, i) => (
            <Text key={i}>
              · {s.exerciseName}：{s.bestSet}
            </Text>
          ))
        )}

        <Text style={styles.h2}>教練的話</Text>
        <Text>
          {plan.coachOverallMessage || "（請手動填寫）"}
        </Text>

        {latestInbody && (
          <>
            <Text style={styles.h2}>InBody 對照</Text>
            <InBodyDelta latest={latestInbody} prev={prevInbody} />
          </>
        )}

        <Text style={styles.h2}>本週目標數字</Text>
        <Text>
          ・水分：每天 2500ml
        </Text>
        <Text>
          ・睡眠：每天 7–8 小時
        </Text>
        <Text>
          ・走路 / 有氧：見每日頁
        </Text>
      </Page>

      {/* 7 天每天一頁 */}
      {days.map((d) => (
        <Page key={d.id} size="A4" style={styles.page}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.h1}>
              {d.date} · 星期{DAY_LABEL[d.dayOfWeek]}
            </Text>
            <View style={{ flexDirection: "row" }}>
              {d.isClassDay && (
                <Text style={styles.classBadge}>上課日</Text>
              )}
              {!d.isClassDay && d.isGymDay && (
                <Text style={styles.gymBadge}>自主健身</Text>
              )}
            </View>
          </View>

          {/* 訓練計劃 */}
          {d.gymWorkout && d.gymWorkout.length > 0 && (
            <>
              <Text style={styles.h2}>
                {d.isClassDay ? "訓練計劃" : "自主健身計劃"}
              </Text>
              <View style={styles.card}>
                {d.gymWorkout.map((block, i) => (
                  <View key={i}>
                    <View style={styles.gymRow}>
                      <Text style={styles.muscleTag}>{block.muscleGroup}</Text>
                      <Text>
                        {block.sets} 組 × {block.reps} 下
                        {block.weightKg != null ? `・${block.weightKg} kg` : "・徒手"}
                        {`・休息 ${block.restSeconds} 秒`}
                      </Text>
                    </View>
                    {block.notes ? (
                      <Text style={styles.gymNote}>  ↳ {block.notes}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={styles.h2}>飲食</Text>
          <View style={styles.card}>
            <Row label="早餐" value={d.mealBreakfast} />
            <Row label="午餐" value={d.mealLunch} />
            <Row label="晚餐" value={d.mealDinner} />
            <Row label="點心" value={d.mealSnacks} />
          </View>

          {(d.nutritionCaloriesKcal || d.nutritionProteinG || d.nutritionCarbsG || d.nutritionFatG) && (
            <>
              <Text style={styles.h2}>每日營養目標</Text>
              <View style={styles.nutritionGrid}>
                {d.nutritionCaloriesKcal != null && (
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>熱量</Text>
                    <Text style={styles.nutritionValue}>{d.nutritionCaloriesKcal} kcal</Text>
                  </View>
                )}
                {d.nutritionProteinG != null && (
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>蛋白質</Text>
                    <Text style={styles.nutritionValue}>{d.nutritionProteinG} g</Text>
                  </View>
                )}
                {d.nutritionCarbsG != null && (
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>碳水</Text>
                    <Text style={styles.nutritionValue}>{d.nutritionCarbsG} g</Text>
                  </View>
                )}
                {d.nutritionFatG != null && (
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>脂肪</Text>
                    <Text style={styles.nutritionValue}>{d.nutritionFatG} g</Text>
                  </View>
                )}
                {d.nutritionFiberG != null && (
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>纖維</Text>
                    <Text style={styles.nutritionValue}>{d.nutritionFiberG} g</Text>
                  </View>
                )}
              </View>
            </>
          )}

          <Text style={styles.h2}>運動目標</Text>
          <View style={styles.card}>
            <Row
              label="走路"
              value={
                d.walkingStepsTarget
                  ? `${d.walkingStepsTarget} 步`
                  : "—"
              }
            />
            <Row
              label="有氧"
              value={
                d.cardioMinutesTarget != null
                  ? `${d.cardioMinutesTarget} 分鐘`
                  : "—"
              }
            />
          </View>

          {d.extraExercises && d.extraExercises.length > 0 && (
            <>
              <Text style={styles.h2}>補充小訓練</Text>
              <View style={styles.card}>
                {d.extraExercises.map((ex, i) => (
                  <Text key={i}>
                    · {ex.name} {ex.sets} 組 × {ex.reps} 下
                  </Text>
                ))}
              </View>
            </>
          )}

          <Text style={styles.h2}>水分 / 睡眠</Text>
          <View style={styles.card}>
            <Row
              label="水分"
              value={d.waterTargetMl ? `${d.waterTargetMl} ml` : "2500 ml"}
            />
            <Row
              label="睡眠"
              value={
                d.sleepTargetHoursMin && d.sleepTargetHoursMax
                  ? `${d.sleepTargetHoursMin}–${d.sleepTargetHoursMax} 小時`
                  : "7–8 小時"
              }
            />
          </View>

          {d.coachMessage && (
            <>
              <Text style={styles.h2}>教練提醒</Text>
              <View style={styles.card}>
                <Text>{d.coachMessage}</Text>
              </View>
            </>
          )}
        </Page>
      ))}
    </Document>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  );
}

function InBodyDelta({
  latest,
  prev,
}: {
  latest: InBodyRecord;
  prev: InBodyRecord | null;
}) {
  const fmt = (a?: number | null, b?: number | null, unit = "") => {
    if (a == null) return "—";
    if (b == null) return `${a}${unit}`;
    const d = +(a - b).toFixed(1);
    const sign = d > 0 ? "+" : "";
    return `${a}${unit}（${sign}${d}${unit}）`;
  };
  return (
    <View style={styles.card}>
      <Row label="體重" value={fmt(latest.weightKg, prev?.weightKg, "kg")} />
      <Row label="體脂率" value={fmt(latest.bodyFatPct, prev?.bodyFatPct, "%")} />
      <Row
        label="骨骼肌"
        value={fmt(latest.skeletalMuscleKg, prev?.skeletalMuscleKg, "kg")}
      />
      <Row label="BMI" value={fmt(latest.bmi, prev?.bmi)} />
      {latest.bmrKcal != null && (
        <Row label="BMR" value={`${latest.bmrKcal} kcal`} />
      )}
    </View>
  );
}
