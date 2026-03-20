import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t mt-auto" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}>
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold gradient-text">JLearn</span>
          </Link>
          <div className="flex flex-wrap gap-6 text-sm" style={{ color: "var(--muted)" }}>
            {[["Browse Courses", "/courses"], ["Become Instructor", "/instructor/apply"], ["Help Center", "/help"], ["Privacy", "/privacy"], ["Terms", "/terms"]].map(([label, href]) => (
              <Link key={href} href={href} className="hover:opacity-80 transition-opacity">{label}</Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>© {new Date().getFullYear()} JLearn</p>
        </div>
      </div>
    </footer>
  );
}
