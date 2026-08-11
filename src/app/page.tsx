import Link from "next/link";
import { MessageSquare, ShieldCheck, Zap, Send, Sparkles, Lock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl text-white">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 fill-white" />
          </div>
          <span>ClientEcho</span>
        </div>

        <div className="flex items-center gap-4 text-sm font-semibold">
          <Link href="/login" className="text-slate-300 hover:text-white transition">
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-600/30"
          >
            Go to Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 backdrop-blur-md">
          <ShieldCheck className="w-4 h-4" />
          <span>Postgres Row-Level Security Enforced</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Collect, Moderate & Embed Client Testimonials <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            With Zero Friction & Absolute Tenant Isolation
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          ClientEcho enables solo freelancers, developers, and small agencies to gather 1-click magic link approvals, import offline screenshots with hardcoded trust signals, and display lightweight sandboxed widgets.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/40 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Open Creator Dashboard</span>
          </Link>
          <Link
            href="/approve-testimonial?token=demo"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl border border-slate-800 transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4 text-indigo-400" />
            <span>Preview Magic Link Flow</span>
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
            <Send className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Magic Link Draft & Approve</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Generate 32-byte cryptographically random tokens stored as SHA-256 hashes. 1-click verification for clients without creating accounts.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Public Form & Rate Limiting</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Turnstile bot verification, Zod validation, DOMPurify HTML sanitization, and dual Upstash rate-limiting (per-IP and per-slug).
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Sandboxed Widget Embed</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Embed via single async script tag with <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">sandbox="allow-scripts allow-same-origin"</code> and origin-verified postMessage auto-resizing.
          </p>
        </div>
      </section>
    </div>
  );
}
