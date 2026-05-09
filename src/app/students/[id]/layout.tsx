import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudent } from "@/lib/actions/students";
import { Separator } from "@/components/ui/separator";

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const student = await getStudent(id);
  if (!student) notFound();

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">{student.name}</h1>
        <Link
          href={`/students/${id}/edit`}
          className="text-sm text-muted-foreground hover:underline"
        >
          編輯資料
        </Link>
      </div>
      <nav className="flex gap-4 text-sm mb-4">
        <Link href={`/students/${id}`} className="hover:underline">
          總覽
        </Link>
        <Link href={`/students/${id}/inbody`} className="hover:underline">
          InBody
        </Link>
        <Link href={`/students/${id}/sessions`} className="hover:underline">
          訓練紀錄
        </Link>
      </nav>
      <Separator className="mb-6" />
      {children}
    </div>
  );
}
