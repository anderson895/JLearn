import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes  = ["/dashboard", "/learn", "/instructor", "/profile"];
const instructorPrefixes = ["/instructor"];
const adminPrefixes      = ["/admin"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected  = protectedPrefixes.some(p  => pathname.startsWith(p));
  const isInstructor = instructorPrefixes.some(p => pathname.startsWith(p));
  const isAdmin      = adminPrefixes.some(p      => pathname.startsWith(p));

  if (isProtected || isInstructor || isAdmin) {
    // Read the session token cookie (next-auth v5 uses this cookie name)
    const sessionToken =
      req.cookies.get("authjs.session-token")?.value ||
      req.cookies.get("__Secure-authjs.session-token")?.value;

    if (!sessionToken) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)"],
};
