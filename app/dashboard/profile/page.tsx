"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Save, Loader2, Camera } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const user = session?.user as any;

  const [name,     setName]     = useState(user?.name || "");
  const [headline, setHeadline] = useState(user?.headline || "");
  const [bio,      setBio]      = useState(user?.bio || "");
  const [saving,   setSaving]   = useState(false);

  async function save() {
    setSaving(true);
    try {
      await axios.patch("/api/users/profile", { name, headline, bio });
      await update({ name, headline });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save profile.");
    } finally { setSaving(false); }
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Profile Settings</h1>

      {/* Avatar */}
      <div className="rounded-2xl p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Avatar</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Image src={user?.image || "/globe.svg"} alt="" width={72} height={72} className="rounded-full" />
            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              style={{ background: "rgba(0,0,0,0.4)" }}>
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--foreground)" }}>{user?.name}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{user?.email}</p>
            <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--brand)" }}>{user?.role}</p>
          </div>
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>Avatar is synced from your Google account.</p>
      </div>

      {/* Info */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Personal Information</h2>
        <Field label="Full Name">
          <input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Your full name" />
        </Field>
        <Field label="Professional Headline">
          <input value={headline} onChange={e => setHeadline(e.target.value)} maxLength={120} className="input-field" placeholder="e.g. Full-Stack Developer & Lifelong Learner" />
        </Field>
        <Field label="Bio">
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} maxLength={500} className="input-field resize-none"
            placeholder="Tell the community a bit about yourself…" />
          <p className="text-xs mt-1 text-right" style={{ color: "var(--muted)" }}>{bio.length}/500</p>
        </Field>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary" style={{ padding: "0.75rem 2rem" }}>
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
      </button>
    </div>
  );
}
