import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connect";
import { Progress } from "@/models/index";
import Course from "@/models/Course";

export async function POST(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const { courseSlug, score, passed } = await req.json();
  const userId = (session.user as any).id;

  await connectDB();
  const course = await Course.findOne({ slug: courseSlug });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const progress = await Progress.findOne({ user: userId, course: course._id });
  if (!progress) return NextResponse.json({ error: "No progress record" }, { status: 404 });

  const scores   = progress.quizScores as any;
  const existing = scores.get(lessonId) || { attempts: 0 };
  scores.set(lessonId, { score, passed, attempts: (existing.attempts || 0) + 1 });

  if (passed && !progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
    const total = course.sections.reduce((a: number, s: any) => a + s.lessons.length, 0);
    progress.percentComplete = total > 0 ? Math.round((progress.completedLessons.length / total) * 100) : 0;
  }

  await progress.save();
  return NextResponse.json({ success: true, score, passed });
}
