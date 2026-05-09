import { StudentForm } from "@/components/student-form";
import { createStudent } from "@/lib/actions/students";

export default function NewStudentPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">新增學員</h1>
      <StudentForm onSubmit={createStudent} submitLabel="建立學員" />
    </div>
  );
}
