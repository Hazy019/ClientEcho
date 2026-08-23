"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawToken = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Simple Password Strength Calculation
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0..4
  };

  const strengthScore = calculateStrength(newPassword);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawToken) {
      setErrorMessage("Invalid reset token URL.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawToken, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setErrorMessage(data.error || "Failed to reset password.");
      }
    } catch {
      setErrorMessage("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center p-6 font-sans text-surface-white selection:bg-surface-white selection:text-ink-900">
      <div className="max-w-md w-full bg-ink-800 p-8 sm:p-10 rounded-3xl border border-surface-white/10 shadow-2xl space-y-6 animate-fade-in-up relative">
        {/* Absolute Corner Back Link */}
        <Link
          href="/login"
          className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs text-surface-white/50 hover:text-surface-white transition font-medium"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          <span>Sign In</span>
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
          <h1 className="font-display text-2xl font-bold text-surface-white">Set New Password</h1>
          <p className="text-surface-white/60 text-xs leading-relaxed">
            Choose a strong new password for your ClientEcho workspace.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-surface-white/10 border border-surface-white/20 rounded-xl text-surface-white text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 bg-surface-white/10 border border-surface-white/20 rounded-2xl text-center space-y-3">
            <div className="w-10 h-10 bg-surface-white text-ink-900 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="font-display text-base font-bold text-surface-white">Password Reset Complete</h2>
            <p className="text-xs text-surface-white/80 leading-relaxed">
              Your password has been updated. Redirecting to sign in page...
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs font-bold text-surface-white underline pt-2"
            >
              <span>Click here if not redirected automatically</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label
                htmlFor="reset-password-input"
                className="block text-xs font-mono font-semibold text-surface-white/70 uppercase tracking-wider mb-1"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-surface-white/40 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="reset-password-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  tabIndex={1}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-ink-900 border border-surface-white/20 rounded-xl text-sm text-surface-white focus:outline-none focus:border-surface-white focus:ring-1 focus:ring-surface-white placeholder:text-surface-white/30 transition"
                  required
                  minLength={8}
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

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-surface-white/70">
                    <span>Strength: {strengthLabels[Math.max(0, strengthScore - 1)] || "Weak"}</span>
                    <span>{newPassword.length}/8+ chars</span>
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

            <button
              type="submit"
              tabIndex={2}
              disabled={loading || newPassword.length < 8}
              className="w-full py-3.5 bg-surface-white hover:bg-surface-light text-ink-900 font-display font-semibold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-surface-white focus:ring-offset-2 focus:ring-offset-ink-900"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-ink-900" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink-900 flex items-center justify-center text-surface-white font-sans">
          <Loader2 className="w-6 h-6 animate-spin text-surface-white" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
