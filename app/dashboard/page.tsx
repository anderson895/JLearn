import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connect";
import { Enrollment, Progress } from "@/models/index";
import User from "@/models/User";
import Course from "@/models/Course";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Clock, Award, Flame, ArrowRight, ChevronRight, Play, Zap } from "lucide-react";
import CourseCard from "@/components/course/CourseCard";
import { formatDuration } from "@/lib/utils/format";

async function getDashboardData(userId: string) {
  await connectDB();
  const [user, enrollments, progressList] = await Promise.all([
    User.findById(userId).lean(),
    Enrollment.find({ user: userId, status: "active" })
      .populate({ path: "course", populate: { path: "instructor", select: "name image" } })
      .sort({ enrolledAt: -1 }).limit(12).lean(),
    Progress.find({ user: userId }).lean(),
  ]);
  const progressMap = new Map(progressList.map(p => [p.course.toString(), p]));
  const enrolledCourses = enrollments.map((e: any) => ({
    ...e.course, enrolledAt: e.enrolledAt, progress: progressMap.get(e.course._id.toString()),
  }));
  const inProgress  = enrolledCourses.filter(c => c.progress?.percentComplete > 0 && c.progress?.percentComplete < 100);
  const completed   = enrolledCourses.filter(c => c.progress?.percentComplete === 100);
  const recommended = await Course.find({ status: "published", _id: { $nin: enrolledCourses.map((c: any) => c._id) } })
    .populate("instructor", "name image").limit(4).lean();
  return { user, enrolledCourses, inProgress, completed, recommended };
}

export default async function DashboardPage() {
  const session = await auth();
  const { user, enrolledCourses, inProgress, completed, recommended } = await getDashboardData((session?.user as any).id);
  const u = user as any;

  const stats = [
    { label: "Enrolled",    value: enrolledCourses.length, icon: BookOpen,  color: "var(--brand)" },
    { label: "Hours",       value: Math.round(u?.stats?.totalHoursLearned || 0), icon: Clock, color: "var(--accent)" },
    { label: "Certificates",value: u?.certificates?.length || 0, icon: Award, color: "#f59e0b" },
    { label: "Day Streak",  value: u?.stats?.currentStreak || 0, icon: Flame, color: "#ef4444" },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-5" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
              <Icon className="w-4.5 h-4.5" style={{ color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Continue Learning */}
      {inProgress.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Continue Learning</h2>
            <Link href="/dashboard/courses" className="flex items-center gap-1 text-sm" style={{ color: "var(--brand)" }}>
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {inProgress.slice(0, 3).map((course: any) => (
              <Link key={course._id.toString()} href={`/learn/${course.slug}`}
                className="flex items-center gap-4 p-4 rounded-2xl group transition-all"
                style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                <div className="relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "var(--surface-2)" }}>
                  {course.thumbnail
                    ? <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                    : <div className="absolute inset-0 flex items-center justify-center"><BookOpen className="w-5 h-5" style={{ color: "var(--muted)" }} /></div>}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.4)" }}>
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>{course.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>{course.instructor?.name}</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted)" }}>
                      <span>{course.progress?.percentComplete || 0}% complete</span>
                      <span>{formatDuration(course.stats?.totalDuration || 0)}</span>
                    </div>
                    <div className="progress-bar-track" style={{ height: "4px" }}>
                      <div className="progress-bar-fill" style={{ width: `${course.progress?.percentComplete || 0}%`, height: "4px" }} />
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--muted)" }} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* AI Tutor banner */}
      <div className="rounded-2xl p-6 flex items-center justify-between" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-white" />
            <span className="font-semibold text-white text-sm">AI Tutor</span>
          </div>
          <p className="text-white/80 text-sm max-w-xs">Get instant help with anything from your courses, 24/7.</p>
        </div>
        <Link href="/dashboard/ai-tutor" className="flex-shrink-0 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
          Ask AI Tutor
        </Link>
      </div>

      {/* Recommended */}
      {recommended.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Recommended for You</h2>
            <Link href="/courses" className="flex items-center gap-1 text-sm" style={{ color: "var(--brand)" }}>
              Browse all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommended.map((c: any) => <CourseCard key={c._id.toString()} course={c} />)}
          </div>
        </section>
      )}

      {/* Empty state */}
      {enrolledCourses.length === 0 && (
        <div className="text-center py-20">
          <BookOpen className="w-14 h-14 mx-auto mb-4 opacity-30" style={{ color: "var(--muted)" }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>Start Your Learning Journey</h3>
          <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>You have not enrolled in any courses yet.</p>
          <Link href="/courses" className="btn-primary">Browse Courses <ArrowRight className="w-4 h-4" /></Link>
        </div>
      )}
    </div>
  );
}
