"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, BarChart2, Settings } from "lucide-react";

const sidebarLinks = [
  { href: "/instructor",                icon: LayoutDashboard, label: "Overview" },
  { href: "/instructor/courses/create", icon: Plus,            label: "New Course" },
  { href: "/instructor/analytics",      icon: BarChart2,       label: "Analytics" },
  { href: "/instructor/settings",       icon: Settings,        label: "Settings" },
];

export default function InstructorNav() {
  const pathname = usePathname();
  return (
    <>
      {sidebarLinks.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/instructor" && pathname?.startsWith(href));
        return (
          <Link key={href} href={href} className={`sidebar-item ${active ? "active" : ""}`}>
            <Icon className="w-4 h-4 shrink-0" /> {label}
          </Link>
        );
      })}
    </>
  );
}