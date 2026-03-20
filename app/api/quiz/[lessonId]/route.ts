import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connect";
import { Quiz, Progress } from "@/models/index";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  await connectDB();

  const quiz = await Quiz.findOne({ lesson: lessonId }).lean();
  if (!quiz) return NextResponse.json({ quiz: null });

  const userId   = (session.user as any).id;
  const progress = await Progress.findOne({ user: userId }).lean() as any;
  const scores   = progress?.quizScores;

  return NextResponse.json({
    quiz,
    previousScore: scores?.get?.(lessonId)?.score,
    attempts:      scores?.get?.(lessonId)?.attempts || 0,
  });
}
