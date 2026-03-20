"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render theme-dependent styles after hydration to avoid mismatch
  useEffect(() => setMounted(true), []);

  const themeOptions = [
    { value: "light",  label: "Light",  Icon: Sun },
    { value: "dark",   label: "Dark",   Icon: Moon },
    { value: "system", label: "System", Icon: Monitor },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Settings</h1>

      {/* Theme */}
      <div className="rounded-2xl p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Appearance</h2>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(({ value, label, Icon }) => {
            const isActive = mounted && theme === value;
            return (
              <button key={value} onClick={() => setTheme(value)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                style={{
                  background: isActive ? "var(--brand-light)" : "var(--surface-2)",
                  border: `2px solid ${isActive ? "var(--brand)" : "var(--border)"}`,
                  color: isActive ? "var(--brand)" : "var(--muted)",
                }}>
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications placeholder */}
      <div className="rounded-2xl p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Notifications</h2>
        {[
          ["Email Notifications", "Receive updates about your enrolled courses"],
          ["Progress Reminders", "Get reminded to keep your learning streak"],
          ["New Course Alerts",   "Be notified when instructors you follow publish new content"],
        ].map(([label, desc]) => (
          <div key={label} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{label}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-10 h-5 rounded-full peer-checked:after:translate-x-5 after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:transition-all"
                style={{ background: "var(--brand)" }} />
            </label>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl p-6" style={{ background: "var(--surface-1)", border: "1px solid #fca5a5" }}>
        <h2 className="font-semibold mb-2" style={{ color: "#ef4444" }}>Danger Zone</h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Permanently delete your account and all data.</p>
        <button className="btn-outline text-sm" style={{ color: "#ef4444", borderColor: "#fca5a5" }}>
          Delete Account
        </button>
      </div>
    </div>
  );
}