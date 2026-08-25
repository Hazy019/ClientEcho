"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log client-side exception
    console.error("ClientEcho Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-ink-900 text-surface-white flex items-center justify-center p-6 font-sans selection:bg-surface-white selection:text-ink-900">
      <div className="bg-ink-800 max-w-lg w-full p-8 sm:p-10 rounded-3xl shadow-2xl border border-surface-white/10 text-center space-y-6 animate-fade-in-up">
        
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-10 h-10 bg-surface-white rounded-xl flex items-center justify-center p-1.5 shadow-md">
            <Image
              src="/ClientEcho_logo.png"
              alt="ClientEcho Logo"
              width={26}
              height={26}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-surface-white">
            ClientEcho
          </span>
        </div>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-surface-white">
            Something went wrong
          </h1>
          <p className="text-surface-white/60 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            An unexpected error occurred while rendering this view. Our telemetry service has logged the exception.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-2.5 bg-surface-white hover:bg-surface-white/90 text-ink-900 text-xs sm:text-sm font-semibold rounded-xl transition shadow-sm inline-flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-2.5 bg-ink-900 hover:bg-ink-950 text-surface-white/80 hover:text-surface-white border border-surface-white/10 text-xs sm:text-sm font-semibold rounded-xl transition inline-flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        </div>

        {/* Technical Diagnostics Accordion */}
        <div className="pt-4 border-t border-surface-white/10 text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-xs font-mono text-surface-white/50 hover:text-surface-white transition py-1 cursor-pointer"
          >
            <span>Diagnostics & Error Digest</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-2 p-3.5 bg-ink-950/80 rounded-xl border border-surface-white/10 font-mono text-[11px] text-surface-white/80 space-y-1.5 overflow-x-auto custom-scrollbar custom-scrollbar--dark">
              <p className="text-rose-300"><strong>Message:</strong> {error?.message || "Unknown client error"}</p>
              {error?.digest && <p className="text-surface-white/50"><strong>Digest:</strong> {error.digest}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
