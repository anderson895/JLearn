"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  BookOpen, CheckCircle, Zap, Users, Award, DollarSign,
  ArrowRight, Loader2, ChevronLeft, AlertCircle,
} from "lucide-react";

const perks = [
  { icon: DollarSign, title: "Earn Revenue",     desc: "Get paid for every student who enrolls in your courses." },
  { icon: Users,      title: "Global Reach",     desc: "Teach students from anywhere in the world." },
  { icon: Zap,        title: "AI-Powered Tools", desc: "Use our AI tools to create and manage content faster." },
  { icon: Award,      title: "Build Your Brand", desc: "Grow your reputation as a subject matter expert." },
];

const requirements = [
  "Expertise in your subject area",
  "Ability to create high-quality video or written content",
  "Commitment to student success",
  "Willingness to respond to student questions",
];

export default function InstructorApplyPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [status,  setStatus]  = useState<"idle"|"success">("idle");

  const role = (session?.user as any)?.role;

  // Already an instructor — show redirect UI
  if (role === "instructor" || role === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-center max-w-sm p-8 rounded-2xl" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <CheckCircle className="w-14 h-14 mx-auto mb-4" style={{ color: "#22c55e" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>You're already an Instructor!</h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Go to your Instructor Studio to manage your courses.</p>
          <Link href="/instructor" className="btn-primary w-full">Go to Studio <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    );
  }

  async function handleApply() {
    setLoading(true);
    setError("");

    let res: Response;
    try {
      res = await fetch("/api/instructor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (networkErr) {
      console.error("Network error:", networkErr);
      setError("Network error — please check your connection and try again.");
      setLoading(false);
      return;
    }

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      setError("Unexpected server response. Please try again.");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      console.error("Apply error:", res.status, data);
      // If already instructor in DB, just redirect
      if (data.error === "Already an instructor") {
        window.location.href = "/instructor";
        return;
      }
      setError(data.error || `Error ${res.status} — please try again.`);
      setLoading(false);
      return;
    }

    setStatus("success");
    // Small delay so user sees success state, then hard redirect
    setTimeout(() => {
      window.location.href = "/instructor";
    }, 800);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{
        background: "color-mix(in srgb, var(--background) 90%, transparent)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--border)",
      }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}>
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold gradient-text">JLearn</span>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 badge badge-blue">
            <Zap className="w-3.5 h-3.5" /> Become an Instructor
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight" style={{ color: "var(--foreground)" }}>
            Share Your Knowledge,<br />
            <span className="gradient-text">Earn on Your Terms</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--muted)" }}>
            Join thousands of instructors building their teaching business on JLearn.
          </p>
        </div>

        {/* Perks */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {perks.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl p-5"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "var(--brand-light)" }}>
                <Icon className="w-5 h-5" style={{ color: "var(--brand)" }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>{title}</h3>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA card */}
        <div className="max-w-xl mx-auto rounded-2xl p-8 text-center"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Ready to Start Teaching?
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Click below to instantly activate your Instructor account.
          </p>

          <div className="text-left mb-6 space-y-2">
            {requirements.map(req => (
              <div key={req} className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#22c55e" }} />
                <span className="text-sm" style={{ color: "var(--foreground)" }}>{req}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2"
              style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {status === "success" ? (
            <div className="p-4 rounded-xl flex items-center justify-center gap-2"
              style={{ background: "#dcfce7", border: "1px solid #86efac" }}>
              <CheckCircle className="w-5 h-5" style={{ color: "#16a34a" }} />
              <span className="font-semibold text-sm" style={{ color: "#16a34a" }}>
                Success! Redirecting to Instructor Studio…
              </span>
            </div>
          ) : (
            <button
              onClick={handleApply}
              disabled={loading}
              className="btn-primary w-full"
              style={{ padding: "0.875rem 1.5rem", fontSize: "1rem" }}>
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Activating…</>
                : <>Become an Instructor <ArrowRight className="w-5 h-5" /></>}
            </button>
          )}

          <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
            Free to join · No upfront cost · Keep 70% of revenue
          </p>
        </div>
      </div>
    </div>
  );
}