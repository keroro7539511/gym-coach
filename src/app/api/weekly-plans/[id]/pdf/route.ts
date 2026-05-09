import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { db } from "@/lib/db/client";
import { weeklyPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderWeeklyPlanPdf } from "@/lib/actions/render-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  let plan = db
    .select()
    .from(weeklyPlans)
    .where(eq(weeklyPlans.id, id))
    .get();
  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 確保 PDF 已產出（若沒有就生成）
  let needsRender = !plan.pdfPath;
  if (plan.pdfPath) {
    try {
      await stat(plan.pdfPath);
    } catch {
      needsRender = true;
    }
  }

  if (needsRender) {
    await renderWeeklyPlanPdf(id);
    plan = db
      .select()
      .from(weeklyPlans)
      .where(eq(weeklyPlans.id, id))
      .get()!;
  }

  if (!plan.pdfPath) {
    return NextResponse.json({ error: "PDF not generated" }, { status: 500 });
  }
  const buffer = await readFile(plan.pdfPath);
  const fileName = plan.pdfPath.split("/").pop() ?? "weekly-plan.pdf";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}
