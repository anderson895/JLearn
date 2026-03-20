import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connect";
import { Certificate } from "@/models/index";
import { Award, Download, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import Link from "next/link";

async function getCertificates(userId: string) {
  await connectDB();
  return Certificate.find({ user: userId })
    .populate("course", "title thumbnail category")
    .sort({ issuedAt: -1 })
    .lean();
}

export default async function CertificatesPage() {
  const session = await auth();
  const certs = await getCertificates((session?.user as any).id);

  if (certs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Award className="w-16 h-16 mb-4 opacity-20" style={{ color: "var(--muted)" }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>No certificates yet</h2>
        <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>Complete a course to earn your first certificate.</p>
        <Link href="/courses" className="btn-primary">Browse Courses</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>My Certificates</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {certs.map((cert: any) => (
          <div key={cert._id.toString()} className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            {/* Certificate preview header */}
            <div className="p-6 text-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}>
              <Award className="w-10 h-10 text-white/80 mx-auto mb-2" />
              <p className="text-white font-bold text-lg">Certificate of Completion</p>
              <p className="text-white/80 text-sm mt-1">JLearn</p>
            </div>
            <div className="p-5">
              <h3 className="font-bold mb-1" style={{ color: "var(--foreground)" }}>{cert.course?.title}</h3>
              <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>{cert.course?.category}</p>
              <div className="flex items-center justify-between text-xs mb-4" style={{ color: "var(--muted)" }}>
                <span>Issued: {formatDate(cert.issuedAt)}</span>
                <span className="font-mono text-xs" style={{ color: "var(--brand)" }}>#{cert.certificateId?.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex gap-2">
                {cert.pdfUrl && (
                  <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 text-xs" style={{ padding: "0.5rem" }}>
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                )}
                <a href={`/certificates/${cert.certificateId}`} target="_blank" rel="noopener noreferrer" className="btn-outline flex-1 text-xs" style={{ padding: "0.5rem" }}>
                  <ExternalLink className="w-3.5 h-3.5" /> View
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
