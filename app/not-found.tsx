import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="text-center px-4">
        <p className="text-8xl font-bold mb-4 gradient-text">404</p>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Page not found</h1>
        <p className="mb-8" style={{ color: "var(--muted)" }}>The page you're looking for doesn't exist or has been moved.</p>
        <Link href="/" className="btn-primary">
          <ArrowLeft className="w-4 h-4" /> Go Home
        </Link>
      </div>
    </div>
  );
}
