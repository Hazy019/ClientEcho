import { Redis } from "@upstash/redis";

const isMockRedis =
  !process.env.UPSTASH_REDIS_REST_URL ||
  process.env.UPSTASH_REDIS_REST_URL.includes("mock") ||
  process.env.NODE_ENV === "test";

if (!isMockRedis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = Redis.fromEnv();
  } catch (err) {
    console.error("[REDIS_INIT_ERROR] Failed to initialize Upstash Redis client:", err);
  }
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
