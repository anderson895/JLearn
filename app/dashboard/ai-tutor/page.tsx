"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Trash2, BookOpen } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface Message { role: "user" | "assistant"; content: string; ts: number; }

const STARTERS = [
  "Explain a concept I'm struggling with",
  "Help me understand recursion with a simple example",
  "What's the difference between props and state in React?",
  "Give me a practice exercise for Python loops",
];

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hi! I'm your personal AI tutor. Ask me anything — concepts, code, exercises, or explanations. What would you like to learn today?",
    ts: Date.now(),
  }]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: "user", content: text, ts: Date.now() }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/ai/tutor", {
        message: text,
        courseTitle: "General Learning",
        lessonTitle: "Open Session",
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      });
      setMessages(prev => [...prev, { role: "assistant", content: data.response, ts: Date.now() }]);
    } catch (err: any) {
      toast.error(err.response?.status === 429 ? "Rate limit: 20 questions/hour." : "AI unavailable. Try again.");
    } finally { setLoading(false); }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function clear() {
    setMessages([{ role: "assistant", content: "Chat cleared! What would you like to learn?", ts: Date.now() }]);
  }

  function renderContent(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`\n]+)`/g, `<code style="background:var(--surface-3);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:0.85em">$1</code>`)
      .replace(/```([\w]*)\n?([\s\S]*?)```/g, `<pre style="background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:12px;overflow-x:auto;margin:8px 0;font-size:0.8em"><code>$2</code></pre>`)
      .replace(/\n/g, "<br/>");
  }

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col" style={{ maxHeight: "calc(100vh - 8rem)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>AI Tutor</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Ask anything about your courses — available 24/7</p>
        </div>
        <button onClick={clear} className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl transition-colors"
          style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          <Trash2 className="w-4 h-4" /> Clear chat
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-2xl p-4 space-y-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)", minHeight: 0 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: msg.role === "assistant" ? "linear-gradient(135deg, var(--brand), var(--accent))" : "var(--surface-3)" }}>
              {msg.role === "assistant"
                ? <Bot className="w-4 h-4 text-white" />
                : <User className="w-4 h-4" style={{ color: "var(--muted)" }} />}
            </div>
            <div className="max-w-[82%] flex flex-col">
              <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={{
                  background: msg.role === "user" ? "var(--brand)" : "var(--background)",
                  color: msg.role === "user" ? "#fff" : "var(--foreground)",
                  borderRadius: msg.role === "user" ? "1.25rem 1.25rem 0.25rem 1.25rem" : "1.25rem 1.25rem 1.25rem 0.25rem",
                  border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                }}
                dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
              />
              <span className="text-xs mt-1 px-1" style={{ color: "var(--muted)", textAlign: msg.role === "user" ? "right" : "left" }}>
                {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <span className="flex gap-1.5 items-center">
                {[0, 0.2, 0.4].map(d => (
                  <span key={d} className="w-2 h-2 rounded-full inline-block"
                    style={{ background: "var(--muted)", animation: `bounce 0.9s ${d}s ease-in-out infinite` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Starter prompts */}
      {messages.length === 1 && (
        <div className="mt-3 flex flex-wrap gap-2 flex-shrink-0">
          {STARTERS.map(s => (
            <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
              className="px-3 py-2 rounded-xl text-xs transition-colors text-left"
              style={{ background: "var(--surface-1)", color: "var(--muted)", border: "1px solid var(--border)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; (e.currentTarget as HTMLElement).style.color = "var(--brand)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex-shrink-0">
        <div className="flex gap-3 items-end p-3 rounded-2xl" style={{ background: "var(--surface-1)", border: "1.5px solid var(--border)" }}
          onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; }}
          onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
            placeholder="Ask anything — concepts, code, practice problems…" rows={2}
            className="flex-1 resize-none outline-none text-sm bg-transparent"
            style={{ color: "var(--foreground)", maxHeight: "120px", lineHeight: 1.6 }} />
          <button onClick={send} disabled={!input.trim() || loading}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ background: !input.trim() || loading ? "var(--surface-3)" : "var(--brand)", cursor: !input.trim() || loading ? "not-allowed" : "pointer" }}>
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--muted)" }} />
              : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: "var(--muted)" }}>Press Enter to send · Shift+Enter for new line · 20 questions/hour</p>
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}
