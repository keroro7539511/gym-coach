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
            {d.isClassDay && (
              <Text style={styles.classBadge}>上課日</Text>
            )}
          </View>

          <Text style={styles.h2}>飲食</Text>
          <View style={styles.card}>
            <Row label="早餐" value={d.mealBreakfast} />
            <Row label="午餐" value={d.mealLunch} />
            <Row label="晚餐" value={d.mealDinner} />
            <Row label="點心" value={d.mealSnacks} />
          </View>

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
