import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Simple in-memory fallback rate limiter for testing & dev when Upstash env vars are unset
const inMemoryStore = new Map<string, { count: number; expiresAt: number }>();

function checkInMemoryLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = inMemoryStore.get(key);
  if (!entry || entry.expiresAt < now) {
    inMemoryStore.set(key, { count: 1, expiresAt: now + windowMs });
    return { success: true, remaining: limit - 1, limit };
  }
  if (entry.count >= limit) {
    return { success: false, remaining: 0, limit };
  }
  entry.count += 1;
  return { success: true, remaining: limit - entry.count, limit };
}

let ipRatelimit: Ratelimit | null = null;
let slugRatelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = Redis.fromEnv();
  ipRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute per IP
    analytics: true,
    prefix: "@clientecho/ip",
  });
  slugRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 requests per minute per widget slug
    analytics: true,
    prefix: "@clientecho/slug",
  });
}

/**
 * Checks dual rate limiting: per IP AND per widget slug.
 * Both limits must pass for the request to be allowed.
 */
export async function checkDualRateLimit(ip: string, widgetSlug: string): Promise<{ success: boolean; reason?: string }> {
  const safeIp = ip || "127.0.0.1";
  const safeSlug = widgetSlug || "global";

  if (ipRatelimit && slugRatelimit) {
    const [ipRes, slugRes] = await Promise.all([
      ipRatelimit.limit(safeIp),
      slugRatelimit.limit(safeSlug),
    ]);

    if (!ipRes.success) {
      return { success: false, reason: "Too many requests from your IP. Please try again in a minute." };
    }
    if (!slugRes.success) {
      return { success: false, reason: "Too many submissions for this widget. Please try again later." };
    }
    return { success: true };
  }

  // Fallback to in-memory rate limiting if Upstash Redis credentials are not set
  const ipCheck = checkInMemoryLimit(`ip:${safeIp}`, 5, 60000);
  if (!ipCheck.success) {
    return { success: false, reason: "Too many requests from your IP. Please try again in a minute." };
  }

  const slugCheck = checkInMemoryLimit(`slug:${safeSlug}`, 20, 60000);
  if (!slugCheck.success) {
    return { success: false, reason: "Too many submissions for this widget. Please try again later." };
  }

  return { success: true };
}
