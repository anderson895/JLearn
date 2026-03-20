export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connect";
import Course from "@/models/Course";
import User from "@/models/User";
import { slugify } from "@/lib/utils/format";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!["instructor", "admin"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const courses = await Course.find({ instructor: (session.user as any).id }).sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!["instructor", "admin"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body   = await req.json();
  const userId = (session.user as any).id;
  await connectDB();

  let base = slugify(body.title), slug = base, n = 1;
  while (await Course.findOne({ slug })) slug = `${base}-${n++}`;

  const totalLessons = (body.sections || []).reduce((a: number, s: any) => a + (s.lessons?.length || 0), 0);
  const course = await Course.create({
    ...body, slug, instructor: userId, status: "draft",
    sections: body.sections || [],
    outcomes: (body.outcomes || []).filter(Boolean),
    requirements: (body.requirements || []).filter(Boolean),
    stats: { totalLessons, totalStudents: 0, averageRating: 0, totalReviews: 0, totalDuration: 0 },
  });
  await User.findByIdAndUpdate(userId, { $addToSet: { createdCourses: course._id } });
  return NextResponse.json({ course }, { status: 201 });
}