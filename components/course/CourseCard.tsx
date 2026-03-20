import Link from "next/link";
import Image from "next/image";
import { Star, Clock, BookOpen, Play } from "lucide-react";
import { formatDuration } from "@/lib/utils/format";

interface CourseCardProps {
  course: any;
  progress?: number;
  showProgress?: boolean;
}

export default function CourseCard({ course, progress = 0, showProgress = false }: CourseCardProps) {
  const rating   = course.stats?.averageRating || 0;
  const students = course.stats?.totalStudents || 0;
  const duration = course.stats?.totalDuration || 0;
  const lessons  = course.stats?.totalLessons || 0;

  return (
    <Link href={`/courses/${course.slug}`} className="course-card group block">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden" style={{ background: "var(--surface-2)" }}>
        {course.thumbnail ? (
          <Image src={course.thumbnail} alt={course.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-10 h-10" style={{ color: "var(--muted)" }} />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.35)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white/60" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}>
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {course.bestseller && <span className="badge badge-amber">Bestseller</span>}
          {course.isFree     && <span className="badge badge-green">Free</span>}
        </div>
        {/* Progress bar */}
        {showProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "rgba(0,0,0,0.3)" }}>
            <div className="h-full transition-all" style={{ width: `${progress}%`, background: "var(--brand)" }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--brand)" }}>{course.category}</p>
        <h3 className="font-semibold leading-snug line-clamp-2 mb-2 transition-colors group-hover:text-[--brand]" style={{ color: "var(--foreground)", fontSize: "0.9rem" }}>
          {course.title}
        </h3>
        {course.instructor?.name && (
          <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>{course.instructor.name}</p>
        )}
        {rating > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>{rating.toFixed(1)}</span>
            <div className="flex">{Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5" fill={i < Math.round(rating) ? "#f59e0b" : "none"} stroke={i < Math.round(rating) ? "#f59e0b" : "var(--muted)"} />
            ))}</div>
            <span className="text-xs" style={{ color: "var(--muted)" }}>({students.toLocaleString()})</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-xs mb-3" style={{ color: "var(--muted)" }}>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDuration(duration)}</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{lessons} lessons</span>
        </div>
        {showProgress && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted)" }}>
              <span>{progress}% complete</span>
              {progress === 100 && <span style={{ color: "#22c55e" }}>✓ Done</span>}
            </div>
            <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
        <div className="flex items-center justify-between">
          {course.isFree ? (
            <span className="font-bold text-sm" style={{ color: "#22c55e" }}>Free</span>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="font-bold" style={{ color: "var(--foreground)" }}>${course.price?.toFixed(2)}</span>
              {course.originalPrice > course.price && (
                <span className="text-xs line-through" style={{ color: "var(--muted)" }}>${course.originalPrice?.toFixed(2)}</span>
              )}
            </div>
          )}
          {course.originalPrice > course.price && !course.isFree && (
            <span className="badge badge-red">{Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% off</span>
          )}
        </div>
      </div>
    </Link>
  );
}
