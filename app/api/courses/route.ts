import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Course from "@/models/Course";
import { cacheGet, cacheSet, CacheKeys, apiRateLimit } from "@/lib/cache/redis";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "anon";
  const { success } = await apiRateLimit.limit(ip);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const page     = parseInt(searchParams.get("page") || "1");
  const limit    = parseInt(searchParams.get("limit") || "12");
  const q        = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const level    = searchParams.get("level") || "";
  const sort     = searchParams.get("sort") || "popular";
  const price    = searchParams.get("price") || "";
  const featured = searchParams.get("featured") === "true";

  const cacheKey = CacheKeys.courses(page, JSON.stringify({ q, category, level, sort, price, featured }));
  const cached = await cacheGet(cacheKey);
  if (cached) return NextResponse.json(cached);

  await connectDB();

  const query: Record<string, any> = { status: "published" };
  if (q)        query.$text     = { $search: q };
  if (category) query.category  = category;
  if (level)    query.level     = level;
  if (featured) query.featured  = true;
  if (price === "free") query.isFree = true;
  else if (price === "paid") query.isFree = false;

  const sortMap: Record<string, any> = {
    popular:    { "stats.totalStudents": -1 },
    rating:     { "stats.averageRating": -1 },
    newest:     { publishedAt: -1 },
    price_asc:  { price: 1 },
    price_desc: { price: -1 },
  };

  const [courses, total] = await Promise.all([
    Course.find(query)
      .populate("instructor", "name image headline")
      .sort(sortMap[sort] || sortMap.popular)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Course.countDocuments(query),
  ]);

  const result = {
    courses,
    pagination: { page, limit, total, pages: Math.ceil(total / limit), hasNext: page < Math.ceil(total / limit), hasPrev: page > 1 },
  };
  await cacheSet(cacheKey, result, 300);
  return NextResponse.json(result);
}
