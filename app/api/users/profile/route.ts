export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connect";
import User from "@/models/User";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, headline, bio } = await req.json();
  const userId = (session.user as any).id;

  await connectDB();
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { name, headline, bio } },
    { new: true }
  ).lean();

  return NextResponse.json({ user });
}

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById((session.user as any).id)
    .select("-__v")
    .lean();
  return NextResponse.json({ user });
}