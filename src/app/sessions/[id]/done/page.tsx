import { notFound, redirect } from "next/navigation";
import { generateWeeklyPlan } from "@/lib/actions/weekly-plans";

export default async function SessionDonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const sessionId = Number(idStr);

  let weeklyPlanId: number;
  try {
    weeklyPlanId = await generateWeeklyPlan(sessionId);
  } catch (err) {
    if (err instanceof Error && err.message === "Session not found") {
      notFound();
    }
    throw err;
  }

  redirect(`/weekly-plans/${weeklyPlanId}`);
}
