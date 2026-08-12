import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = Redis.fromEnv();
}

const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours fallback TTL

export async function getCachedWidgetPayload(slug: string): Promise<any | null> {
  if (!redis) return null;
  try {
    const cached = await redis.get(`@clientecho/widget:${slug}`);
    if (cached) {
      return typeof cached === "string" ? JSON.parse(cached) : cached;
    }
  } catch (err) {
    console.error("Redis get error:", err);
  }
  return null;
}

export async function setCachedWidgetPayload(slug: string, data: any): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(`@clientecho/widget:${slug}`, JSON.stringify(data), {
      ex: CACHE_TTL_SECONDS,
    });
  } catch (err) {
    console.error("Redis set error:", err);
  }
}

export async function invalidateWidgetCache(slug: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(`@clientecho/widget:${slug}`);
  } catch (err) {
    console.error("Redis invalidation error:", err);
  }
}
