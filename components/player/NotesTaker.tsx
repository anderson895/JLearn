"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { formatDuration } from "@/lib/utils/format";

export default function NotesTaker({ courseSlug, lessonId, currentTime }: { courseSlug: string; lessonId: string; currentTime: number }) {
  const [notes,   setNotes]   = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [lessonId]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/progress/${courseSlug}/notes?lessonId=${lessonId}`);
      setNotes(data.notes || []);
    } catch {} finally { setLoading(false); }
  }

  async function add() {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await axios.post(`/api/progress/${courseSlug}/notes`, { lessonId, content: newNote.trim(), timestamp: Math.round(currentTime) });
      setNewNote(""); await load(); toast.success("Note saved");
    } catch { toast.error("Failed to save note"); } finally { setSaving(false); }
  }

  async function del(idx: number) {
    try {
      await axios.delete(`/api/progress/${courseSlug}/notes`, { data: { lessonId, noteIndex: idx } });
      setNotes(prev => prev.filter((_, i) => i !== idx));
    } catch { toast.error("Failed to delete"); }
  }

  return (
    <div className="flex flex-col" style={{ height: "280px", background: "var(--surface-1)", borderTop: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <FileText className="w-4 h-4" style={{ color: "var(--muted)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Notes</span>
        {currentTime > 0 && <span className="ml-auto text-xs" style={{ color: "var(--muted)" }}>{formatDuration(currentTime)}</span>}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8" style={{ color: "var(--muted)" }}>
            <FileText className="w-7 h-7 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No notes yet. Add one below.</p>
          </div>
        ) : notes.map((note, i) => (
          <div key={i} className="group flex gap-2 p-3 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="flex-1 min-w-0">
              {note.timestamp > 0 && <span className="text-xs font-medium mb-1 block" style={{ color: "var(--brand)" }}>⏱ {formatDuration(note.timestamp)}</span>}
              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{note.content}</p>
            </div>
            <button onClick={() => del(i)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all flex-shrink-0"
              style={{ color: "#ef4444" }}>
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex-shrink-0 p-2" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex gap-2">
          <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && e.metaKey) add(); }}
            placeholder="Take a note… (⌘+Enter to save)" rows={2}
            className="flex-1 resize-none rounded-xl text-xs outline-none"
            style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", color: "var(--foreground)", padding: "0.5rem 0.75rem" }}
            onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; }}
            onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          />
          <button onClick={add} disabled={!newNote.trim() || saving}
            className="flex-shrink-0 w-8 h-8 mt-1 rounded-xl flex items-center justify-center"
            style={{ background: "var(--brand)", opacity: !newNote.trim() || saving ? 0.5 : 1 }}>
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
