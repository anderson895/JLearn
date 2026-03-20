"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface Message { role: "user" | "assistant"; content: string; }

interface Props { courseTitle: string; lessonTitle: string; courseSlug: string; fullPage?: boolean; }

export default function AITutorPanel({ courseTitle, lessonTitle, courseSlug, fullPage = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: `Hi! I'm your AI tutor for **${lessonTitle}**. Ask me anything about this lesson! 🎓`,
  }]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/ai/tutor", {
        message: text, courseTitle, lessonTitle, courseSlug,
        history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
      });
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (err: any) {
      toast.error(err.response?.status === 429 ? "Rate limit reached. Wait a moment." : "AI tutor unavailable.");
    } finally { setLoading(false); }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  // Simple markdown: bold, inline code, line breaks
  function render(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, `<code style="background:var(--surface-3);padding:0 4px;border-radius:4px;font-size:0.8em">$1</code>`)
      .replace(/\n/g, "<br/>");
  }

  return (
    <div className="flex flex-col" style={{ height: fullPage ? "100%" : "280px", background: "var(--surface-1)", borderTop: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}>
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>AI Tutor</span>
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />Online
          </span>
        </div>
        <button onClick={() => setMessages([{ role: "assistant", content: `Chat cleared. Ask me about **${lessonTitle}**!` }])}
          className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--muted)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${msg.role === "assistant" ? "" : ""}`}
              style={{ background: msg.role === "assistant" ? "linear-gradient(135deg, var(--brand), var(--accent))" : "var(--surface-3)" }}>
              {msg.role === "assistant" ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5" style={{ color: "var(--muted)" }} />}
            </div>
            <div className="max-w-[82%]">
              <div className="px-3 py-2 rounded-2xl text-xs leading-relaxed"
                style={{
                  background: msg.role === "user" ? "var(--brand)" : "var(--surface-2)",
                  color: msg.role === "user" ? "#fff" : "var(--foreground)",
                  borderRadius: msg.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                  border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                }}
                dangerouslySetInnerHTML={{ __html: render(msg.content) }}
              />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}>
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="px-3 py-2 rounded-2xl text-xs" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <span className="flex gap-1">{[0, 0.2, 0.4].map(d => (
                <span key={d} className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--muted)", animation: `bounce 0.8s ${d}s infinite` }} />
              ))}</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length === 1 && (
        <div className="px-3 pb-2 flex gap-2 flex-wrap">
          {["Explain this simply", "Give me an example", "Common mistakes?"].map(q => (
            <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
              className="px-2.5 py-1 rounded-lg text-xs transition-colors"
              style={{ background: "var(--surface-2)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 p-2" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-end gap-2">
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown}
            placeholder="Ask anything…" rows={1}
            className="flex-1 resize-none rounded-xl text-xs outline-none"
            style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", color: "var(--foreground)", padding: "0.5rem 0.75rem", maxHeight: "80px", minHeight: "36px" }}
            onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; }}
            onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          />
          <button onClick={send} disabled={!input.trim() || loading}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-opacity"
            style={{ background: "var(--brand)", opacity: !input.trim() || loading ? 0.5 : 1, cursor: !input.trim() || loading ? "not-allowed" : "pointer" }}>
            {loading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
    </div>
  );
}
