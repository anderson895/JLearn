import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient, ServerApiVersion } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!, {
  serverApi: { version: ServerApiVersion.v1, strict: false, deprecationErrors: false },
});
const clientPromise = client.connect();

export const { handlers, auth, signIn, signOut } = NextAuth({
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
