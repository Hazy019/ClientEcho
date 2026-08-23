"use client";

import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/testimonials";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "An unexpected error occurred during sign in.");
        setLoading(false);
        return;
      }

      // Fast direct client-side navigation without redundant profile round-trips
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      // Fallback in case fetch network error occurs
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        router.push(redirectTo);
        router.refresh();
      } catch (fallbackErr: any) {
        setErrorMessage("Unable to connect to authentication service. Please check your network connection.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center p-6 font-sans text-surface-white selection:bg-surface-white selection:text-ink-900">
      <div className="max-w-md w-full bg-ink-800 p-8 sm:p-10 rounded-3xl border border-surface-white/10 shadow-2xl space-y-6 animate-fade-in-up relative">
        {/* Absolute Corner Back Link */}
        <Link
          href="/"
          tabIndex={6}
          className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs text-surface-white/50 hover:text-surface-white focus:text-surface-white transition font-medium focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>

        {/* Centered Logo Anchor */}
        <div className="text-center space-y-3 pt-2">
          <Link href="/" tabIndex={-1} className="inline-block group" title="Return to Landing Page">
            <div className="w-12 h-12 bg-surface-white rounded-2xl flex items-center justify-center mx-auto p-2 shadow-sm transition-transform group-hover:scale-105">
              <Image
                src="/ClientEcho_logo.png"
                alt="ClientEcho Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
          <h1 className="font-display text-2xl font-bold text-surface-white">Sign In to ClientEcho</h1>
          <p className="text-surface-white/60 text-xs leading-relaxed">
            Multi-tenant testimonial engine for solo creators & agencies.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-surface-white/10 border border-surface-white/20 rounded-xl text-surface-white text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-mono font-semibold text-surface-white/70 uppercase tracking-wider mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-surface-white/40 absolute left-3.5 top-3 pointer-events-none" />
              <input
                id="login-email"
                ref={emailInputRef}
                type="email"
                name="email"
                autoComplete="email"
                tabIndex={1}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !password) {
                    e.preventDefault();
                    passwordInputRef.current?.focus();
                  }
                }}
                placeholder="creator@domain.com"
                className="w-full pl-10 pr-4 py-2.5 bg-ink-900 border border-surface-white/20 rounded-xl text-sm text-surface-white focus:outline-none focus:border-surface-white focus:ring-1 focus:ring-surface-white placeholder:text-surface-white/30 transition"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="login-password"
                className="text-xs font-mono font-semibold text-surface-white/70 uppercase tracking-wider"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                tabIndex={4}
                className="text-[11px] font-mono text-surface-white/70 hover:text-surface-white focus:text-surface-white underline focus:outline-none"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-surface-white/40 absolute left-3.5 top-3 pointer-events-none" />
              <input
                id="login-password"
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                tabIndex={2}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-ink-900 border border-surface-white/20 rounded-xl text-sm text-surface-white focus:outline-none focus:border-surface-white focus:ring-1 focus:ring-surface-white placeholder:text-surface-white/30 transition"
                required
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-surface-white/40 hover:text-surface-white transition cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            ref={submitButtonRef}
            type="submit"
            tabIndex={3}
            disabled={loading}
            className="w-full py-3.5 bg-surface-white hover:bg-surface-light text-ink-900 font-display font-semibold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-surface-white focus:ring-offset-2 focus:ring-offset-ink-900"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-ink-900" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-surface-white/60 pt-2 border-t border-surface-white/10">
          Don't have an account?{" "}
          <Link href="/signup" tabIndex={5} className="text-surface-white font-bold hover:underline focus:underline focus:outline-none">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink-900 flex items-center justify-center text-surface-white font-sans">
          <Loader2 className="w-6 h-6 animate-spin text-surface-white" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
