import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connect";
import User from "@/models/User";
import { Enrollment, Progress } from "@/models/index";
import { BarChart2, Clock, Flame, Award, TrendingUp } from "lucide-react";
import { formatDuration } from "@/lib/utils/format";

async function getAnalytics(userId: string) {
  await connectDB();
  const [user, enrollments, progressList] = await Promise.all([
    User.findById(userId).lean() as any,
    Enrollment.find({ user: userId, status: "active" }).lean(),
    Progress.find({ user: userId }).lean() as unknown as any[],
  ]);

  const completedCourses = progressList.filter(p => p.percentComplete === 100).length;
  const totalWatched = progressList.reduce((a, p) => {
    const ws = p.watchedSeconds as Map<string, number> | undefined;
    if (!ws) return a;
    let sum = 0;
    ws.forEach((v: number) => { sum += v; });
    return a + sum;
  }, 0);

  return { user, enrollments: enrollments.length, completedCourses, totalWatched, progressList };
}

export default async function AnalyticsPage() {
  const session = await auth();
  const { user, enrollments, completedCourses, totalWatched } = await getAnalytics((session?.user as any).id);
  const u = user as any;

  const cards = [
    { label: "Courses Enrolled",    value: enrollments,       icon: BarChart2, color: "var(--brand)" },
    { label: "Courses Completed",   value: completedCourses,  icon: Award,     color: "#22c55e" },
    { label: "Hours Watched",       value: formatDuration(totalWatched), icon: Clock, color: "var(--accent)" },
    { label: "Current Streak",      value: `${u?.stats?.currentStreak || 0} days`, icon: Flame, color: "#ef4444" },
    { label: "Longest Streak",      value: `${u?.stats?.longestStreak || 0} days`, icon: TrendingUp, color: "#f59e0b" },
    { label: "Points Earned",       value: u?.stats?.points || 0, icon: Award, color: "#a855f7" },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Learning Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
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

      {/* Level & Points */}
      <div className="rounded-2xl p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Level {u?.stats?.level || 1}</h2>
          <span className="text-sm font-medium" style={{ color: "var(--brand)" }}>{u?.stats?.points || 0} XP</span>
        </div>
        <div className="progress-bar-track" style={{ height: "8px" }}>
          <div className="progress-bar-fill" style={{ width: `${((u?.stats?.points || 0) % 1000) / 10}%`, height: "8px" }} />
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          {1000 - ((u?.stats?.points || 0) % 1000)} XP until level {(u?.stats?.level || 1) + 1}
        </p>
      </div>
    </div>
  );
}
