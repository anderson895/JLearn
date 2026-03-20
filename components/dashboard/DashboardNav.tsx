"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, GraduationCap, Award,
  BarChart2, MessageCircle, User, Settings,
} from "lucide-react";

const sidebarLinks = [
  { href: "/dashboard",              icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/courses",      icon: GraduationCap,  label: "My Courses" },
  { href: "/dashboard/certificates", icon: Award,          label: "Certificates" },
  { href: "/dashboard/analytics",    icon: BarChart2,      label: "Analytics" },
  { href: "/dashboard/ai-tutor",     icon: MessageCircle,  label: "AI Tutor" },
  { href: "/dashboard/profile",      icon: User,           label: "Profile" },
  { href: "/dashboard/settings",     icon: Settings,       label: "Settings" },
];

export default function DashboardNav() {
  const pathname = usePathname();
  return (
    <>
      {sidebarLinks.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
        return (
          <Link key={href} href={href} className={`sidebar-item ${active ? "active" : ""}`}>
            <Icon className="w-4 h-4 shrink-0" /> {label}
          </Link>
        );
      })}
    </>
  );
}