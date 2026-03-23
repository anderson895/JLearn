export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connect";
import Course from "@/models/Course";
import "@/models/User";
import { cacheGet, cacheSet, cacheDel, CacheKeys } from "@/lib/cache/redis";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cached = await cacheGet(CacheKeys.course(slug));
  if (cached) return NextResponse.json(cached);

  await connectDB();
  const course = await Course.findOne({ slug, status: "published" })
    .populate("instructor", "name image headline bio")
    .lean();
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = { course };
  await cacheSet(CacheKeys.course(slug), result, 600);
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slug } = await params;
    const body = await req.json();
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    await connectDB();
    const course = await Course.findOne({ slug });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    if (course.instructor.toString() !== userId && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (Array.isArray(body.sections)) {
      body["stats.totalLessons"] = body.sections.reduce((acc: number, section: any) => acc + (section.lessons?.length || 0), 0);
      body["stats.totalDuration"] = body.sections.reduce(
        (acc: number, section: any) => acc + (section.lessons?.reduce((lessonAcc: number, lesson: any) => lessonAcc + (lesson.duration || 0), 0) || 0),
        0
      );
    }
    if (body.status === "published" && !course.publishedAt) body.publishedAt = new Date();

    const updated = await Course.findByIdAndUpdate(course._id, { $set: body }, { new: true })
      .populate("instructor", "name image headline");

    await cacheDel(CacheKeys.course(slug));
    return NextResponse.json({ course: updated });
  } catch (error: any) {
    const message = typeof error?.message === "string" ? error.message : "Failed to update course";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const userId = (session.user as any).id;
  const role   = (session.user as any).role;

  await connectDB();
  const course = await Course.findOne({ slug });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (course.instructor.toString() !== userId && role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await Course.findByIdAndUpdate(course._id, { status: "archived" });
  await cacheDel(CacheKeys.course(slug));
  return NextResponse.json({ success: true });
}
