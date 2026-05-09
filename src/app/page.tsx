import Link from "next/link";
import { db } from "@/lib/db/client";
import { sessions, students, weeklyPlans } from "@/lib/db/schema";
import { eq, isNull, desc, count } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage() {
  // 進行中課程
  const inProgress = db
    .select({
      sessionId: sessions.id,
      studentId: sessions.studentId,
      sessionNumber: sessions.sessionNumber,
      startedAt: sessions.startedAt,
      studentName: students.name,
    })
    .from(sessions)
    .innerJoin(students, eq(sessions.studentId, students.id))
    .where(eq(sessions.status, "in_progress"))
    .orderBy(desc(sessions.startedAt))
    .all();

  // 學員概況
  const studentCount = db
    .select({ c: count() })
    .from(students)
    .where(isNull(students.deletedAt))
    .get();

  const recentPlans = db
    .select({
      id: weeklyPlans.id,
      studentId: weeklyPlans.studentId,
      studentName: students.name,
      startDate: weeklyPlans.startDate,
      endDate: weeklyPlans.endDate,
    })
    .from(weeklyPlans)
    .innerJoin(students, eq(weeklyPlans.studentId, students.id))
    .orderBy(desc(weeklyPlans.generatedAt))
    .limit(5)
    .all();

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">今日課表</h1>

      {/* 進行中課程 */}
      <Card>
        <CardHeader>
          <CardTitle>進行中課程</CardTitle>
        </CardHeader>
        <CardContent>
          {inProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground">沒有進行中課程</p>
          ) : (
            <ul className="space-y-2">
              {inProgress.map((s) => (
                <li
                  key={s.sessionId}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div>
                    <span className="font-medium">{s.studentName}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      第 {s.sessionNumber} 堂 · 開始{" "}
                      {s.startedAt?.slice(11, 16) ?? "?"}
                    </span>
                  </div>
                  <Link
                    href={`/sessions/${s.sessionId}`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    繼續紀錄
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 概況 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>學員總數</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{studentCount?.c ?? 0}</p>
            <Link
              href="/students"
              className="text-xs text-primary hover:underline mt-2 inline-block"
            >
              查看所有學員 →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>本週產出</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{recentPlans.length}</p>
            <p className="text-xs text-muted-foreground mt-1">最近 5 份週計劃</p>
          </CardContent>
        </Card>
      </div>

      {/* 最近週計劃 */}
      <Card>
        <CardHeader>
          <CardTitle>最近的週計劃</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無紀錄</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {recentPlans.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between border-b pb-1 last:border-0"
                >
                  <span>
                    <span className="font-medium">{p.studentName}</span>
                    <span className="ml-2 text-muted-foreground">
                      {p.startDate} → {p.endDate}
                    </span>
                  </span>
                  <Link
                    href={`/weekly-plans/${p.id}`}
                    className="text-primary hover:underline"
                  >
                    查看 →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
