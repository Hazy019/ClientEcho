import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

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

// ── Multi-Tier L1 In-Memory Cache (0.01ms instant access) ──
const l1MemoryCache = new Map<string, { data: any; expiresAt: number }>();
const L1_TTL_MS = 60 * 1000; // 60 seconds fast memory cache
const L2_TTL_SECONDS = 60 * 60 * 24; // 24 hours Redis cache

export async function getCachedWidgetPayload(slug: string): Promise<any | null> {
  const cacheKey = `@clientecho/widget:${slug}`;
  const now = Date.now();

  // 1. Check L1 Memory Cache (0.01ms response time)
  const l1Entry = l1MemoryCache.get(cacheKey);
  if (l1Entry && l1Entry.expiresAt > now) {
    return l1Entry.data;
  }

  // 2. Check L2 Upstash Redis Cache
  if (!redis) return null;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === "string" ? JSON.parse(cached) : cached;
      // Populate L1 cache for subsequent fast reads
      l1MemoryCache.set(cacheKey, { data, expiresAt: now + L1_TTL_MS });
      return data;
    }
  } catch (err) {
    console.error("Redis get error:", err);
  }
  return null;
}

export async function setCachedWidgetPayload(slug: string, data: any): Promise<void> {
  const cacheKey = `@clientecho/widget:${slug}`;
  const now = Date.now();

  // Set L1 Memory cache immediately
  l1MemoryCache.set(cacheKey, { data, expiresAt: now + L1_TTL_MS });

  // Set L2 Upstash Redis asynchronously
  if (!redis) return;
  try {
    await redis.set(cacheKey, JSON.stringify(data), {
      ex: L2_TTL_SECONDS,
    });
  } catch (err) {
    console.error("Redis set error:", err);
  }
}

export async function invalidateWidgetCache(slug: string): Promise<void> {
  const cacheKey = `@clientecho/widget:${slug}`;
  // Invalidate L1 memory cache
  l1MemoryCache.delete(cacheKey);

  // Invalidate L2 Redis cache
  if (!redis) return;
  try {
    await redis.del(cacheKey);
  } catch (err) {
    console.error("Redis invalidation error:", err);
  }
}
