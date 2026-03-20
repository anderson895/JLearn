import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connect";
import { Progress } from "@/models/index";
import Course from "@/models/Course";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const lessonId = new URL(req.url).searchParams.get("lessonId");
  await connectDB();
  const course = await Course.findOne({ slug }).lean() as any;
  if (!course) return NextResponse.json({ notes: [] });

  const progress = await Progress.findOne({ user: (session.user as any).id, course: course._id }).lean() as any;
  const notes = lessonId
    ? (progress?.notes || []).filter((n: any) => n.lessonId === lessonId)
    : (progress?.notes || []);
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const { lessonId, content, timestamp } = await req.json();
  const userId = (session.user as any).id;

  await connectDB();
  const course = await Course.findOne({ slug }).lean() as any;
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await Progress.findOneAndUpdate(
    { user: userId, course: course._id },
    { $push: { notes: { lessonId, content, timestamp: timestamp || 0, createdAt: new Date() } } },
    { upsert: true }
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const { lessonId, noteIndex } = await req.json();
  const userId = (session.user as any).id;

  await connectDB();
  const course  = await Course.findOne({ slug }).lean() as any;
  const progress = await Progress.findOne({ user: userId, course: course._id });
  if (!progress) return NextResponse.json({ error: "Not found" }, { status: 404 });

  progress.notes = progress.notes.filter(
    (n: any, i: number) => !(n.lessonId === lessonId && i === noteIndex)
  ) as any;
  await progress.save();
  return NextResponse.json({ success: true });
}
