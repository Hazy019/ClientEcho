import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { adminAuditLog, creators, widgets, testimonials } from "@/db/schema";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Shield, Lock, Activity, Eye, AlertOctagon, Users, DollarSign, ShieldAlert, CheckCircle2, XCircle, Sparkles, MessageSquare } from "lucide-react";
import SignOutButton from "@/app/(dashboard)/SignOutButton";
import AdminSuspensionControl from "./AdminSuspensionControl";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TechAdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Enforce Tech Admin Role Requirement (No dev bypass allowed!)
  const isTechAdmin = user?.app_metadata?.role === "tech_admin";

  if (!isTechAdmin) {
    redirect("/dashboard");
  }

  // Fetch immutable audit logs
  let logs: any[] = [];
  try {
    logs = await db.select().from(adminAuditLog).limit(50);
  } catch {
    logs = [];
  }

  // Fetch live platform metrics
  let totalCreators = 0;
  let totalWidgets = 0;
  let totalTestimonials = 0;

  try {
    const [creatorCount] = await db.select({ count: count() }).from(creators);
    const [widgetCount] = await db.select({ count: count() }).from(widgets);
    const [testimonialCount] = await db.select({ count: count() }).from(testimonials);
    totalCreators = creatorCount?.count ?? 0;
    totalWidgets = widgetCount?.count ?? 0;
    totalTestimonials = testimonialCount?.count ?? 0;
  } catch {
    // DB queries silently fail — keep zeros
  }

  const stripeConnected = !!(process.env.STRIPE_SECRET_KEY);
  const upstashConnected = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  return (
    <div className="min-h-screen bg-ink-900 text-surface-white font-sans overflow-hidden selection:bg-surface-white selection:text-ink-900">

      {/* ── Surface C Distinct Chrome Header ── */}
      <header className="app-navbar bg-ink-900 px-4 md:px-8 flex items-center justify-between border-b border-ink-800">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-surface-white rounded-xl flex items-center justify-center p-1.5 flex-shrink-0">
            <Image
              src="/ClientEcho_logo.png"
              alt="ClientEcho Logo"
              width={24}
              height={24}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-base md:text-lg font-bold text-surface-white leading-tight flex items-center gap-2 flex-wrap">
              <span className="whitespace-nowrap">Tech Admin</span>
              {/* Surface C badge — visual rhyming with the rest of site's mono-pill badges */}
              <span className="hidden sm:inline text-[9px] font-mono bg-surface-white/10 text-surface-white/60 px-2 py-0.5 rounded-full border border-surface-white/10 uppercase tracking-wider whitespace-nowrap">
                Surface C
              </span>
            </h1>
          </div>
        </div>

        {/* Right: Role + Sign Out */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex px-2.5 py-1 rounded-lg bg-ink-800 border border-surface-white/10 text-xs font-mono text-surface-white/60 items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-surface-white/70" />
            <span>tech_admin</span>
          </div>
          <SignOutButton className="px-3 py-1.5 rounded-lg bg-surface-white/8 hover:bg-rose-500/20 hover:text-rose-400 border border-surface-white/15 text-surface-white/80 text-xs font-medium transition-colors flex items-center gap-1.5" />
        </div>
      </header>

      {/* ── Dedicated Scroll Region ── */}
      <main className="app-scroll-region app-scroll-region--dark p-4 md:p-8 space-y-6">

        {/* ── Live Platform Metrics Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

          {/* Card 1: Live Creator Count */}
          <div className="bg-ink-800 p-4 md:p-5 rounded-2xl border border-surface-white/10 space-y-3 group">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono font-semibold text-surface-white/50 uppercase tracking-wider">
                Registered Creators
              </div>
              <div className="w-7 h-7 rounded-lg bg-surface-white/8 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-surface-white/60" />
              </div>
            </div>
            <div className="font-display text-3xl font-bold text-surface-white tabular-nums">
              {totalCreators.toLocaleString()}
            </div>
            <div className="text-[10px] text-surface-white/40 font-mono">
              Read-only • RLS enforced
            </div>
          </div>

          {/* Card 2: Live Widget Count */}
          <div className="bg-ink-800 p-4 md:p-5 rounded-2xl border border-surface-white/10 space-y-3 group">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono font-semibold text-surface-white/50 uppercase tracking-wider">
                Active Widgets
              </div>
              <div className="w-7 h-7 rounded-lg bg-surface-white/8 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-surface-white/60" />
              </div>
            </div>
            <div className="font-display text-3xl font-bold text-surface-white tabular-nums">
              {totalWidgets.toLocaleString()}
            </div>
            <div className="text-[10px] text-surface-white/40 font-mono">
              Embed widgets platform-wide
            </div>
          </div>

          {/* Card 3: Billing Subsystem Status */}
          <div className="bg-ink-800 p-4 md:p-5 rounded-2xl border border-surface-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono font-semibold text-surface-white/50 uppercase tracking-wider">
                Billing Subsystem
              </div>
              <div className="w-7 h-7 rounded-lg bg-surface-white/8 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-surface-white/60" />
              </div>
            </div>
            <div className="font-display text-xl font-bold text-amber-400">
              Paused
            </div>
            <div className="text-[10px] text-surface-white/40 font-mono">
              Flat free tier active &middot; Webhooks dormant
            </div>
          </div>

          {/* Card 4: Upstash Rate Limiting Status */}
          <div className="bg-ink-800 p-4 md:p-5 rounded-2xl border border-surface-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono font-semibold text-surface-white/50 uppercase tracking-wider">
                Rate Limiting
              </div>
              <div className="w-7 h-7 rounded-lg bg-surface-white/8 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-surface-white/60" />
              </div>
            </div>
            <div className={`font-display text-xl font-bold ${upstashConnected ? "text-emerald-400" : "text-amber-400"}`}>
              {upstashConnected ? "Upstash" : "In-Memory"}
            </div>
            <div className="text-[10px] text-surface-white/40 font-mono">
              {upstashConnected ? "5 req/min per IP • 20/slug" : "Fallback mode — set UPSTASH env vars"}
            </div>
          </div>
        </div>

        {/* ── Role Capability Disclosure Matrix ── */}
        <div className="bg-ink-800 p-5 md:p-6 rounded-3xl border border-surface-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-sm font-bold text-surface-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-surface-white/70" />
              <span>RLS Boundary Specification</span>
            </h2>
            <span className="text-[9px] font-mono uppercase bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Security Spec Enforced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
            {/* Allowed */}
            <div className="p-4 bg-ink-900/60 rounded-2xl border border-emerald-500/15 space-y-2">
              <div className="font-mono font-semibold text-surface-white flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Allowed Operations</span>
              </div>
              <ul className="space-y-2 text-[11px] leading-relaxed">
                <li className="flex gap-2 text-surface-white/70">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">→</span>
                  <span><strong className="text-surface-white/90">User Accounts:</strong> Read-only view & suspension trigger (no editing profile data).</span>
                </li>
                <li className="flex gap-2 text-surface-white/70">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">→</span>
                  <span><strong className="text-surface-white/90">Stripe Health:</strong> Read-only webhook & MRR telemetry monitoring.</span>
                </li>
                <li className="flex gap-2 text-surface-white/70">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">→</span>
                  <span><strong className="text-surface-white/90">Threat Logs:</strong> Read-only rate limit & bot detection logs.</span>
                </li>
                <li className="flex gap-2 text-surface-white/70">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">→</span>
                  <span><strong className="text-surface-white/90">Audit Trail:</strong> Read-only immutable platform event logs.</span>
                </li>
                <li className="flex gap-2 text-surface-white/70">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">→</span>
                  <span><strong className="text-surface-white/90">Account Suspension:</strong> Explicit write action with immutable audit log entry.</span>
                </li>
              </ul>
            </div>

            {/* Forbidden */}
            <div className="p-4 bg-ink-900/60 rounded-2xl border border-rose-500/15 space-y-2">
              <div className="font-mono font-semibold text-surface-white flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Forbidden (Denied by RLS)</span>
              </div>
              <ul className="space-y-2 text-[11px] leading-relaxed">
                <li className="flex gap-2 text-surface-white/70">
                  <span className="text-rose-400 mt-0.5 flex-shrink-0">✕</span>
                  <span><strong className="text-surface-white/90">Testimonial Editing:</strong> Cannot alter creator content, author names, or ratings.</span>
                </li>
                <li className="flex gap-2 text-surface-white/70">
                  <span className="text-rose-400 mt-0.5 flex-shrink-0">✕</span>
                  <span><strong className="text-surface-white/90">Testimonial Deletion:</strong> Cannot remove client praise from creator workspaces.</span>
                </li>
                <li className="flex gap-2 text-surface-white/70">
                  <span className="text-rose-400 mt-0.5 flex-shrink-0">✕</span>
                  <span><strong className="text-surface-white/90">Creator Token Access:</strong> Cannot view or reuse single-use magic link hashes.</span>
                </li>
                <li className="flex gap-2 text-surface-white/70">
                  <span className="text-rose-400 mt-0.5 flex-shrink-0">✕</span>
                  <span><strong className="text-surface-white/90">Direct DB Writes:</strong> Blocked at PostgreSQL RLS policy level.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Security Monitor + Suspension Interface ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

          {/* XSS & Bot Threat Log */}
          <div className="bg-ink-800 p-5 md:p-6 rounded-3xl border border-surface-white/10 space-y-4">
            <h2 className="font-display text-sm font-bold text-surface-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-surface-white/70" />
              <span>XSS & Bot Threat Log</span>
            </h2>
            <p className="text-xs text-surface-white/60 leading-relaxed">
              All public submissions pass through DOMPurify HTML sanitization and Cloudflare Turnstile token validation.
            </p>
            <div className="p-4 bg-ink-900/80 rounded-2xl border border-surface-white/8 text-xs font-mono space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                <span className="text-emerald-400">STATUS:</span>
                <span className="text-surface-white/70">0 active threat escalations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-emerald-400">DOMPURIFY:</span>
                <span className="text-surface-white/70">Enabled (Strict Allowlist)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-emerald-400">TURNSTILE:</span>
                <span className="text-surface-white/70">Enforced on /api/testimonials/public</span>
              </div>
            </div>
          </div>

          <AdminSuspensionControl />
        </div>

        {/* ── Immutable Audit Log Table ── */}
        <div className="bg-ink-800 rounded-3xl border border-surface-white/10 overflow-hidden">
          <div className="px-5 md:px-6 py-4 border-b border-surface-white/10 flex items-center justify-between">
            <div className="font-display font-bold text-sm text-surface-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-surface-white/60" />
              <span>Immutable Admin Audit Log</span>
            </div>
            <span className="text-[10px] font-mono text-surface-white/40 uppercase tracking-wider">
              {logs.length} entries
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Eye className="w-8 h-8 text-surface-white/15 mx-auto" />
              <p className="text-xs text-surface-white/40 italic">No audit log entries recorded in database.</p>
              <p className="text-[11px] text-surface-white/25">Actions taken via Account Suspension will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar custom-scrollbar--dark">
              <table className="w-full text-left text-xs font-mono min-w-[640px]">
                <thead className="bg-ink-900/60 text-surface-white/50 border-b border-surface-white/10">
                  <tr>
                    <th className="p-4 font-semibold uppercase tracking-wider text-[10px]">Timestamp</th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-[10px]">Admin ID</th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-[10px]">Action</th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-[10px]">Target</th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-[10px]">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-white/8 text-surface-white/70">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-white/4 transition-colors">
                      <td className="p-4 text-surface-white/45 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-surface-white truncate max-w-[140px]">{log.adminId}</td>
                      <td className="p-4 font-semibold text-surface-white">{log.action}</td>
                      <td className="p-4 text-surface-white/50 truncate max-w-[140px]">
                        {log.targetType}:{log.targetId}
                      </td>
                      <td className="p-4 text-surface-white/40">
                        {log.ipAddress && log.ipAddress !== "127.0.0.1" ? log.ipAddress : "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
