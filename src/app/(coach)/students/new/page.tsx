import { StudentForm } from "@/components/student-form";
import { createStudent } from "@/lib/actions/students";

export default function NewStudentPage() {
  return (
    <div className="container mx-auto px-6 py-10 max-w-3xl">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          NEW STUDENT
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          新增學員
        </h1>
      </header>
      <StudentForm onSubmit={createStudent} submitLabel="建立學員" showPasswordField />
    </div>
  );
}
