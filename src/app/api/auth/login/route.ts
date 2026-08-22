import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkLoginRateLimit, recordLoginFailure, resetLoginFailures } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check IP rate limit and account lockout
    const rateLimitCheck = await checkLoginRateLimit(ip, cleanEmail);
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        {
          error: rateLimitCheck.reason || "Too many login attempts. Please try again later.",
          locked: true,
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: rateLimitCheck.retryAfterSeconds
            ? { "Retry-After": String(rateLimitCheck.retryAfterSeconds) }
            : {},
        }
      );
    }

    // 2. Setup response object to carry session cookies
    let response = NextResponse.json({ success: true, message: "Logged in successfully" });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              sameSite: "lax",
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
            });
          });
        },
      },
    });

    // 3. Attempt authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user) {
      // Record failure for lockout tracking
      const failureStatus = recordLoginFailure(cleanEmail);
      
      // Escalating delay on repeated failure (up to 2 seconds) to slow down automated attacks
      const backoffMs = Math.min(2000, failureStatus.attempts * 400);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));

      if (failureStatus.isLocked) {
        return NextResponse.json(
          {
            error: "Too many failed attempts. Account is temporarily locked for 15 minutes.",
            locked: true,
            retryAfterSeconds: 900,
          },
          { status: 429, headers: { "Retry-After": "900" } }
        );
      }

      return NextResponse.json(
        {
          error: error?.message || "Invalid email or password",
          remainingAttempts: Math.max(0, 5 - failureStatus.attempts),
        },
        { status: 401 }
      );
    }

    // 4. Successful login: reset failed attempts
    resetLoginFailures(cleanEmail);

    return response;
  } catch (err: any) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { error: "Internal server error during login" },
      { status: 500 }
    );
  }
}
