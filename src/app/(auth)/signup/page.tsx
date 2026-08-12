"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
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

    } catch (err: any) {
      if (err?.message?.includes("Failed to fetch") || !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
        setErrorMessage("Supabase is not configured in .env. Please set NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY to your Supabase project credentials.");
      } else {
        setErrorMessage(err?.message || "An unexpected error occurred during registration.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center p-6 font-sans text-surface-white selection:bg-surface-white selection:text-ink-900">
      <div className="max-w-md w-full bg-ink-800 p-8 sm:p-10 rounded-3xl border border-surface-white/10 shadow-2xl space-y-6 animate-fade-in-up">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block">
            <div className="w-12 h-12 bg-surface-white rounded-2xl flex items-center justify-center mx-auto p-2 shadow-sm transition-transform hover:scale-105">
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
            disabled={loading}
            className="w-full py-3.5 bg-surface-white hover:bg-surface-light text-ink-900 font-display font-semibold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-ink-900" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

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

