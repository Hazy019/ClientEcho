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
let loginIpRatelimit: Ratelimit | null = null;
let loginAccountRatelimit: Ratelimit | null = null;

const isMockRedis =
  !process.env.UPSTASH_REDIS_REST_URL ||
  process.env.UPSTASH_REDIS_REST_URL.includes("mock") ||
  process.env.NODE_ENV === "test";

if (!isMockRedis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
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
    loginIpRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "5 m"), // 10 attempts per 5 minutes per IP
      analytics: true,
      prefix: "@clientecho/login-ip",
    });
    loginAccountRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 failed attempts per 15 minutes per account
      analytics: true,
      prefix: "@clientecho/login-account",
    });
  } catch (err) {
    console.error("[RATE_LIMIT_INIT_ERROR] Failed to initialize Upstash Redis:", err);
  }
}

/**
 * Checks dual rate limiting: per IP AND per widget slug.
 * Both limits must pass for the request to be allowed.
 */
export async function checkDualRateLimit(ip: string, widgetSlug: string): Promise<{ success: boolean; reason?: string }> {
  const safeIp = ip || "127.0.0.1";
  const safeSlug = widgetSlug || "global";

  if (ipRatelimit && slugRatelimit) {
    try {
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
    } catch (err) {
      console.warn("[RATE_LIMIT_FALLBACK] Upstash unreachable, falling back to in-memory rate limiting:", err);
    }
  }

  // Fallback to in-memory rate limiting if Upstash Redis credentials are not set or fail
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

// In-memory lockout and failure store for login brute-force defense
const loginFailureStore = new Map<string, { attempts: number; lockedUntil: number }>();

/**
 * Checks login rate limit & brute-force account lockout.
 * Rejects requests if IP is sending excessive traffic or account has exceeded failure threshold.
 */
export async function checkLoginRateLimit(
  ip: string,
  email: string
): Promise<{ success: boolean; reason?: string; retryAfterSeconds?: number }> {
  const safeIp = ip || "127.0.0.1";
  const safeEmail = email ? email.toLowerCase().trim() : "anonymous";
  const now = Date.now();

  // Check account lockout in memory store
  const accountKey = `lockout:${safeEmail}`;
  const accountEntry = loginFailureStore.get(accountKey);
  if (accountEntry && accountEntry.lockedUntil > now) {
    const retryAfter = Math.ceil((accountEntry.lockedUntil - now) / 1000);
    return {
      success: false,
      reason: `Account temporarily locked due to repeated failed login attempts. Please try again in ${retryAfter} seconds or reset your password.`,
      retryAfterSeconds: retryAfter,
    };
  }

  if (loginIpRatelimit) {
    try {
      const ipRes = await loginIpRatelimit.limit(safeIp);
      if (!ipRes.success) {
        return {
          success: false,
          reason: "Too many login attempts from this IP address. Please try again in 5 minutes.",
          retryAfterSeconds: 300,
        };
      }
      return { success: true };
    } catch (err) {
      console.warn("[LOGIN_RATE_LIMIT_FALLBACK] Upstash unreachable, falling back to in-memory rate limiting:", err);
    }
  }

  const ipCheck = checkInMemoryLimit(`login_ip:${safeIp}`, 10, 300000);
  if (!ipCheck.success) {
    return {
      success: false,
      reason: "Too many login attempts from this IP address. Please try again in 5 minutes.",
      retryAfterSeconds: 300,
    };
  }

  return { success: true };
}

/**
 * Record a failed login attempt for an email/IP pair and trigger temporary lockout after threshold.
 */
export function recordLoginFailure(email: string): { attempts: number; isLocked: boolean } {
  const safeEmail = email ? email.toLowerCase().trim() : "anonymous";
  const now = Date.now();
  const accountKey = `lockout:${safeEmail}`;
  const entry = loginFailureStore.get(accountKey);

  if (!entry || (entry.lockedUntil > 0 && entry.lockedUntil < now)) {
    loginFailureStore.set(accountKey, { attempts: 1, lockedUntil: 0 });
    return { attempts: 1, isLocked: false };
  }

  const newAttempts = entry.attempts + 1;
  if (newAttempts >= 5) {
    // 15-minute temporary lockout
    loginFailureStore.set(accountKey, { attempts: newAttempts, lockedUntil: now + 15 * 60 * 1000 });
    return { attempts: newAttempts, isLocked: true };
  }

  loginFailureStore.set(accountKey, { attempts: newAttempts, lockedUntil: 0 });
  return { attempts: newAttempts, isLocked: false };
}

/**
 * Reset login failure counter on successful authentication.
 */
export function resetLoginFailures(email: string): void {
  const safeEmail = email ? email.toLowerCase().trim() : "anonymous";
  loginFailureStore.delete(`lockout:${safeEmail}`);
}
