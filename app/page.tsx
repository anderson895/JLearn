import Link from "next/link";
import { ArrowRight, BookOpen, Zap, Award, Users, Star, CheckCircle, Play } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connect";
import Course from "@/models/Course";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CourseCard from "@/components/course/CourseCard";

async function getFeaturedCourses() {
  try {
    await connectDB();
    return await Course.find({ status: "published", featured: true })
      .populate("instructor", "name image").sort({ "stats.totalStudents": -1 }).limit(8).lean();
  } catch { return []; }
}

const stats = [
  { label: "Active Learners", value: "500K+", icon: Users },
  { label: "Expert Courses",  value: "10K+",  icon: BookOpen },
  { label: "Avg. Rating",     value: "4.8★",  icon: Star },
  { label: "Certificates",    value: "120K+", icon: Award },
];
const features = [
  { icon: BookOpen,     title: "Expert-Led Courses", desc: "Learn from industry practitioners with real-world experience." },
  { icon: Zap,          title: "AI Tutor 24/7",      desc: "Get instant answers to any question, any time." },
  { icon: Award,        title: "Certificates",        desc: "Earn recognised certificates to share on LinkedIn." },
  { icon: CheckCircle,  title: "Progress Tracking",  desc: "Track streaks, quiz scores, and completion rate." },
];

export default async function HomePage() {
  const [session, featured] = await Promise.all([auth(), getFeaturedCourses()]);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar session={session} />
      <section className="relative overflow-hidden py-24 px-4" style={{background:"var(--background)"}}>
        <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--brand) 10%, transparent), transparent)"}} />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 badge badge-blue">
            <Zap className="w-3.5 h-3.5" /> AI-Powered Learning
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6" style={{color:"var(--foreground)",letterSpacing:"-0.02em"}}>
            Learn Without<br /><span className="gradient-text">Limits</span>
          </h1>
          <p className="text-xl mb-10 max-w-2xl mx-auto" style={{color:"var(--muted)",lineHeight:1.7}}>
            Master in-demand skills with expert-led courses, AI tutoring, quizzes, and employer-recognised certificates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={session ? "/dashboard" : "/login"} className="btn-primary text-base" style={{padding:"0.875rem 2rem"}}>
              {session ? "Go to Dashboard" : "Start Learning Free"} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/courses" className="btn-outline text-base" style={{padding:"0.875rem 2rem"}}>
              <Play className="w-5 h-5" /> Browse Courses
            </Link>
          </div>
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({label,value,icon:Icon})=>(
              <div key={label} className="rounded-2xl p-5 text-center" style={{background:"var(--surface-1)",border:"1px solid var(--border)"}}>
                <Icon className="w-5 h-5 mx-auto mb-2" style={{color:"var(--brand)"}} />
                <div className="text-2xl font-bold" style={{color:"var(--foreground)"}}>{value}</div>
                <div className="text-xs mt-1" style={{color:"var(--muted)"}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 px-4" style={{background:"var(--surface-1)"}}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{color:"var(--foreground)"}}>Everything You Need to Succeed</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({icon:Icon,title,desc})=>(
              <div key={title} className="rounded-2xl p-6" style={{background:"var(--background)",border:"1px solid var(--border)"}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{background:"var(--brand-light)"}}>
                  <Icon className="w-5 h-5" style={{color:"var(--brand)"}} />
                </div>
                <h3 className="font-semibold mb-2" style={{color:"var(--foreground)"}}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{color:"var(--muted)"}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold" style={{color:"var(--foreground)"}}>Featured Courses</h2>
              <p className="mt-2 text-sm" style={{color:"var(--muted)"}}>Hand-picked by our team</p>
            </div>
            <Link href="/courses" className="flex items-center gap-1 text-sm font-medium" style={{color:"var(--brand)"}}>
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featured.map((c:any)=><CourseCard key={c._id.toString()} course={c} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({length:4}).map((_,i)=><div key={i} className="skeleton h-72 rounded-2xl" />)}
            </div>
          )}
        </div>
      </section>
      <section className="py-20 px-4" style={{background:"var(--surface-1)"}}>
        <div className="max-w-2xl mx-auto text-center">
          <Award className="w-14 h-14 mx-auto mb-5 animate-float" style={{color:"var(--brand)"}} />
          <h2 className="text-4xl font-bold mb-4" style={{color:"var(--foreground)"}}>Ready to Start?</h2>
          <p className="mb-8" style={{color:"var(--muted)"}}>Join 500,000+ learners. Your first course is free.</p>
          <Link href={session ? "/courses" : "/login"} className="btn-primary text-base" style={{padding:"0.875rem 2.5rem"}}>
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
