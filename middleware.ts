import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

const protectedPrefixes  = ["/dashboard", "/learn", "/instructor", "/profile"];
const instructorPrefixes = ["/instructor"];
const adminPrefixes      = ["/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isProtected  = protectedPrefixes.some(p  => pathname.startsWith(p));
  const isInstructor = instructorPrefixes.some(p => pathname.startsWith(p));
  const isAdmin      = adminPrefixes.some(p      => pathname.startsWith(p));

  if (isProtected || isInstructor || isAdmin) {
    if (!session) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    const role = (session.user as any)?.role;
    if (isAdmin && role !== "admin")
      return NextResponse.redirect(new URL("/dashboard", req.url));
    if (isInstructor && !["instructor", "admin"].includes(role))
      return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)"],
};
