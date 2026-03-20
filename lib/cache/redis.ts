import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const apiRateLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "1 m"), prefix: "rl:api" });
export const aiRateLimit  = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 h"), prefix: "rl:ai"  });

export async function cacheGet<T>(key: string): Promise<T | null> {
  try { return await redis.get<T>(key); } catch { return null; }
}
export async function cacheSet(key: string, value: unknown, ttl = 3600) {
  try { await redis.setex(key, ttl, JSON.stringify(value)); } catch {}
}
export async function cacheDel(key: string) {
  try { await redis.del(key); } catch {}
}
export async function deleteUserSession(userId: string) {
  try { await redis.del(`session:${userId}`); } catch {}
}

export const CacheKeys = {
  courses:  (page: number, f: string) => `courses:${page}:${f}`,
  course:   (slug: string) => `course:${slug}`,
  featured: () => "courses:featured",
} as const;
