"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import axios from "axios";
import CourseCard from "@/components/course/CourseCard";

const categories = ["All","Programming","Web Development","Data Science","Machine Learning","Design","Business","Photography","Music"];
const levels     = [["", "All Levels"],["beginner","Beginner"],["intermediate","Intermediate"],["advanced","Advanced"]];
const sorts      = [["popular","Most Popular"],["rating","Highest Rated"],["newest","Newest"],["price_asc","Price ↑"],["price_desc","Price ↓"]];

function useDebounce<T>(value: T, ms: number) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return d;
}

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);

  const [q,        setQ]        = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [level,    setLevel]    = useState("");
  const [price,    setPrice]    = useState("");
  const [sort,     setSort]     = useState("popular");

  const dQ = useDebounce(q, 400);

  const fetchCourses = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: "12", sort, ...(dQ && { q: dQ }), ...(category && { category }), ...(level && { level }), ...(price && { price }) });
      const { data } = await axios.get(`/api/courses?${params}`);
      setCourses(pg === 1 ? data.courses : prev => [...prev, ...data.courses]);
      setTotal(data.pagination.total);
      setPages(data.pagination.pages);
    } catch {} finally { setLoading(false); }
  }, [dQ, category, level, price, sort]);

  useEffect(() => { setPage(1); fetchCourses(1); }, [fetchCourses]);

  const hasFilters = category || level || price || q;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="border-b" style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--foreground)" }}>Browse Courses</h1>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--muted)" }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search for anything..." className="input-field pl-12" style={{ padding: "0.875rem 1rem 0.875rem 3rem", fontSize: "1rem" }} />
          </div>
          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat === "All" ? "" : cat)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{ background: (!category && cat === "All") || category === cat ? "var(--brand)" : "var(--surface-2)", color: (!category && cat === "All") || category === cat ? "#fff" : "var(--muted)" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select value={level} onChange={e => setLevel(e.target.value)} className="input-field" style={{ width: "auto", padding: "0.5rem 0.875rem" }}>
            {levels.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={price} onChange={e => setPrice(e.target.value)} className="input-field" style={{ width: "auto", padding: "0.5rem 0.875rem" }}>
            <option value="">All Prices</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="input-field" style={{ width: "auto", padding: "0.5rem 0.875rem" }}>
            {sorts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {hasFilters && (
            <button onClick={() => { setQ(""); setCategory(""); setLevel(""); setPrice(""); setSort("popular"); }}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-colors"
              style={{ color: "#ef4444", background: "#fee2e2" }}>
              <X className="w-4 h-4" /> Clear
            </button>
          )}
          <span className="ml-auto text-sm" style={{ color: "var(--muted)" }}>{total.toLocaleString()} courses</span>
        </div>

        {/* Grid */}
        {loading && courses.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "var(--muted)" }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>No courses found</h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {courses.map(c => <CourseCard key={c._id} course={c} />)}
            </div>
            {page < pages && (
              <div className="text-center mt-10">
                <button onClick={() => { const n = page + 1; setPage(n); fetchCourses(n); }} disabled={loading}
                  className="btn-outline" style={{ padding: "0.75rem 2rem" }}>
                  {loading ? "Loading..." : `Load More (${total - courses.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
