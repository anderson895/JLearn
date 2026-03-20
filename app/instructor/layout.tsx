import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth/auth";
import { BookOpen, LayoutDashboard, Plus, BarChart2, Settings, Bell } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";

const links = [
  { href: "/instructor",                icon: LayoutDashboard, label: "Overview" },
  { href: "/instructor/courses/create", icon: Plus,            label: "New Course" },
  { href: "/instructor/analytics",      icon: BarChart2,       label: "Analytics" },
  { href: "/instructor/settings",       icon: Settings,        label: "Settings" },
];

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/instructor");
  const role = (session.user as any)?.role;
  if (!["instructor", "admin"].includes(role)) redirect("/dashboard");

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r" style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}>
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">JLearn</span>
          </Link>
        </div>
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
            <Image src={session.user?.image || "/globe.svg"} alt="" width={36} height={36} className="rounded-full" />
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>{session.user?.name}</p>
              <p className="text-xs" style={{ color: "var(--brand)" }}>Instructor</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          <DashboardNav links={links} />
        </nav>
        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <Link href="/dashboard" className="sidebar-item">
            <LayoutDashboard className="w-4 h-4" /> Student Dashboard
          </Link>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-6 border-b"
          style={{ background: "color-mix(in srgb, var(--background) 85%, transparent)", backdropFilter: "blur(12px)", borderColor: "var(--border)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>Instructor Studio</p>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg" style={{ color: "var(--muted)" }}>
              <Bell className="w-5 h-5" />
            </button>
            <Link href="/instructor/courses/create" className="btn-primary text-xs" style={{ padding: "0.4rem 0.875rem" }}>
              <Plus className="w-3.5 h-3.5" /> New Course
            </Link>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
