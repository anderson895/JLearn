import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth/auth";
import { BookOpen, Zap, Bell } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r" style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}>
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">JLearn</span>
          </Link>
        </div>
        {/* User */}
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
            <Image src={session.user?.image || "/globe.svg"} alt="" width={38} height={38} className="rounded-full" />
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>{session.user?.name}</p>
              <p className="text-xs capitalize" style={{ color: "var(--muted)" }}>{(session.user as any)?.role || "student"}</p>
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          <DashboardNav />
        </nav>
        {/* Instructor CTA */}
        {(session.user as any)?.role !== "instructor" && (
          <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="p-4 rounded-xl border" style={{ background: "var(--brand-light)", borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)" }}>
              <Zap className="w-4 h-4 mb-2" style={{ color: "var(--brand)" }} />
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--foreground)" }}>Become an Instructor</p>
              <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Share knowledge and earn.</p>
              <Link href="/become-instructor" className="btn-primary w-full text-xs" style={{ padding: "0.4rem 0.75rem" }}>Apply Now</Link>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-6 border-b" style={{ background: "color-mix(in srgb, var(--background) 85%, transparent)", backdropFilter: "blur(12px)", borderColor: "var(--border)" }}>
          <div className="hidden lg:block">
            <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
              <span style={{ color: "var(--foreground)" }}>{session.user?.name?.split(" ")[0]}</span> 👋
            </p>
          </div>
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}>
                <BookOpen className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm gradient-text">JLearn</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg" style={{ color: "var(--muted)" }}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "var(--brand)" }} />
            </button>
            <Link href="/courses" className="btn-primary text-xs hidden sm:flex" style={{ padding: "0.4rem 0.875rem" }}>
              <BookOpen className="w-3.5 h-3.5" /> Find Courses
            </Link>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}