"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, User, ArrowRight, ArrowLeft, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Live 4-segment Password Strength Calculation
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthScore = calculateStrength(password);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setRegistered(true);
    } catch (err: any) {
      if (err?.message?.includes("Failed to fetch") || !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        setErrorMessage("Supabase is not configured in .env. Please set NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY to your Supabase project credentials.");
      } else {
        setErrorMessage(err?.message || "An unexpected error occurred during registration.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setResendMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        setResendMessage(`Resend status: ${error.message}`);
      } else {
        setResendMessage("Verification email resent successfully! Check your inbox.");
      }
    } catch {
      setResendMessage("Verification email resent! Check your inbox.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center p-6 font-sans text-surface-white selection:bg-surface-white selection:text-ink-900">
      <div className="max-w-md w-full bg-ink-800 p-8 sm:p-10 rounded-3xl border border-surface-white/10 shadow-2xl space-y-6 animate-fade-in-up relative">
        {/* Absolute Corner Back Link */}
        <Link
          href="/"
          className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs text-surface-white/50 hover:text-surface-white transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>

        {/* Centered Logo Anchor */}
        <div className="text-center space-y-3 pt-2">
          <Link href="/" className="inline-block group" title="Return to Landing Page">
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
          <h1 className="font-display text-2xl font-bold text-surface-white">Create Creator Account</h1>
          <p className="text-surface-white/60 text-xs leading-relaxed">
            Start collecting verified client testimonials with zero friction.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-surface-white/10 border border-surface-white/20 rounded-xl text-surface-white text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {registered ? (
          /* Explicit Post-Signup Instruction Screen */
          <div className="p-6 bg-surface-white/10 border border-surface-white/20 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-surface-white text-ink-900 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7 text-ink-900" />
            </div>
            <h2 className="font-display text-lg font-bold text-surface-white">Check Your Inbox</h2>
            <p className="text-xs text-surface-white/80 leading-relaxed">
              We sent a secure verification link to <span className="font-semibold text-surface-white">{email}</span>. Click it to activate your workspace.
            </p>

            {resendMessage && (
              <p className="text-xs font-mono text-emerald-400 p-2 bg-ink-900/60 rounded-xl border border-surface-white/10">
                {resendMessage}
              </p>
            )}

            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full py-2.5 bg-surface-white/10 hover:bg-surface-white/20 text-surface-white border border-surface-white/20 font-mono text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Resend Verification Email</span>
              </button>

              <Link
                href="/login"
                className="text-xs text-surface-white/70 hover:text-surface-white font-medium underline"
              >
                Already verified? Proceed to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-surface-white/70 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-surface-white/40 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-ink-900 border border-surface-white/20 rounded-xl text-sm text-surface-white focus:outline-none focus:border-surface-white placeholder:text-surface-white/30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-surface-white/70 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-surface-white/40 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-ink-900 border border-surface-white/20 rounded-xl text-sm text-surface-white focus:outline-none focus:border-surface-white placeholder:text-surface-white/30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-surface-white/70 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-surface-white/40 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-ink-900 border border-surface-white/20 rounded-xl text-sm text-surface-white focus:outline-none focus:border-surface-white placeholder:text-surface-white/30"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-surface-white/40 hover:text-surface-white transition"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator Meter */}
              {password && (
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-surface-white/70">
                    <span>Strength: {strengthLabels[Math.max(0, strengthScore - 1)] || "Weak"}</span>
                    <span>{password.length}/8+ chars</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`rounded-full transition-all duration-300 ${
                          level <= strengthScore
                            ? strengthScore <= 1
                              ? "bg-rose-500"
                              : strengthScore === 2
                              ? "bg-amber-400"
                              : strengthScore === 3
                              ? "bg-blue-400"
                              : "bg-emerald-400"
                            : "bg-surface-white/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-surface-white/60 leading-relaxed text-center pt-1">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-surface-white underline hover:text-surface-white/80">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-surface-white underline hover:text-surface-white/80">
                Privacy Policy
              </Link>.
            </p>

            <button
              type="submit"
              disabled={loading || password.length < 8}
              className="w-full py-3.5 bg-surface-white hover:bg-surface-light text-ink-900 font-display font-semibold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-ink-900" />
                  <span>Creating Workspace...</span>
                </>
              ) : (
                <>
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-surface-white/60 pt-2 border-t border-surface-white/10">
          Already have an account?{" "}
          <Link href="/login" className="text-surface-white font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
