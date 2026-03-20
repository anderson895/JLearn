export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth }       from "@/lib/auth/auth";
import connectDB      from "@/lib/db/connect";
import User           from "@/models/User";
import { encode }     from "next-auth/jwt";
import { AUTH_SECRET, COOKIE_NAME, COOKIE_NAME_SEC } from "@/lib/auth/auth";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const role   = (session.user as any).role;

  if (["instructor", "admin"].includes(role)) {
    return NextResponse.json({ error: "Already an instructor" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { role: "instructor" } },
    { new: true }
  ).lean() as any;

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Re-issue JWT with updated role
  const isSecure        = process.env.NODE_ENV === "production";
  const cookieName      = isSecure ? COOKIE_NAME_SEC : COOKIE_NAME;
  const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
  const now             = Math.floor(Date.now() / 1000);

  const newToken = await encode({
    token: {
      sub:      userId,
      id:       userId,
      name:     user.name,
      email:    user.email,
      image:    user.image,
      role:     "instructor",
      headline: user.headline,
      iat:      now,
      exp:      now + SESSION_MAX_AGE,
      jti:      crypto.randomUUID(),
    },
    secret: AUTH_SECRET,
    salt:   cookieName,
    maxAge: SESSION_MAX_AGE,
  });

  // Set cookie via NextResponse — cookies() from next/headers cannot set
  // cookies in route handlers reliably in Next.js App Router
  const response = NextResponse.json({ success: true, role: "instructor" });
  response.cookies.set(cookieName, newToken, {
    httpOnly: true,
    secure:   isSecure,
    sameSite: "lax",
    maxAge:   SESSION_MAX_AGE,
    path:     "/",
  });

  return response;
}