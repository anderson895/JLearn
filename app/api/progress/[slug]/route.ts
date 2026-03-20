import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connect";
import { Progress, Enrollment } from "@/models/index";
import Course from "@/models/Course";
import User from "@/models/User";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  await connectDB();
  const course = await Course.findOne({ slug }).lean();
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const progress = await Progress.findOne({ user: (session.user as any).id, course: (course as any)._id }).lean();
  return NextResponse.json({ progress });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const { lessonId, watchedSeconds, completed } = await req.json();
  const userId = (session.user as any).id;

  await connectDB();
  const course = await Course.findOne({ slug });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const enrollment = await Enrollment.findOne({ user: userId, course: course._id, status: "active" });
  if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 403 });

  let progress = await Progress.findOne({ user: userId, course: course._id });
  if (!progress) progress = new Progress({ user: userId, course: course._id });

  if (watchedSeconds && lessonId) {
    const ws = progress.watchedSeconds as any;
    ws.set(lessonId, Math.max(ws.get(lessonId) || 0, watchedSeconds));
    progress.currentLesson = lessonId;
  }

  if (completed && lessonId && !progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
    const total = course.sections.reduce((a: number, s: any) => a + s.lessons.length, 0);
    progress.percentComplete = total > 0 ? Math.round((progress.completedLessons.length / total) * 100) : 0;

    if (progress.percentComplete === 100 && !progress.completedAt) {
      progress.completedAt = new Date();
      await User.findByIdAndUpdate(userId, {
        $inc: { "stats.totalCoursesCompleted": 1, "stats.points": 500 },
        "stats.lastActiveDate": new Date(),
      });
    }
  }

  await progress.save();
  await updateStreak(userId);
  return NextResponse.json({ progress, percentComplete: progress.percentComplete });
}

async function updateStreak(userId: string) {
  const user = await User.findById(userId);
  if (!user) return;
  const today = new Date();
  const last  = user.stats?.lastActiveDate;
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (!last || !sameDay(last, today)) {
    const yesterday = new Date(today.getTime() - 86400000);
    const streak = last && sameDay(last, yesterday) ? (user.stats?.currentStreak || 0) + 1 : 1;
    await User.findByIdAndUpdate(userId, {
      "stats.lastActiveDate": today,
      "stats.currentStreak": streak,
      "stats.longestStreak": Math.max(streak, user.stats?.longestStreak || 0),
    });
  }
}
