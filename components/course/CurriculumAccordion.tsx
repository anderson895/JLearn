"use client";

import { useState } from "react";
import { ChevronDown, Play, FileText, HelpCircle, Clock, Eye } from "lucide-react";
import { formatDuration } from "@/lib/utils/format";

export default function CurriculumAccordion({ sections, isEnrolled }: { sections: any[]; isEnrolled: boolean }) {
  const [open, setOpen] = useState(new Set([sections[0]?._id?.toString()]));

  const typeIcon = (type: string) => ({ video: Play, article: FileText, quiz: HelpCircle }[type] || Play);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      {sections.map(section => {
        const id  = section._id?.toString();
        const dur = section.lessons?.reduce((a: number, l: any) => a + (l.duration || 0), 0) || 0;
        const isOpen = open.has(id);
        return (
          <div key={id} style={{ borderBottom: "1px solid var(--border)" }}>
            <button onClick={() => { const s = new Set(open); s.has(id) ? s.delete(id) : s.add(id); setOpen(s); }}
              className="flex items-center justify-between w-full px-5 py-4 text-left transition-colors"
              style={{ background: "var(--surface-1)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-1)"; }}>
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 transition-transform flex-shrink-0" style={{ color: "var(--muted)", transform: isOpen ? "rotate(180deg)" : "none" }} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{section.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{section.lessons?.length} lessons · {formatDuration(dur)}</p>
                </div>
              </div>
            </button>
            {isOpen && (
              <div style={{ borderTop: "1px solid var(--border)" }}>
                {section.lessons?.map((lesson: any) => {
                  const Icon = typeIcon(lesson.type);
                  const canAccess = isEnrolled || lesson.isPreview;
                  return (
                    <div key={lesson._id?.toString()} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: lesson.type === "quiz" ? "var(--accent)" : "var(--brand)" }} />
                      <span className="flex-1 text-sm" style={{ color: canAccess ? "var(--foreground)" : "var(--muted)" }}>{lesson.title}</span>
                      <div className="flex items-center gap-2">
                        {lesson.isPreview && !isEnrolled && <span className="flex items-center gap-1 text-xs" style={{ color: "var(--brand)" }}><Eye className="w-3.5 h-3.5" />Preview</span>}
                        {lesson.duration > 0 && <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}><Clock className="w-3 h-3" />{formatDuration(lesson.duration)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
