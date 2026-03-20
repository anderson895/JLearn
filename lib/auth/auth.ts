/**
 * auth.ts — Next.js 16 compatible auth module.
 *
 * next-auth v5 beta vendors Next.js 15 internal paths (app-router-context.js)
 * that no longer exist in Next.js 16, crashing on import. This file avoids
 * importing `next-auth` (the main package) entirely. Instead:
 *
 *  - auth()   reads the JWT cookie directly via next/headers cookies() (async-safe)
 *             and decodes it with next-auth/jwt (pure crypto, no Next.js internals).
 *  - signIn / signOut are handled client-side via next-auth/react, which calls
 *             our custom /api/auth/[...nextauth] route.
 */
import { cookies } from "next/headers";
import { decode }  from "next-auth/jwt";
import type { Session } from "next-auth";

export const COOKIE_NAME     = "authjs.session-token";
export const COOKIE_NAME_SEC = "__Secure-authjs.session-token";
export const AUTH_SECRET     = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET!;

/**
 * Server-side session reader. Drop-in replacement for next-auth's auth().
 * Works in Server Components, API routes, and layouts.
 */
export async function auth(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();

    const isSecure   = process.env.NODE_ENV === "production";
    const activeName = isSecure ? COOKIE_NAME_SEC : COOKIE_NAME;

    const sessionToken =
      cookieStore.get(activeName)?.value ??
      cookieStore.get(COOKIE_NAME)?.value ??
      cookieStore.get(COOKIE_NAME_SEC)?.value;

    if (!sessionToken) return null;

    const token = await decode({
      token:  sessionToken,
      secret: AUTH_SECRET,
      salt:   activeName,
    });

    if (!token) return null;

    return {
      user: {
        id:       token.id       as string,
        name:     token.name     as string,
        email:    token.email    as string,
        image:    token.image    as string,
        role:     token.role     as string,
        headline: token.headline as string | undefined,
      },
      expires: new Date((token.exp as number) * 1000).toISOString(),
    } as Session;
  } catch {
    return null;
  }
}