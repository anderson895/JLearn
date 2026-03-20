"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, ShoppingCart, Loader2, CheckCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function EnrollButton({ course, isEnrolled, session }: { course: any; isEnrolled: boolean; session: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleEnroll() {
    if (!session) { router.push(`/login?callbackUrl=/courses/${course.slug}`); return; }
    setLoading(true);
    try {
      const { data } = await axios.post("/api/payments/checkout", { courseSlug: course.slug });
      if (data.enrolled) { toast.success("Enrolled!"); router.push(`/learn/${course.slug}`); }
      else if (data.url) { window.location.href = data.url; }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Enrollment failed");
    } finally { setLoading(false); }
  }

  if (isEnrolled) {
    return (
      <button onClick={() => router.push(`/learn/${course.slug}`)} className="btn-primary w-full" style={{ background: "#22c55e" }}>
        <Play className="w-5 h-5" /> Continue Learning
      </button>
    );
  }

  return (
    <button onClick={handleEnroll} disabled={loading} className="btn-primary w-full text-base" style={{ padding: "0.875rem 1.5rem" }}>
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
        course.isFree
          ? <><CheckCircle className="w-5 h-5" /> Enroll for Free</>
          : <><ShoppingCart className="w-5 h-5" /> Enroll — ${course.price}</>
      )}
    </button>
  );
}
