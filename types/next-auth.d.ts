import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id:        string;
      role:      string;
      headline?: string;
    } & DefaultSession["user"];
  }
}
