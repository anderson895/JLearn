import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connect";
import Course from "@/models/Course";
import { Enrollment } from "@/models/index";
import { Star, Clock, Users, Globe, Award, CheckCircle, BookOpen, Lock, Play, Eye, Zap, ShieldCheck } from "lucide-react";
import { formatDuration } from "@/lib/utils/format";
import Navbar from "@/components/layout/Navbar";
import EnrollButton from "@/components/course/EnrollButton";
import CurriculumAccordion from "@/components/course/CurriculumAccordion";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  const course = await Course.findOne({ slug, status: "published" }).lean() as any;
  if (!course) return {};
  return { title: course.title, description: course.shortDesc };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session  = await auth();
  const userId   = (session?.user as any)?.id;

  await connectDB();
  const course = await Course.findOne({ slug, status: "published" })
    .populate("instructor", "name image headline bio").lean() as any;
  if (!course) notFound();

  let isEnrolled = false;
  if (userId) {
    const e = await Enrollment.findOne({ user: userId, course: course._id, status: "active" });
    isEnrolled = !!e;
  }

  const totalLessons  = course.sections?.reduce((a: number, s: any) => a + s.lessons.length, 0) || 0;
  const totalDuration = course.stats?.totalDuration || 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar session={session} />

      {/* Hero */}
      <div style={{ background: "#0f172a" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="badge badge-blue">{course.category}</span>
                <span className="badge" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>{course.level?.replace("-", " ")}</span>
                {course.bestseller && <span className="badge badge-amber">Bestseller</span>}
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">{course.title}</h1>
              <p className="text-lg mb-6" style={{ color: "rgba(255,255,255,0.8)" }}>{course.shortDesc}</p>
              {course.stats?.averageRating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-bold text-yellow-400">{course.stats.averageRating.toFixed(1)}</span>
                  <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4" fill={i < Math.round(course.stats.averageRating) ? "#facc15" : "none"} stroke={i < Math.round(course.stats.averageRating) ? "#facc15" : "#6b7280"} />)}</div>
                  <span style={{ color: "rgba(255,255,255,0.5)" }} className="text-sm">({course.stats.totalReviews?.toLocaleString()} reviews) · {course.stats.totalStudents?.toLocaleString()} students</span>
                </div>
              )}
              {course.instructor && (
                <div className="flex items-center gap-3 mb-6">
                  {course.instructor.image && <Image src={course.instructor.image} alt="" width={36} height={36} className="rounded-full" />}
                  <span style={{ color: "rgba(255,255,255,0.6)" }} className="text-sm">By <span style={{ color: "#60a5fa" }}>{course.instructor.name}</span></span>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatDuration(totalDuration)} total</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{totalLessons} lessons</span>
                <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" />{course.language}</span>
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4" />Certificate included</span>
              </div>
            </div>
            {/* Desktop pricing card */}
            <div className="hidden lg:block">
              <div className="sticky top-20 rounded-2xl overflow-hidden shadow-2xl" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                <div className="relative aspect-video" style={{ background: "var(--surface-2)" }}>
                  {course.thumbnail && <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />}
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-white/50" style={{ background: "rgba(255,255,255,0.15)" }}>
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-baseline gap-3 mb-4">
                    {course.isFree ? <span className="text-3xl font-bold" style={{ color: "#22c55e" }}>Free</span> : (
                      <><span className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>${course.price}</span>
                      {course.originalPrice > course.price && <span className="text-lg line-through" style={{ color: "var(--muted)" }}>${course.originalPrice}</span>}</>
                    )}
                  </div>
                  <EnrollButton course={course} isEnrolled={isEnrolled} session={session} />
                  <p className="text-center text-xs mt-3" style={{ color: "var(--muted)" }}>30-Day Money-Back Guarantee</p>
                  <div className="mt-4 pt-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
                    {[[Clock, `${formatDuration(totalDuration)} on-demand video`],[BookOpen, `${totalLessons} lessons`],[Globe, "Full lifetime access"],[Award, "Certificate of completion"],[Zap, "AI tutor included"],[ShieldCheck, "Access on all devices"]].map(([Icon, text]: any) => (
                      <div key={text} className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                        <Icon className="w-4 h-4" style={{ color: "var(--muted)" }} />{text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky enroll bar */}
      <div className="lg:hidden sticky top-16 z-30 px-4 py-3 border-b" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="font-bold text-xl" style={{ color: course.isFree ? "#22c55e" : "var(--foreground)" }}>
            {course.isFree ? "Free" : `$${course.price}`}
          </div>
          <EnrollButton course={course} isEnrolled={isEnrolled} session={session} />
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:col-span-2 space-y-12 max-w-3xl">
          {/* Outcomes */}
          {course.outcomes?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--foreground)" }}>What You'll Learn</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {course.outcomes.map((o: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#22c55e" }} />
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>{o}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Requirements */}
          {course.requirements?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--foreground)" }}>Requirements</h2>
              <ul className="space-y-2">
                {course.requirements.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                    <span style={{ color: "var(--muted)" }}>•</span>{r}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Curriculum */}
          <section>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Course Content</h2>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              {course.sections?.length} sections · {totalLessons} lessons · {formatDuration(totalDuration)}
            </p>
            <CurriculumAccordion sections={course.sections || []} isEnrolled={isEnrolled} />
          </section>

          {/* Instructor */}
          {course.instructor && (
            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--foreground)" }}>Your Instructor</h2>
              <div className="flex items-start gap-4">
                {course.instructor.image && <Image src={course.instructor.image} alt="" width={72} height={72} className="rounded-2xl flex-shrink-0" />}
                <div>
                  <h3 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>{course.instructor.name}</h3>
                  {course.instructor.headline && <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{course.instructor.headline}</p>}
                  {course.instructor.bio && <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--foreground)" }}>{course.instructor.bio}</p>}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
