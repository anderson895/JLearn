"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ReactPlayer from "react-player";
import {
  ChevronLeft, ChevronRight, CheckCircle, PlayCircle,
  FileText, HelpCircle, BookOpen, Menu, X, ChevronDown,
} from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import axios from "axios";
import toast from "react-hot-toast";
import { formatDuration } from "@/lib/utils/format";
import AITutorPanel from "@/components/player/AITutorPanel";
import NotesTaker from "@/components/player/NotesTaker";
import QuizModule from "@/components/quiz/QuizModule";

type Tab = "content" | "ai" | "notes";

export default function LearnPage() {
  const params    = useParams();
  const router    = useRouter();
  const { data: session } = useSession();
  const slug = params.slug as string;

  const [course,   setCourse]   = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [lesson,   setLesson]   = useState<any>(null);
  const [section,  setSection]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [sidebar,  setSidebar]  = useState(true);
  const [tab,      setTab]      = useState<Tab>("content");
  const [played,   setPlayed]   = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    async function load() {
      try {
        const [{ data: c }, { data: p }] = await Promise.all([
          axios.get(`/api/courses/${slug}`),
          axios.get(`/api/progress/${slug}`),
        ]);
        setCourse(c.course); setProgress(p.progress);
        const prog = p.progress;
        if (prog?.currentLesson) {
          for (const s of c.course.sections) {
            const l = s.lessons.find((l: any) => l._id === prog.currentLesson);
            if (l) { setLesson(l); setSection(s); break; }
          }
        } else if (c.course.sections?.[0]?.lessons?.[0]) {
          setLesson(c.course.sections[0].lessons[0]);
          setSection(c.course.sections[0]);
        }
      } catch { toast.error("Failed to load course"); }
      finally { setLoading(false); }
    }
    load();
  }, [slug]);

  const saveProgress = useCallback(async (lessonId: string, secs: number, done = false) => {
    try { await axios.post(`/api/progress/${slug}`, { lessonId, watchedSeconds: secs, completed: done }); } catch {}
  }, [slug]);

  function onProgress({ playedSeconds }: { playedSeconds: number }) {
    setPlayed(playedSeconds);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { if (lesson) saveProgress(lesson._id, playedSeconds); }, 5000);
  }

  async function markComplete() {
    if (!lesson) return;
    await saveProgress(lesson._id, lesson.duration, true);
    setProgress((prev: any) => ({ ...prev, completedLessons: [...(prev?.completedLessons || []), lesson._id] }));
    toast.success("Lesson completed! 🎉");
    navigate("next");
  }

  function navigate(dir: "next" | "prev") {
    if (!course || !lesson) return;
    const all: { s: any; l: any }[] = [];
    course.sections.forEach((s: any) => s.lessons.forEach((l: any) => all.push({ s, l })));
    const i = all.findIndex(x => x.l._id === lesson._id);
    const n = dir === "next" ? i + 1 : i - 1;
    if (n >= 0 && n < all.length) { setLesson(all[n].l); setSection(all[n].s); setPlayed(0); }
  }

  function selectLesson(s: any, l: any) {
    const done = progress?.completedLessons || [];
    if (!l.isPreview && !done.includes(l._id) && s.order > 1 && done.length === 0) {
      toast.error("Complete previous lessons first"); return;
    }
    setLesson(l); setSection(s); setPlayed(0);
  }

  const isDone   = (id: string) => progress?.completedLessons?.includes(id);
  const typeIcon = (t: string) => ({ video: PlayCircle, article: FileText, quiz: HelpCircle }[t] || PlayCircle);

  const completed   = progress?.completedLessons?.length || 0;
  const totalL      = course?.stats?.totalLessons || 0;
  const pct         = totalL > 0 ? Math.round((completed / totalL) * 100) : 0;

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
        <p className="text-sm" style={{ color: "var(--muted)" }}>Loading course…</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <header className="flex items-center h-14 px-4 gap-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-1)" }}>
        <button onClick={() => router.push("/dashboard/courses")} className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: "var(--muted)" }}>
          <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{course?.title}</h1>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span className="text-xs" style={{ color: "var(--muted)" }}>{pct}%</span>
          <div className="w-24 h-1.5 rounded-full" style={{ background: "var(--surface-3)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--brand)" }} />
          </div>
        </div>
        <button onClick={() => setSidebar(s => !s)} className="p-2 rounded-lg transition-colors" style={{ color: "var(--muted)" }}>
          {sidebar ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Video / content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {lesson?.type === "video" && lesson?.videoUrl ? (
              <div style={{ background: "#000" }}>
                <div className="player-wrapper">
                  <ReactPlayer url={lesson.videoUrl} width="100%" height="100%" controls onProgress={onProgress} onEnded={markComplete} />
                </div>
              </div>
            ) : lesson?.type === "article" ? (
              <div className="flex-1 overflow-auto p-6 lg:p-10 max-w-3xl mx-auto w-full">
                <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--foreground)" }}>{lesson.title}</h2>
                <div className="prose prose-sm max-w-none" style={{ color: "var(--foreground)" }} dangerouslySetInnerHTML={{ __html: lesson.content || "" }} />
                <button onClick={markComplete} className="btn-primary mt-8">
                  <CheckCircle className="w-5 h-5" /> Mark as Complete
                </button>
              </div>
            ) : lesson?.type === "quiz" ? (
              <div className="flex-1 overflow-auto">
                <QuizModule lessonId={lesson._id} courseSlug={slug} onComplete={markComplete} />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center" style={{ color: "var(--muted)" }}>
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>Select a lesson to begin</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom nav + tabs */}
          {lesson && (
            <>
              <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ borderTop: "1px solid var(--border)", background: "var(--surface-1)" }}>
                <button onClick={() => navigate("prev")} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors" style={{ color: "var(--muted)" }}>
                  <ChevronLeft className="w-4 h-4" />Prev
                </button>
                <div className="flex items-center gap-1.5">
                  {(["content", "ai", "notes"] as Tab[]).map(t => (
                    <button key={t} onClick={() => setTab(tab === t ? "content" : t)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize"
                      style={{ background: tab === t ? "var(--brand)" : "var(--surface-2)", color: tab === t ? "#fff" : "var(--muted)" }}>
                      {t === "ai" ? "🤖 AI Tutor" : t}
                    </button>
                  ))}
                </div>
                <button onClick={() => navigate("next")} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors" style={{ color: "var(--muted)" }}>
                  Next<ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {tab === "ai" && section && (
                <div className="flex-shrink-0">
                  <AITutorPanel courseTitle={course?.title} lessonTitle={lesson.title} courseSlug={slug} />
                </div>
              )}
              {tab === "notes" && (
                <div className="flex-shrink-0">
                  <NotesTaker courseSlug={slug} lessonId={lesson._id} currentTime={played} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        {sidebar && (
          <aside className="w-72 flex-shrink-0 overflow-y-auto" style={{ borderLeft: "1px solid var(--border)", background: "var(--surface-1)" }}>
            <div className="px-4 py-3 sticky top-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-1)" }}>
              <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Course Content</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{completed}/{totalL} completed</p>
            </div>
            <Accordion.Root type="multiple" defaultValue={section ? [section._id?.toString()] : []}>
              {course?.sections?.map((s: any) => {
                const sid = s._id?.toString();
                const secDone = s.lessons.filter((l: any) => isDone(l._id)).length;
                return (
                  <Accordion.Item key={sid} value={sid} style={{ borderBottom: "1px solid var(--border)" }}>
                    <Accordion.Trigger className="flex items-center justify-between w-full px-4 py-3 text-left group">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{s.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          {secDone}/{s.lessons.length} · {formatDuration(s.lessons.reduce((a: number, l: any) => a + (l.duration || 0), 0))}
                        </p>
                      </div>
                      <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180 flex-shrink-0 ml-2" style={{ color: "var(--muted)" }} />
                    </Accordion.Trigger>
                    <Accordion.Content>
                      {s.lessons.map((l: any) => {
                        const lid    = l._id;
                        const active = lid === lesson?._id;
                        const done   = isDone(lid);
                        const Icon   = typeIcon(l.type);
                        return (
                          <button key={lid} onClick={() => selectLesson(s, l)}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                            style={{ background: active ? "var(--brand-light)" : "transparent", borderLeft: `2px solid ${active ? "var(--brand)" : "transparent"}` }}
                            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            {done
                              ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                              : <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: active ? "var(--brand)" : "var(--muted)" }} />}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium leading-snug" style={{ color: active ? "var(--brand)" : "var(--foreground)" }}>{l.title}</p>
                              {l.duration > 0 && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{formatDuration(l.duration)}</p>}
                            </div>
                            {l.isPreview && !done && <span className="text-xs flex-shrink-0" style={{ color: "var(--brand)" }}>Preview</span>}
                          </button>
                        );
                      })}
                    </Accordion.Content>
                  </Accordion.Item>
                );
              })}
            </Accordion.Root>
          </aside>
        )}
      </div>
    </div>
  );
}