"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";

interface SidebarLink { href: string; icon: LucideIcon; label: string; }

export default function DashboardNav({ links }: { links: SidebarLink[] }) {
  const pathname = usePathname();
  return (
    <>
      {links.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
        return (
          <Link key={href} href={href} className={`sidebar-item ${active ? "active" : ""}`}>
            <Icon className="w-4 h-4 flex-shrink-0" /> {label}
          </Link>
        );
      })}
    </>
  );
}
