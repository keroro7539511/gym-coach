import { getStudent } from "@/lib/actions/students";
import { createInBodyRecord } from "@/lib/actions/inbody";
import { InBodyForm } from "@/components/inbody-form";
import { notFound } from "next/navigation";

export default async function NewInBodyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const student = await getStudent(Number(idStr));
  if (!student) notFound();

  return (
    <div className="space-y-6">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        新增 InBody 紀錄
      </h2>
      <InBodyForm studentId={student.id} onSubmit={createInBodyRecord} />
    </div>
  );
}
