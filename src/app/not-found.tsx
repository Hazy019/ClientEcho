import Link from "next/link";
import Image from "next/image";
import { Compass, Home, LayoutDashboard, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-light text-ink-900 flex items-center justify-center p-6 font-sans">
      <div className="bg-surface-white max-w-md w-full p-8 rounded-3xl shadow-xl border border-ink-900/10 text-center space-y-6 animate-fade-in-up">
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

        {/* 404 Visual Icon */}
        <div className="w-16 h-16 bg-surface-light border border-ink-900/10 text-ink-900 rounded-full flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8 text-ink-900" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-ink-800/40 uppercase">
            Error 404
          </span>
          <h1 className="font-display text-2xl font-bold text-ink-900">
            Page Not Found
          </h1>
          <p className="text-ink-800/70 text-sm leading-relaxed max-w-sm mx-auto">
            The page or resource you're looking for doesn't exist, may have moved, or has an invalid URL.
          </p>
        </div>

        {/* Navigation CTAs */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Link
            href="/dashboard"
            className="w-full py-3 bg-ink-900 hover:bg-ink-800 text-surface-white text-sm font-semibold rounded-xl transition shadow-sm inline-flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>

          <Link
            href="/"
            className="w-full py-3 bg-surface-light hover:bg-ink-900/5 text-ink-900 border border-ink-900/10 text-sm font-semibold rounded-xl transition inline-flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
