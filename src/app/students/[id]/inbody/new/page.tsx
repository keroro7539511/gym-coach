import { getStudent } from "@/lib/actions/students";
import { createInBodyRecord } from "@/lib/actions/inbody";
import { InBodyForm } from "@/components/inbody-form";
import { notFound } from "next/navigation";

export default async function NewInBodyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudent(Number(id));
  if (!student) notFound();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">新增 InBody 紀錄</h2>
      <InBodyForm studentId={student.id} onSubmit={createInBodyRecord} />
    </div>
  );
}
