"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen, Search, Bell, ChevronDown, LayoutDashboard,
  GraduationCap, Award, Settings, LogOut, Menu, X, Sun, Moon, Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface NavbarProps { session: any }

const navLinks = [
  { href: "/courses", label: "Browse Courses" },
];

export default function Navbar({ session }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");
  const pathname = usePathname();
  const router   = useRouter();
  const { theme, setTheme } = useTheme();
  const role = (session?.user as any)?.role;

  // Context-aware instructor link
  const instructorLink = ["instructor", "admin"].includes(role)
    ? { href: "/instructor", label: "My Studio" }
    : { href: "/become-instructor", label: "Teach on JLearn" };

  async function handleSignOut() {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callbackUrl: "/" }),
        redirect: "manual", // don't follow the 307 — we'll redirect manually
      });
    } catch {}
    // Always redirect to home and do a hard reload to clear session state
    window.location.href = "/";
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/courses?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-50 border-b" style={{ background: "color-mix(in srgb, var(--background) 85%, transparent)", backdropFilter: "blur(12px)", borderColor: "var(--border)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text hidden sm:block">JLearn</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted)" }} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search courses..." className="input-field pl-10" style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }} />
            </div>
          </form>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: pathname?.startsWith(link.href) ? "var(--brand)" : "var(--muted)", background: pathname?.startsWith(link.href) ? "var(--brand-light)" : "transparent" }}>
                {link.label}
              </Link>
            ))}
            <Link href={instructorLink.href} className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: pathname?.startsWith(instructorLink.href) ? "var(--brand)" : "var(--muted)", background: pathname?.startsWith(instructorLink.href) ? "var(--brand-light)" : "transparent" }}>
              {instructorLink.label}
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Theme toggle */}
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg transition-colors" style={{ color: "var(--muted)" }}>
              <Sun className="w-4 h-4 dark:hidden" />
              <Moon className="w-4 h-4 hidden dark:block" />
            </button>

            {session ? (
              <>
                <button className="relative p-2 rounded-lg" style={{ color: "var(--muted)" }}>
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "var(--brand)" }} />
                </button>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex items-center gap-2 p-1.5 rounded-xl">
                      <Image src={session.user?.image || "/globe.svg"} alt={session.user?.name || ""} width={32} height={32} className="rounded-full ring-2" style={{ "--tw-ring-color": "var(--border)" } as any} />
                      <ChevronDown className="w-3.5 h-3.5 hidden sm:block" style={{ color: "var(--muted)" }} />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className="animate-fade-in z-50 min-w-[220px] rounded-2xl shadow-xl p-2" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }} align="end" sideOffset={8}>
                      <div className="px-3 py-2 mb-2">
                        <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{session.user?.name}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>{session.user?.email}</p>
                      </div>
                      <div className="h-px my-1" style={{ background: "var(--border)" }} />
                      {[
                        { href: "/dashboard",             icon: LayoutDashboard, label: "Dashboard" },
                        { href: "/dashboard/courses",     icon: GraduationCap,  label: "My Courses" },
                        { href: "/dashboard/certificates",icon: Award,          label: "Certificates" },
                        { href: "/dashboard/settings",    icon: Settings,       label: "Settings" },
                      ].map(item => (
                        <DropdownMenu.Item key={item.href} asChild>
                          <Link href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors"
                            style={{ color: "var(--foreground)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <item.icon className="w-4 h-4" style={{ color: "var(--muted)" }} />{item.label}
                          </Link>
                        </DropdownMenu.Item>
                      ))}
                      {["instructor", "admin"].includes(session.user?.role) && (
                        <>
                          <div className="h-px my-1" style={{ background: "var(--border)" }} />
                          <DropdownMenu.Item asChild>
                            <Link href="/instructor" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm cursor-pointer" style={{ color: "var(--brand)" }}>
                              <Zap className="w-4 h-4" /> Instructor Studio
                            </Link>
                          </DropdownMenu.Item>
                        </>
                      )}
                      <div className="h-px my-1" style={{ background: "var(--border)" }} />
                      <DropdownMenu.Item asChild>
                        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm cursor-pointer" style={{ color: "#ef4444" }}>
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-medium" style={{ color: "var(--muted)" }}>Sign In</Link>
                <Link href="/login" className="btn-primary text-sm">Get Started</Link>
              </div>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg" style={{ color: "var(--muted)" }}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t py-4 space-y-2 animate-fade-in" style={{ borderColor: "var(--border)" }}>
            <form onSubmit={handleSearch} className="mb-3">
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search courses..." className="input-field" />
            </form>
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {link.label}
              </Link>
            ))}
            <Link href={instructorLink.href} onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium" style={{ color: "var(--foreground)" }}>
              {instructorLink.label}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}