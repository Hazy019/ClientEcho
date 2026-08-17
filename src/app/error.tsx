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
    <div className="min-h-screen bg-surface-light text-ink-900 flex items-center justify-center p-6 font-sans">
      <div className="bg-surface-white max-w-lg w-full p-8 rounded-3xl shadow-xl border border-ink-900/10 text-center space-y-6 animate-fade-in-up">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 bg-ink-900 text-surface-white rounded-xl flex items-center justify-center p-1.5 shadow-sm">
            <Image
              src="/ClientEcho_logo.png"
              alt="ClientEcho Logo"
              width={28}
              height={28}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-ink-900">
            ClientEcho
          </span>
        </div>

        {/* Warning Icon Badge */}
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-ink-900">
            Something went wrong
          </h1>
          <p className="text-ink-800/70 text-sm leading-relaxed max-w-md mx-auto">
            An unexpected error occurred while rendering this page. Our telemetry has logged the issue.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 bg-ink-900 hover:bg-ink-800 text-surface-white text-sm font-semibold rounded-xl transition shadow-sm inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-surface-light hover:bg-ink-900/5 text-ink-900 border border-ink-900/10 text-sm font-semibold rounded-xl transition inline-flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        </div>

        {/* Technical Diagnostics Accordion */}
        <div className="pt-4 border-t border-ink-900/10 text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-xs font-mono text-ink-800/60 hover:text-ink-900 transition py-1"
          >
            <span>Diagnostics & Error Digest</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-2 p-3 bg-surface-light rounded-xl border border-ink-900/10 font-mono text-[11px] text-ink-800/80 space-y-1 overflow-x-auto">
              <p><strong>Message:</strong> {error?.message || "Unknown client error"}</p>
              {error?.digest && <p><strong>Digest:</strong> {error.digest}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
