import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db/connect";
import Course from "@/models/Course";
import Link from "next/link";
import Image from "next/image";
import { Plus, BookOpen, Users, Star, TrendingUp, Edit, Eye, BarChart2 } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";

async function getInstructorData(userId: string) {
  await connectDB();
  const courses = await Course.find({ instructor: userId }).sort({ updatedAt: -1 }).lean();
  const totalStudents = courses.reduce((a, c) => a + (c.stats?.totalStudents || 0), 0);
  const totalRevenue  = courses.reduce((a, c) => a + ((c.stats?.totalStudents || 0) * (c.price || 0)), 0);
  const avgRating     = courses.length > 0
    ? courses.reduce((a, c) => a + (c.stats?.averageRating || 0), 0) / courses.length
    : 0;
  return { courses, totalStudents, totalRevenue, avgRating };
}

export default async function InstructorPage() {
  const session = await auth();
  if (!["instructor", "admin"].includes((session?.user as any)?.role)) redirect("/dashboard");

  const { courses, totalStudents, totalRevenue, avgRating } = await getInstructorData((session?.user as any).id);

  const stats = [
    { label: "Total Students",  value: formatNumber(totalStudents), icon: Users,      color: "var(--brand)" },
    { label: "Total Revenue",   value: `$${totalRevenue.toFixed(0)}`, icon: TrendingUp, color: "#22c55e" },
    { label: "Avg. Rating",     value: avgRating > 0 ? avgRating.toFixed(1) + "★" : "—", icon: Star, color: "#f59e0b" },
    { label: "Published Courses",value: courses.filter(c => c.status === "published").length, icon: BookOpen, color: "var(--accent)" },
  ];

  const statusColor: Record<string, string> = {
    draft:     "#f59e0b",
    published: "#22c55e",
    archived:  "var(--muted)",
  };

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Instructor Studio</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Manage your courses and track performance</p>
        </div>
        <Link href="/instructor/courses/create" className="btn-primary">
          <Plus className="w-4 h-4" /> New Course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-5" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
              <Icon className="w-4.5 h-4.5" style={{ color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Courses table */}
      {courses.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: "var(--muted)" }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>No courses yet</h3>
          <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>Create your first course and start teaching.</p>
          <Link href="/instructor/courses/create" className="btn-primary">
            <Plus className="w-4 h-4" /> Create Course
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Your Courses</h2>
            <span className="text-sm" style={{ color: "var(--muted)" }}>{courses.length} total</span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {courses.map((course: any) => (
              <div key={course._id.toString()} className="flex items-center gap-4 p-4 hover:bg-[--surface-2] transition-colors"
                style={{ ["--surface-2" as any]: "var(--surface-2)" }}>
                {/* Thumbnail */}
                <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "var(--surface-2)" }}>
                  {course.thumbnail
                    ? <Image src={course.thumbnail} alt="" width={64} height={40} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4" style={{ color: "var(--muted)" }} /></div>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: "var(--foreground)" }}>{course.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{course.category} · {course.level}</p>
                </div>

                {/* Status */}
                <span className="badge text-xs hidden sm:inline-flex" style={{ background: `color-mix(in srgb, ${statusColor[course.status]} 12%, transparent)`, color: statusColor[course.status] }}>
                  {course.status}
                </span>

                {/* Metrics */}
                <div className="hidden md:flex items-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{formatNumber(course.stats?.totalStudents || 0)}</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" />{course.stats?.averageRating?.toFixed(1) || "—"}</span>
                  <span>{course.isFree ? "Free" : `$${course.price}`}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Link href={`/courses/${course.slug}`}
                    className="p-2 rounded-lg transition-colors" style={{ color: "var(--muted)" }}
                    onMouseEnter={(e: any) => { e.currentTarget.style.background = "var(--surface-2)"; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.background = "transparent"; }}>
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link href={`/instructor/courses/${course.slug}`}
                    className="p-2 rounded-lg transition-colors" style={{ color: "var(--muted)" }}
                    onMouseEnter={(e: any) => { e.currentTarget.style.background = "var(--surface-2)"; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.background = "transparent"; }}>
                    <Edit className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
