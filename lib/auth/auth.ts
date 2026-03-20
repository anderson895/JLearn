import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient, ServerApiVersion } from "mongodb";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import type { Session } from "next-auth";

const client = new MongoClient(process.env.MONGODB_URI!, {
  serverApi: { version: ServerApiVersion.v1, strict: false, deprecationErrors: false },
});
const clientPromise = client.connect();

export const { handlers, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { prompt: "consent", access_type: "offline", response_type: "code" },
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      try {
        const { default: connectDB } = await import("@/lib/db/connect");
        const { default: User }      = await import("@/models/User");
        await connectDB();
        const exists = await User.findOne({ email: user.email });
        if (!exists) {
          await User.create({
            email: user.email, name: user.name, image: user.image,
            provider: account?.provider, role: "student", emailVerified: new Date(),
          });
        }
        return true;
      } catch { return false; }
    },
    async jwt({ token, trigger, session }) {
      if (!token.id || trigger === "update") {
        try {
          const { default: connectDB } = await import("@/lib/db/connect");
          const { default: User }      = await import("@/models/User");
          await connectDB();
          const dbUser = await User.findOne({ email: token.email }).lean() as any;
          if (dbUser) {
            token.id       = dbUser._id.toString();
            token.role     = dbUser.role;
            token.image    = dbUser.image;
            token.name     = dbUser.name;
            token.headline = dbUser.headline;
          }
        } catch {}
      }
      if (trigger === "update" && session) return { ...token, ...session.user };
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id       = token.id;
        (session.user as any).role     = token.role;
        (session.user as any).headline = token.headline;
      }
      return session;
    },
  },
  events: {
    async signOut(msg: any) {
      const id = msg?.token?.id;
      if (id) {
        try {
          const { deleteUserSession } = await import("@/lib/cache/redis");
          await deleteUserSession(id);
        } catch {}
      }
    },
  },
});

/**
 * Drop-in replacement for next-auth's auth() that works with Next.js 15+.
 *
 * next-auth v5 beta calls headers() synchronously inside auth(), which throws
 * "headers.get is not a function" on Next.js 15+ where headers() returns a Promise.
 *
 * This implementation bypasses that entirely: it reads the session JWT directly
 * from cookies() — which IS properly async — and decodes it using next-auth/jwt.
 * All existing `await auth()` call-sites work unchanged.
 */
export async function auth(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();

    // next-auth v5 uses "authjs.*" cookie names (not "next-auth.*")
    const isSecure = process.env.NODE_ENV === "production";
    const cookieName = isSecure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const sessionToken =
      cookieStore.get(cookieName)?.value ??
      cookieStore.get("authjs.session-token")?.value ??
      cookieStore.get("__Secure-authjs.session-token")?.value;

    if (!sessionToken) return null;

    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET!;

    const token = await decode({
      token: sessionToken,
      secret,
      // salt must match the cookie name next-auth used when it encoded the token
      salt: cookieName,
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