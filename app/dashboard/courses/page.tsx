import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connect";
import { Enrollment, Progress } from "@/models/index";
import Link from "next/link";
import { BookOpen, ArrowRight, Play, CheckCircle } from "lucide-react";
import CourseCard from "@/components/course/CourseCard";

async function getEnrolledCourses(userId: string) {
  await connectDB();
  const [enrollments, progressList] = await Promise.all([
    Enrollment.find({ user: userId, status: "active" })
      .populate({ path: "course", populate: { path: "instructor", select: "name image" } })
      .sort({ enrolledAt: -1 })
      .lean(),
    Progress.find({ user: userId }).lean(),
  ]);

  const progressMap = new Map(progressList.map(p => [p.course.toString(), p]));
  return enrollments.map((e: any) => ({
    ...e.course,
    enrolledAt: e.enrolledAt,
    progress: progressMap.get(e.course._id.toString()),
  }));
}

export default async function DashboardCoursesPage() {
  const session = await auth();
  const courses = await getEnrolledCourses((session?.user as any).id);

  const inProgress = courses.filter(c => (c.progress?.percentComplete || 0) > 0 && (c.progress?.percentComplete || 0) < 100);
  const completed  = courses.filter(c => (c.progress?.percentComplete || 0) === 100);
  const notStarted = courses.filter(c => !c.progress || c.progress.percentComplete === 0);

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BookOpen className="w-16 h-16 mb-4 opacity-20" style={{ color: "var(--muted)" }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>No courses yet</h2>
        <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>Browse our catalogue and enrol in your first course.</p>
        <Link href="/courses" className="btn-primary">
          Browse Courses <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>My Courses</h1>
        <Link href="/courses" className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--brand)" }}>
          Find more <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "In Progress", value: inProgress.length, color: "var(--brand)" },
          { label: "Completed",   value: completed.length,  color: "#22c55e" },
          { label: "Not Started", value: notStarted.length, color: "var(--muted)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-5 text-center" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* In Progress */}
      {inProgress.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Play className="w-4 h-4" style={{ color: "var(--brand)" }} />
            <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>In Progress</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {inProgress.map((c: any) => (
              <CourseCard key={c._id.toString()} course={c} showProgress progress={c.progress?.percentComplete || 0} />
            ))}
          </div>
        </section>
      )}

      {/* Not Started */}
      {notStarted.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4" style={{ color: "var(--muted)" }} />
            <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Not Started</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {notStarted.map((c: any) => (
              <CourseCard key={c._id.toString()} course={c} showProgress progress={0} />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4" style={{ color: "#22c55e" }} />
            <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Completed</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {completed.map((c: any) => (
              <CourseCard key={c._id.toString()} course={c} showProgress progress={100} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
