import Link from "next/link";
import { ArrowLeft, FileSearch } from "lucide-react";

export default function InstructorCourseNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center rounded-3xl p-8" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
        <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)", color: "var(--brand)" }}>
          <FileSearch className="w-8 h-8" />
        </div>
        <p className="text-sm font-semibold mb-2" style={{ color: "var(--brand)" }}>Course not found</p>
        <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--foreground)" }}>Walang ma-edit na course dito.</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Baka maling slug ang nabuksan mo o na-delete na ang course. Bumalik sa Instructor Studio para pumili ng valid na course.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/instructor" className="btn-primary">
            <ArrowLeft className="w-4 h-4" /> Back to Instructor
          </Link>
          <Link href="/instructor/courses/create" className="btn-outline">
            Create New Course
          </Link>
        </div>
      </div>
    </div>
  );
}
