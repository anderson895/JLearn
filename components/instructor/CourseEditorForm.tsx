"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, Plus, X, Upload, Save, Loader2 } from "lucide-react";
import Image from "next/image";

const schema = z.object({
  title: z.string().min(5, "At least 5 characters"),
  shortDesc: z.string().min(20).max(200),
  description: z.string().min(50),
  category: z.string().min(1, "Select a category"),
  level: z.enum(["beginner", "intermediate", "advanced", "all-levels"]),
  language: z.string().default("English"),
  price: z.coerce.number().min(0),
  isFree: z.boolean().default(false),
});

type Form = z.infer<typeof schema>;

type SectionForm = {
  id: number;
  title: string;
  order: number;
  lessons: any[];
};

type CourseFormData = Form & {
  thumbnail: string;
  sections: SectionForm[];
  outcomes: string[];
  requirements: string[];
};

type Props = {
  initialData?: Partial<CourseFormData>;
  mode: "create" | "edit";
  slug?: string;
};

const cats = ["Programming", "Web Development", "Data Science", "Machine Learning", "Design", "Business", "Photography", "Music", "Finance", "Health & Fitness"];
const steps = ["Basic Info", "Details", "Curriculum", "Pricing"];

const defaultData: CourseFormData = {
  title: "",
  shortDesc: "",
  description: "",
  category: "",
  level: "all-levels",
  language: "English",
  price: 0,
  isFree: false,
  thumbnail: "",
  sections: [{ id: 1, title: "Introduction", order: 1, lessons: [] }],
  outcomes: [""],
  requirements: [""],
};

export default function CourseEditorForm({ initialData, mode, slug }: Props) {
  const router = useRouter();
  const mergedData = useMemo(() => ({
    ...defaultData,
    ...initialData,
    sections: initialData?.sections?.length
      ? initialData.sections.map((section, index) => ({
          id: Number(section.id ?? index + 1),
          title: section.title || `Section ${index + 1}`,
          order: section.order ?? index + 1,
          lessons: section.lessons || [],
        }))
      : defaultData.sections,
    outcomes: initialData?.outcomes?.length ? initialData.outcomes : defaultData.outcomes,
    requirements: initialData?.requirements?.length ? initialData.requirements : defaultData.requirements,
  }), [initialData]);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [thumbnail, setThumbnail] = useState(mergedData.thumbnail || "");
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sections, setSections] = useState<SectionForm[]>(mergedData.sections);
  const [outcomes, setOutcomes] = useState(mergedData.outcomes);
  const [reqs, setReqs] = useState(mergedData.requirements);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: mergedData.title,
      shortDesc: mergedData.shortDesc,
      description: mergedData.description,
      category: mergedData.category,
      level: mergedData.level,
      language: mergedData.language,
      price: mergedData.price,
      isFree: mergedData.isFree,
    },
  });

  useEffect(() => {
    reset({
      title: mergedData.title,
      shortDesc: mergedData.shortDesc,
      description: mergedData.description,
      category: mergedData.category,
      level: mergedData.level,
      language: mergedData.language,
      price: mergedData.price,
      isFree: mergedData.isFree,
    });
    setThumbnail(mergedData.thumbnail || "");
    setThumbFile(null);
    setSections(mergedData.sections);
    setOutcomes(mergedData.outcomes);
    setReqs(mergedData.requirements);
  }, [mergedData, reset]);

  const isFree = watch("isFree");

  async function uploadThumb(file: File) {
    setUploading(true);
    try {
      const { data: sig } = await axios.post("/api/upload/sign", { folder: "jlearn/thumbnails", resourceType: "image" });
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sig.apiKey);
      fd.append("timestamp", sig.timestamp);
      fd.append("signature", sig.signature);
      fd.append("folder", sig.folder);
      fd.append("upload_preset", sig.uploadPreset);
      const { data } = await axios.post(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, fd);
      return data.secure_url as string;
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: Form) {
    setSaving(true);
    try {
      let imageUrl = thumbnail;
      if (thumbFile && !thumbnail.startsWith("https://res.cloudinary")) {
        imageUrl = await uploadThumb(thumbFile);
      }

      const payload = {
        ...data,
        thumbnail: imageUrl || "",
        sections: sections.map(({ id, ...section }, index) => ({ ...section, order: index + 1 })),
        outcomes: outcomes.filter(Boolean),
        requirements: reqs.filter(Boolean),
      };

      if (mode === "edit" && slug) {
        await axios.patch(`/api/courses/${slug}`, payload);
        toast.success("Course updated!");
      } else {
        await axios.post("/api/instructor/courses", payload);
        toast.success("Course created!");
      }

      router.push("/instructor");
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to ${mode} course`);
    } finally {
      setSaving(false);
    }
  }

  function handleInvalidSubmit(errs: any) {
    const stepFields: Record<number, string[]> = {
      0: ["title", "shortDesc", "description"],
      1: ["category", "level"],
      3: ["price"],
    };

    for (const [stepIndex, fields] of Object.entries(stepFields)) {
      if (fields.some((field) => errs[field])) {
        setStep(Number(stepIndex));
        const firstMsg = fields.map((field) => errs[field]?.message).find(Boolean);
        toast.error(firstMsg || "Please fill in all required fields");
        return;
      }
    }

    toast.error("Please fill in all required fields");
  }

  const Field = ({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>{label}</label>
      {children}
      {err && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{err}</p>}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl transition-colors"
            style={{ color: "var(--muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{mode === "edit" ? "Edit Course" : "Create New Course"}</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {mode === "edit" ? "Update your course details and publish changes." : "Fill in the details to publish your course"}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {steps.map((stepLabel, index) => (
            <button
              key={stepLabel}
              onClick={() => setStep(index)}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: index === step ? "var(--brand)" : index < step ? "var(--brand-light)" : "var(--surface-1)",
                color: index === step ? "#fff" : index < step ? "var(--brand)" : "var(--muted)",
                border: `1px solid ${index <= step ? "var(--brand)" : "var(--border)"}`,
              }}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: index === step ? "rgba(255,255,255,0.2)" : "transparent" }}>{index + 1}</span>
              {stepLabel}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)}>
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <div className="rounded-2xl p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                <h3 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Thumbnail</h3>
                <label className="relative block aspect-video rounded-xl overflow-hidden cursor-pointer transition-colors" style={{ border: thumbnail ? "2px solid var(--brand)" : "2px dashed var(--border)" }}>
                  {thumbnail ? (
                    <Image src={thumbnail} alt="Course thumbnail" fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: "var(--muted)" }}>
                      {uploading ? <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} /> : <><Upload className="w-8 h-8" /><span className="text-sm">Click to upload thumbnail (16:9)</span><span className="text-xs">PNG, JPG up to 5MB</span></>}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5_000_000) {
                        toast.error("Image must be under 5MB");
                        return;
                      }
                      setThumbnail(URL.createObjectURL(file));
                      setThumbFile(file);
                    }}
                  />
                </label>
              </div>
              <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Course Information</h3>
                <Field label="Title" err={errors.title?.message}><input {...register("title")} placeholder="e.g. Complete React Developer Course" className="input-field" /></Field>
                <Field label="Short Description" err={errors.shortDesc?.message}><textarea {...register("shortDesc")} rows={2} placeholder="Brief description shown in course cards (max 200 chars)" className="input-field resize-none" /></Field>
                <Field label="Full Description" err={errors.description?.message}><textarea {...register("description")} rows={5} placeholder="Detailed course description…" className="input-field resize-none" /></Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Category" err={errors.category?.message}>
                    <select {...register("category")} className="input-field">
                      <option value="">Select…</option>
                      {cats.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </Field>
                  <Field label="Level" err={errors.level?.message}>
                    <select {...register("level")} className="input-field">
                      <option value="all-levels">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </Field>
                </div>
              </div>
              {[["Learning Outcomes", outcomes, setOutcomes, "Students will learn…"], ["Requirements", reqs, setReqs, "Students should already know…"]].map(([label, arr, setArr, placeholder]: any) => (
                <div key={label} className="rounded-2xl p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                  <h3 className="font-semibold mb-3" style={{ color: "var(--foreground)" }}>{label}</h3>
                  <div className="space-y-2">
                    {arr.map((value: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <input value={value} onChange={(e) => {
                          const next = [...arr];
                          next[index] = e.target.value;
                          setArr(next);
                        }} placeholder={placeholder} className="input-field flex-1" />
                        {arr.length > 1 && <button type="button" onClick={() => setArr(arr.filter((_: any, itemIndex: number) => itemIndex !== index))} className="p-2 rounded-lg transition-colors" style={{ color: "#ef4444" }}><X className="w-4 h-4" /></button>}
                      </div>
                    ))}
                    <button type="button" onClick={() => setArr([...arr, ""])} className="flex items-center gap-1.5 text-sm font-medium mt-2" style={{ color: "var(--brand)" }}>
                      <Plus className="w-4 h-4" /> Add item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <div className="rounded-2xl p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                <h3 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Course Sections</h3>
                <div className="space-y-2 mb-3">
                  {sections.map((section, index) => (
                    <div key={section.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <span className="text-xs font-medium w-16 shrink-0" style={{ color: "var(--muted)" }}>Section {index + 1}</span>
                      <input value={section.title} onChange={(e) => setSections((prev) => prev.map((item) => item.id === section.id ? { ...item, title: e.target.value } : item))} className="flex-1 bg-transparent text-sm font-medium outline-none" style={{ color: "var(--foreground)" }} />
                      {sections.length > 1 && (
                        <button type="button" onClick={() => setSections((prev) => prev.filter((item) => item.id !== section.id))} style={{ color: "#ef4444" }}>
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSections((prev) => [...prev, { id: Date.now(), title: "New Section", order: prev.length + 1, lessons: [] }])}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-colors"
                  style={{ border: "2px dashed var(--border)", color: "var(--muted)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; (e.currentTarget as HTMLElement).style.color = "var(--brand)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
                >
                  <Plus className="w-4 h-4" /> Add Section
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="rounded-2xl p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                <h3 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Pricing</h3>
                <label className="flex items-center gap-3 p-4 rounded-xl mb-4 cursor-pointer" style={{ border: "1.5px solid var(--border)" }}>
                  <input type="checkbox" {...register("isFree")} className="rounded" />
                  <div>
                    <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>Free Course</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Make this course available to everyone for free</p>
                  </div>
                </label>
                {!isFree && (
                  <Field label="Price (USD)" err={errors.price?.message}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium" style={{ color: "var(--muted)" }}>$</span>
                      <input {...register("price")} type="number" step="0.01" min="0" placeholder="29.99" className="input-field pl-7" />
                    </div>
                  </Field>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="btn-outline" style={{ opacity: step === 0 ? 0.4 : 1 }}>Previous</button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => setStep((current) => current + 1)} className="btn-primary">Continue</button>
            ) : (
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> {mode === "edit" ? "Update Course" : "Create Course"}</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
