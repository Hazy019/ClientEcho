"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Loader2 } from "lucide-react";

interface SignOutButtonProps {
  className?: string;
}

export default function SignOutButton({ className }: SignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      // 1. Call server endpoint to expire and purge httpOnly session cookies
      await fetch("/api/auth/signout", {
        method: "POST",
      }).catch(() => {});

      // 2. Clear client-side Supabase storage & tokens
      const supabase = createClient();
      await supabase.auth.signOut().catch(() => {});
    } catch {
      // Ignore errors — proceed to redirect
    } finally {
      // 3. Perform hard page load to /login to purge all in-memory React state
      window.location.href = "/login";
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={
        className ||
        "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ink-800 hover:bg-ink-700/90 active:bg-ink-950 border border-surface-white/20 hover:border-surface-white/40 text-surface-white font-sans text-xs sm:text-sm font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-surface-white/40"
      }
      title="Sign out of your account"
    >
      {isSigningOut ? (
        <Loader2 className="w-4 h-4 animate-spin text-surface-white/80" />
      ) : (
        <LogOut className="w-4 h-4 text-surface-white/90" />
      )}
      <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
    </button>
  );
}
