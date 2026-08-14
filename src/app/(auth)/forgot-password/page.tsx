"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.status === 429) {
        setErrorMessage(data.error || "Too many attempts. Please try again later.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setErrorMessage("Network error. Please check your connection.");
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
          <ArrowLeft className="w-3.5 h-3.5" />
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
          <h1 className="font-display text-2xl font-bold text-surface-white">Forgot Password?</h1>
          <p className="text-surface-white/60 text-xs leading-relaxed">
            Enter your account email and we'll send you a secure link to reset your password.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-surface-white/10 border border-surface-white/20 rounded-xl text-surface-white text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {submitted ? (
          <div className="p-6 bg-surface-white/10 border border-surface-white/20 rounded-2xl text-center space-y-3">
            <div className="w-10 h-10 bg-surface-white text-ink-900 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="font-display text-base font-bold text-surface-white">Check Your Email</h2>
            <p className="text-xs text-surface-white/80 leading-relaxed">
              If an account exists for <span className="font-semibold text-surface-white">{email}</span>, a secure reset link has been sent. Please check your inbox and spam folder.
            </p>
            <p className="text-[11px] text-surface-white/50 pt-2 font-mono">
              Link expires in 45 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-surface-white/70 uppercase tracking-wider mb-1">
                Account Email Address
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-surface-white hover:bg-surface-light text-ink-900 font-display font-semibold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-ink-900" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <span>Send Password Reset Link</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
