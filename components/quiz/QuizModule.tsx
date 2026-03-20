"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Trophy, RotateCcw, ArrowRight, HelpCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

type State = "loading" | "ready" | "active" | "reviewing" | "done";

export default function QuizModule({ lessonId, courseSlug, onComplete }: { lessonId: string; courseSlug: string; onComplete: () => void }) {
  const [quiz,      setQuiz]    = useState<any>(null);
  const [state,     setState]   = useState<State>("loading");
  const [current,   setCurrent] = useState(0);
  const [selected,  setSelected] = useState<Record<number, string[]>>({});
  const [score,     setScore]   = useState(0);
  const [passed,    setPassed]  = useState(false);
  const [attempts,  setAttempts] = useState(0);
  const [timeLeft,  setTimeLeft] = useState(0);

  useEffect(() => { loadQuiz(); }, [lessonId]);

  useEffect(() => {
    if (state !== "active" || !quiz?.timeLimit || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(x => { if (x <= 1) { submit(); return 0; } return x - 1; }), 1000);
    return () => clearTimeout(t);
  }, [state, timeLeft]);

  async function loadQuiz() {
    try {
      const { data } = await axios.get(`/api/quiz/${lessonId}`);
      setQuiz(data.quiz); setState("ready");
      if (data.previousScore !== undefined) { setScore(data.previousScore); setAttempts(data.attempts || 0); }
    } catch { setState("ready"); }
  }

  function start() {
    setCurrent(0); setSelected({});
    if (quiz?.timeLimit) setTimeLeft(quiz.timeLimit * 60);
    setState("active");
  }

  function pick(qi: number, opt: string) {
    const q = quiz.questions[qi];
    setSelected(prev => ({
      ...prev,
      [qi]: q.type === "multiple"
        ? (prev[qi] || []).includes(opt) ? (prev[qi] || []).filter((o: string) => o !== opt) : [...(prev[qi] || []), opt]
        : [opt],
    }));
  }

  async function submit() {
    let earned = 0, total = 0;
    quiz.questions.forEach((q: any, i: number) => {
      total += q.points || 1;
      const correct = q.options.filter((o: any) => o.isCorrect).map((o: any) => o.text);
      const picked  = selected[i] || [];
      if (q.type === "multiple") {
        if (correct.every((c: string) => picked.includes(c)) && picked.every((p: string) => correct.includes(p))) earned += q.points || 1;
      } else {
        if (picked[0] && correct.includes(picked[0])) earned += q.points || 1;
      }
    });
    const s = Math.round((earned / total) * 100);
    const p = s >= (quiz.passingScore || 70);
    setScore(s); setPassed(p); setAttempts(a => a + 1); setState("reviewing");
    if (p) {
      try {
        await axios.post(`/api/quiz/${lessonId}/submit`, { courseSlug, score: s, passed: p });
        setTimeout(() => { setState("done"); onComplete(); }, 1800);
      } catch {}
    }
  }

  if (state === "loading") return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} /></div>;
  if (!quiz)              return <div className="text-center py-12" style={{ color: "var(--muted)" }}><HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No quiz for this lesson.</p></div>;

  if (state === "ready") return (
    <div className="max-w-lg mx-auto text-center py-12 px-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "var(--brand-light)" }}>
        <HelpCircle className="w-7 h-7" style={{ color: "var(--brand)" }} />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{quiz.title}</h2>
      {quiz.description && <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>{quiz.description}</p>}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[[quiz.questions.length, "Questions"],[`${quiz.passingScore || 70}%`, "To Pass"],[quiz.timeLimit ? `${quiz.timeLimit}m` : "∞", "Time"]].map(([v, l]) => (
          <div key={l} className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{v}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{l}</p>
          </div>
        ))}
      </div>
      {attempts > 0 && <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Previous: <span style={{ color: passed ? "#22c55e" : "#ef4444" }}>{score}%</span> · Attempt {attempts}/{quiz.maxAttempts || 3}</p>}
      {attempts >= (quiz.maxAttempts || 3) && !passed
        ? <p className="text-sm" style={{ color: "#ef4444" }}>Max attempts reached.</p>
        : <button onClick={start} className="btn-primary" style={{ padding: "0.75rem 2rem" }}>{attempts > 0 ? "Retake Quiz" : "Start Quiz"}</button>}
    </div>
  );

  if (state === "done") return (
    <div className="max-w-sm mx-auto text-center py-12">
      <Trophy className="w-16 h-16 mx-auto mb-4 animate-float" style={{ color: "#f59e0b" }} />
      <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Quiz Passed!</h2>
      <p className="text-4xl font-bold" style={{ color: "var(--brand)" }}>{score}%</p>
    </div>
  );

  const q   = quiz.questions[current];
  const rev = state === "reviewing";
  const prog = ((current + 1) / quiz.questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>
          {rev ? "Review Answers" : `Question ${current + 1}/${quiz.questions.length}`}
        </span>
        {quiz.timeLimit && !rev && (
          <span className="text-sm font-mono font-bold" style={{ color: timeLeft < 60 ? "#ef4444" : "var(--muted)" }}>
            <Clock className="w-4 h-4 inline mr-1" />{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </span>
        )}
      </div>

      <div className="h-1.5 rounded-full mb-6" style={{ background: "var(--surface-3)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: rev ? "100%" : `${prog}%`, background: "var(--brand)" }} />
      </div>

      {rev && (
        <div className="mb-6 p-5 rounded-2xl text-center" style={{ background: passed ? "#dcfce7" : "#fee2e2", border: `1px solid ${passed ? "#86efac" : "#fca5a5"}` }}>
          {passed ? <CheckCircle className="w-10 h-10 mx-auto mb-2" style={{ color: "#22c55e" }} /> : <XCircle className="w-10 h-10 mx-auto mb-2" style={{ color: "#ef4444" }} />}
          <p className="text-3xl font-bold" style={{ color: passed ? "#166534" : "#991b1b" }}>{score}%</p>
          <p className="text-sm mt-1" style={{ color: passed ? "#166534" : "#991b1b" }}>{passed ? "🎉 You passed!" : `Need ${quiz.passingScore || 70}% to pass`}</p>
          {!passed && attempts < (quiz.maxAttempts || 3) && (
            <button onClick={start} className="btn-primary mt-4 mx-auto" style={{ fontSize: "0.8rem", padding: "0.4rem 1rem" }}>
              <RotateCcw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
        </div>
      )}

      <div className="rounded-2xl p-6 mb-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
        <div className="flex items-start gap-3 mb-5">
          <span className="badge badge-blue flex-shrink-0">Q{current + 1}</span>
          <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>{q.question}</h3>
        </div>
        <div className="space-y-2.5">
          {q.options.map((opt: any, oi: number) => {
            const isSel = (selected[current] || []).includes(opt.text);
            let cls = "quiz-option";
            if (rev) { if (opt.isCorrect) cls += " correct"; else if (isSel) cls += " wrong"; }
            else if (isSel) cls += " selected";
            return (
              <button key={oi} onClick={() => !rev && pick(current, opt.text)} disabled={rev} className={cls + " w-full"}>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{ borderColor: rev ? (opt.isCorrect ? "#22c55e" : isSel ? "#ef4444" : "var(--border)") : isSel ? "var(--brand)" : "var(--border)", background: rev ? (opt.isCorrect ? "#22c55e" : isSel ? "#ef4444" : "transparent") : isSel ? "var(--brand)" : "transparent" }}>
                  {(rev ? opt.isCorrect : isSel) && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm" style={{ color: "var(--foreground)" }}>{opt.text}</span>
                {rev && opt.isCorrect && <CheckCircle className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: "#22c55e" }} />}
                {rev && isSel && !opt.isCorrect && <XCircle className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: "#ef4444" }} />}
              </button>
            );
          })}
        </div>
        {rev && q.explanation && (
          <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: "var(--brand-light)", border: "1px solid color-mix(in srgb, var(--brand) 30%, transparent)" }}>
            <p className="font-semibold text-xs mb-1" style={{ color: "var(--brand)" }}>Explanation</p>
            <p style={{ color: "var(--foreground)" }}>{q.explanation}</p>
          </div>
        )}
      </div>

      {!rev ? (
        <div className="flex justify-end">
          <button onClick={current < quiz.questions.length - 1 ? () => setCurrent(c => c + 1) : submit}
            disabled={!(selected[current]?.length > 0)} className="btn-primary" style={{ opacity: !(selected[current]?.length > 0) ? 0.5 : 1 }}>
            {current < quiz.questions.length - 1 ? "Next" : "Submit"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} className="btn-outline" style={{ opacity: current === 0 ? 0.4 : 1 }}>Previous</button>
          <span className="text-xs" style={{ color: "var(--muted)" }}>{current + 1} / {quiz.questions.length}</span>
          <button onClick={() => setCurrent(c => Math.min(quiz.questions.length - 1, c + 1))} disabled={current === quiz.questions.length - 1} className="btn-outline" style={{ opacity: current === quiz.questions.length - 1 ? 0.4 : 1 }}>Next</button>
        </div>
      )}
    </div>
  );
}
