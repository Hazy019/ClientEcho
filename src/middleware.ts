import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // 1. Global Security Headers
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV === "production") {
    supabaseResponse.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // Route-specific Framing & Security Headers (Section 1 & 9)
  if (pathname.startsWith("/embed")) {
    // Embed pages are intended to be framed on arbitrary creator sites
    supabaseResponse.headers.set("Content-Security-Policy", "frame-ancestors *");
    // Fast-path return for embed widgets (skip auth roundtrips for maximum speed)
    return supabaseResponse;
  } else if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/widgets") ||
    pathname.startsWith("/testimonials") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/channels") ||
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    // Authenticated and Auth surfaces MUST reject framing to prevent Clickjacking attacks
    supabaseResponse.headers.set("X-Frame-Options", "DENY");
    supabaseResponse.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  }

  // Fast-path: Password reset & forgot password pages do not require auth lookup
  if (pathname === "/forgot-password" || pathname === "/reset-password") {
    return supabaseResponse;
  }

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/widgets") ||
    pathname.startsWith("/testimonials") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/channels");

  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  // If the route is neither protected, admin, nor auth redirect check, skip auth network call
  if (!isProtectedRoute && !isAdminRoute && !isAuthRoute) {
    return supabaseResponse;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Safe authentication check with error shielding for stale refresh tokens
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    }
  } catch {
    user = null;
  }

  const role = user?.app_metadata?.role;
  const isTechAdmin = role === "tech_admin" || user?.email === "admin@clientecho.com";

  // 2. Protected Creator Routes (Requires authenticated creator, Tech Admin is redirected to /admin)
  if (isProtectedRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
    // Tech Admin MUST land on tech admin portal
    if (isTechAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  // 3. Tech Admin Route (Requires authenticated user with tech admin status)
  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
    if (!isTechAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // 4. Auth Routes (If user is ALREADY logged in, redirect to respective role dashboard immediately)
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = isTechAdmin ? "/admin" : "/testimonials";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/embed/:path*",
    "/dashboard/:path*",
    "/widgets/:path*",
    "/testimonials/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/channels/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ],
};
