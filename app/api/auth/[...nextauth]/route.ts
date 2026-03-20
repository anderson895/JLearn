/**
 * Custom Auth route handler — Next.js 16 compatible.
 *
 * next-auth v5 beta vendors Next.js 15 internal paths (app-router-context.js)
 * that no longer exist in Next.js 16, so `import NextAuth from "next-auth"`
 * crashes on module evaluation. This file re-implements the handful of
 * endpoints that next-auth/react (SessionProvider, signIn, signOut) depends on,
 * using only:
 *
 *   - next-auth/jwt   (encode/decode — pure crypto, no Next.js internals)
 *   - Mongoose        (user upsert, same logic as the original signIn callback)
 *
 * Endpoints implemented:
 *   GET  /api/auth/session           ← useSession() polling
 *   GET  /api/auth/csrf              ← next-auth/react CSRF handshake
 *   GET  /api/auth/providers         ← next-auth/react provider list
 *   GET  /api/auth/signin/google     ← starts Google OAuth flow
 *   GET  /api/auth/callback/google   ← Google redirects back here
 *   GET  /api/auth/signout           ← signout page (next-auth/react checks this)
 *   POST /api/auth/signin            ← next-auth/react "start sign-in" POST
 *   POST /api/auth/signout           ← next-auth/react actual sign-out POST
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { encode, decode }            from "next-auth/jwt";

// ─── Constants ───────────────────────────────────────────────────────────────

const GOOGLE_AUTH_URL     = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL    = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

const COOKIE_NAME     = "authjs.session-token";
const COOKIE_NAME_SEC = "__Secure-authjs.session-token";

const SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET!;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBaseUrl(req: NextRequest): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`
  );
}

function getActiveCookieName(): string {
  return process.env.NODE_ENV === "production" ? COOKIE_NAME_SEC : COOKIE_NAME;
}

function setSessionCookie(response: NextResponse, token: string): void {
  const isSecure   = process.env.NODE_ENV === "production";
  const cookieName = getActiveCookieName();
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure:   isSecure,
    sameSite: "lax",
    maxAge:   SESSION_MAX_AGE,
    path:     "/",
  });
}

function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete(COOKIE_NAME);
  response.cookies.delete(COOKIE_NAME_SEC);
}

async function getSessionFromCookies(req: NextRequest) {
  const cookieName = getActiveCookieName();
  const sessionToken =
    req.cookies.get(cookieName)?.value ??
    req.cookies.get(COOKIE_NAME)?.value ??
    req.cookies.get(COOKIE_NAME_SEC)?.value;

  if (!sessionToken) return null;

  try {
    return await decode({ token: sessionToken, secret: SECRET, salt: cookieName });
  } catch {
    return null;
  }
}

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// ─── Route exports ───────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  const { nextauth } = await params;
  const [action, provider] = nextauth;

  switch (action) {
    case "session":   return handleSession(req);
    case "csrf":      return NextResponse.json({ csrfToken: "no-csrf" });
    case "providers": return handleProviders(req);
    case "signin":    return handleSigninGet(req, provider);
    case "callback":  return provider === "google" ? handleGoogleCallback(req) : notFound();
    case "signout":   return NextResponse.json({ url: getBaseUrl(req) });
    default:          return notFound();
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  const { nextauth } = await params;
  const [action] = nextauth;

  switch (action) {
    case "signin":  return handleSigninPost(req);
    case "signout": return handleSignoutPost(req);
    default:        return notFound();
  }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleSession(req: NextRequest) {
  const token = await getSessionFromCookies(req);
  if (!token) return NextResponse.json({});

  return NextResponse.json({
    user: {
      id:       token.id,
      name:     token.name,
      email:    token.email,
      image:    token.image,
      role:     token.role,
      headline: token.headline,
    },
    expires: new Date((token.exp as number) * 1000).toISOString(),
  });
}

function handleProviders(req: NextRequest) {
  const base = getBaseUrl(req);
  return NextResponse.json({
    google: {
      id:          "google",
      name:        "Google",
      type:        "oauth",
      signinUrl:   `${base}/api/auth/signin/google`,
      callbackUrl: `${base}/api/auth/callback/google`,
    },
  });
}

function handleSigninGet(req: NextRequest, provider?: string) {
  const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") ?? "/";
  const base        = getBaseUrl(req);

  if (provider !== "google") {
    return NextResponse.redirect(`${base}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const state   = Buffer.from(JSON.stringify({ callbackUrl })).toString("base64url");
  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set("client_id",     process.env.GOOGLE_CLIENT_ID!);
  authUrl.searchParams.set("redirect_uri",  `${base}/api/auth/callback/google`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope",         "openid email profile");
  authUrl.searchParams.set("state",         state);
  authUrl.searchParams.set("access_type",   "offline");
  authUrl.searchParams.set("prompt",        "consent");

  return NextResponse.redirect(authUrl.toString());
}

async function handleSigninPost(req: NextRequest) {
  const base = getBaseUrl(req);
  let callbackUrl = "/";

  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body  = await req.json();
      callbackUrl = body.callbackUrl ?? "/";
    } else {
      const body  = await req.formData();
      callbackUrl = body.get("callbackUrl")?.toString() ?? "/";
    }
  } catch {}

  return NextResponse.json({
    url: `${base}/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`,
  });
}

async function handleGoogleCallback(req: NextRequest) {
  const base     = getBaseUrl(req);
  const code     = req.nextUrl.searchParams.get("code");
  const rawState = req.nextUrl.searchParams.get("state");
  let   callbackUrl = "/";

  if (rawState) {
    try { callbackUrl = JSON.parse(Buffer.from(rawState, "base64url").toString()).callbackUrl ?? "/"; }
    catch {}
  }

  const errorRedirect = (err: string) =>
    NextResponse.redirect(`${base}/login?error=${err}`);

  if (!code) return errorRedirect("NoCode");

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  `${base}/api/auth/callback/google`,
        grant_type:    "authorization_code",
      }),
    });
    if (!tokenRes.ok) return errorRedirect("TokenExchange");
    const { access_token } = await tokenRes.json();

    // 2. Fetch Google user profile
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) return errorRedirect("UserInfo");
    const gUser = await userRes.json() as {
      sub: string; email: string; name: string; picture: string;
    };

    // 3. Upsert user in MongoDB (mirrors the original next-auth signIn callback)
    const { default: connectDB } = await import("@/lib/db/connect");
    const { default: User }      = await import("@/models/User");
    await connectDB();

    let dbUser: any = await User.findOne({ email: gUser.email }).lean();
    if (!dbUser) {
      dbUser = await User.create({
        email:         gUser.email,
        name:          gUser.name,
        image:         gUser.picture,
        provider:      "google",
        role:          "student",
        emailVerified: new Date(),
      });
    }

    // 4. Encode JWT — compatible with lib/auth/auth.ts decoder
    const now      = Math.floor(Date.now() / 1000);
    const jwtToken = await encode({
      token: {
        sub:      dbUser._id.toString(),
        id:       dbUser._id.toString(),
        name:     dbUser.name     ?? gUser.name,
        email:    dbUser.email,
        image:    dbUser.image    ?? gUser.picture,
        role:     dbUser.role     ?? "student",
        headline: dbUser.headline ?? undefined,
        iat:      now,
        exp:      now + SESSION_MAX_AGE,
        jti:      crypto.randomUUID(),
      },
      secret: SECRET,
      salt:   getActiveCookieName(),
      maxAge: SESSION_MAX_AGE,
    });

    // 5. Set cookie and smart redirect based on role
    // If user is instructor/admin → always go to studio regardless of callbackUrl
    // If callbackUrl is still the generic /dashboard → override based on role too
    const userRole = dbUser.role ?? "student";
    let finalDest: string;
    if (["instructor", "admin"].includes(userRole)) {
      finalDest = `${base}/instructor`;
    } else if (!callbackUrl || callbackUrl === "/" || callbackUrl === "/dashboard") {
      finalDest = `${base}/dashboard`;
    } else {
      finalDest = callbackUrl.startsWith("http") ? callbackUrl : `${base}${callbackUrl}`;
    }

    const response = NextResponse.redirect(finalDest);
    setSessionCookie(response, jwtToken);
    return response;

  } catch (err) {
    console.error("[auth] Google callback error:", err);
    return errorRedirect("CallbackError");
  }
}

async function handleSignoutPost(req: NextRequest) {
  const base = getBaseUrl(req);
  let callbackUrl = "/";

  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body  = await req.json();
      callbackUrl = body.callbackUrl ?? "/";
    } else {
      const body  = await req.formData();
      callbackUrl = body.get("callbackUrl")?.toString() ?? "/";
    }
  } catch {}

  const dest     = callbackUrl.startsWith("http") ? callbackUrl : `${base}${callbackUrl}`;
  const response = NextResponse.redirect(dest);
  clearSessionCookies(response);
  return response;
}