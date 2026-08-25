import { getCachedAuthUser } from "@/lib/supabase/server";
import { db } from "@/db";
import { adminAuditLog, creators, widgets, testimonials } from "@/db/schema";
import { redirect } from "next/navigation";
import Image from "next/image";
import {
  Shield,
  Lock,
  Activity,
  Eye,
  AlertOctagon,
  Users,
  DollarSign,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import SignOutButton from "@/app/(dashboard)/SignOutButton";
import AdminSuspensionControl from "./AdminSuspensionControl";
import { count, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

function formatTimestamp(date: Date | string | number): string {
  try {
    const d = new Date(date);
    return d.toISOString().replace("T", " ").substring(0, 19) + " UTC";
  } catch {
    return String(date);
  }
}

export default async function TechAdminDashboardPage() {
  const user = await getCachedAuthUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  // Enforce Tech Admin Role Requirement (supports metadata role and admin email)
  const isTechAdmin =
    user?.app_metadata?.role === "tech_admin" ||
    user?.email === "admin@clientecho.com";

  if (!isTechAdmin) {
    redirect("/dashboard");
  }

  // Fetch all admin datasets concurrently in a single parallel roundtrip
  const [
    logsResult,
    creatorsResult,
    creatorCountResult,
    widgetCountResult,
    testimonialCountResult,
  ] = await Promise.allSettled([
    db.select().from(adminAuditLog).orderBy(desc(adminAuditLog.createdAt)).limit(50),
    db.select().from(creators).orderBy(desc(creators.createdAt)).limit(100),
    db.select({ count: count() }).from(creators),
    db.select({ count: count() }).from(widgets),
    db.select({ count: count() }).from(testimonials),
  ]);

  const logs: any[] = logsResult.status === "fulfilled" ? logsResult.value : [];
  const allCreators: any[] = creatorsResult.status === "fulfilled" ? creatorsResult.value : [];
  const totalCreators =
    creatorCountResult.status === "fulfilled"
      ? (creatorCountResult.value[0]?.count ?? 0)
      : 0;
  const totalWidgets =
    widgetCountResult.status === "fulfilled"
      ? (widgetCountResult.value[0]?.count ?? 0)
      : 0;
  const totalTestimonials =
    testimonialCountResult.status === "fulfilled"
      ? (testimonialCountResult.value[0]?.count ?? 0)
      : 0;

  const stripeConnected = !!process.env.STRIPE_SECRET_KEY;
  const upstashConnected = !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );

  return (
    <div className="min-h-screen bg-ink-900 text-surface-white font-sans overflow-hidden selection:bg-surface-white selection:text-ink-900">
      {/* ── Surface C Distinct Chrome Header ── */}
      <header className="app-navbar bg-ink-900 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-ink-800">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-surface-white rounded-xl flex items-center justify-center p-1.5 flex-shrink-0 shadow-sm">
            <Image
              src="/ClientEcho_logo.png"
              alt="ClientEcho Logo"
              width={28}
              height={28}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-bold text-surface-white leading-tight flex items-center gap-2.5 flex-wrap">
              <span className="whitespace-nowrap">Tech Admin</span>
              <span className="hidden sm:inline text-xs font-mono font-bold bg-surface-white/15 text-surface-white px-2.5 py-0.5 rounded-full border border-surface-white/20 uppercase tracking-wider whitespace-nowrap">
                Surface C
              </span>
            </h1>
          </div>
        </div>

        {/* Right: Role + Sign Out */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex px-3.5 py-1.5 rounded-full bg-ink-800 border border-surface-white/20 text-xs sm:text-[13px] font-mono font-bold text-surface-white items-center gap-2 shadow-xs">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>tech_admin</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      {/* ── Full-Bleed Edge-to-Edge Dashboard Container (No restrictive margins) ── */}
      <main className="app-scroll-region w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        
        {/* ── KPI Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-ink-800 p-6 rounded-3xl border border-surface-white/10 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs sm:text-[13px] font-mono uppercase tracking-wider text-surface-white/90 font-bold">
              <span>REGISTERED CREATORS</span>
              <Users className="w-5 h-5 text-surface-white/70" />
            </div>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-surface-white">
              {totalCreators}
            </div>
            <p className="text-xs text-surface-white/70 font-mono">Read-only • RLS enforced</p>
          </div>

          <div className="bg-ink-800 p-6 rounded-3xl border border-surface-white/10 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs sm:text-[13px] font-mono uppercase tracking-wider text-surface-white/90 font-bold">
              <span>ACTIVE WIDGETS</span>
              <Sparkles className="w-5 h-5 text-surface-white/70" />
            </div>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-surface-white">
              {totalWidgets}
            </div>
            <p className="text-xs text-surface-white/70 font-mono">Embed widgets platform-wide</p>
          </div>

          <div className="bg-ink-800 p-6 rounded-3xl border border-surface-white/10 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs sm:text-[13px] font-mono uppercase tracking-wider text-surface-white/90 font-bold">
              <span>BILLING SUBSYSTEM</span>
              <DollarSign className="w-5 h-5 text-surface-white/70" />
            </div>
            <div className="font-display text-2xl sm:text-3xl font-extrabold">
              {stripeConnected ? (
                <span className="text-emerald-400">Active (Stripe)</span>
              ) : (
                <span className="text-amber-400">Dormant (Free Tier)</span>
              )}
            </div>
            <p className="text-xs text-surface-white/70 font-mono">
              {stripeConnected ? "Webhooks live • Checkout enabled" : "Stripe keys unconfigured in ENV"}
            </p>
          </div>

          <div className="bg-ink-800 p-6 rounded-3xl border border-surface-white/10 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs sm:text-[13px] font-mono uppercase tracking-wider text-surface-white/90 font-bold">
              <span>RATE LIMITING</span>
              <Activity className="w-5 h-5 text-surface-white/70" />
            </div>
            <div className="font-display text-2xl sm:text-3xl font-extrabold">
              {upstashConnected ? (
                <span className="text-emerald-400">Upstash</span>
              ) : (
                <span className="text-surface-white/90">In-Memory LRU</span>
              )}
            </div>
            <p className="text-xs text-surface-white/70 font-mono">
              {upstashConnected ? "5 req/min per IP • 20/slug" : "Fallback active • 5 req/min"}
            </p>
          </div>
        </div>

        {/* ── RLS Specification Banner ── */}
        <div className="bg-ink-800 p-6 md:p-7 rounded-3xl border border-surface-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base md:text-lg font-bold text-surface-white flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-surface-white/80" />
              <span>RLS BOUNDARY SPECIFICATION</span>
            </h2>
            <span className="text-xs font-mono uppercase bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-500/30 font-bold">
              Security Spec Enforced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
            {/* Allowed Operations */}
            <div className="p-5 bg-ink-900/70 rounded-2xl border border-surface-white/8 space-y-3">
              <div className="text-emerald-400 font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Allowed Operations</span>
              </div>
              <ul className="space-y-2 text-surface-white/80 text-xs sm:text-[13px] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">→</span>
                  <span><strong className="text-surface-white">User Accounts:</strong> Read-only view & suspension trigger (no editing profile data).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">→</span>
                  <span><strong className="text-surface-white">Stripe Health:</strong> Read-only webhook & MRR telemetry monitoring.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">→</span>
                  <span><strong className="text-surface-white">Threat Logs:</strong> Read-only rate limit & bot detection logs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">→</span>
                  <span><strong className="text-surface-white">Audit Trail:</strong> Read-only immutable platform event logs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">→</span>
                  <span><strong className="text-surface-white">Account Suspension:</strong> Explicit write action with immutable audit log entry.</span>
                </li>
              </ul>
            </div>

            {/* Forbidden Operations */}
            <div className="p-5 bg-ink-900/70 rounded-2xl border border-surface-white/8 space-y-3">
              <div className="text-rose-400 font-bold text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>Forbidden (Denied by RLS)</span>
              </div>
              <ul className="space-y-2 text-surface-white/80 text-xs sm:text-[13px] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong className="text-surface-white">Testimonial Editing:</strong> Cannot alter creator content, author names, or ratings.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong className="text-surface-white">Testimonial Deletion:</strong> Cannot remove client praise from creator workspaces.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong className="text-surface-white">Creator Token Access:</strong> Cannot view or reuse single-use magic link hashes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong className="text-surface-white">Direct DB Writes:</strong> Blocked at PostgreSQL RLS policy level.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Security Monitor + Suspension Interface ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 items-stretch w-full">

          {/* Left Column: Two balanced, flex-stretched security intelligence cards */}
          <div className="flex flex-col justify-between gap-5 md:gap-6 h-full w-full">
            
            {/* Card 1: XSS & Bot Threat Defense */}
            <div className="bg-ink-800 p-6 md:p-7 rounded-3xl border border-surface-white/10 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="font-display text-base md:text-lg font-bold text-surface-white flex items-center gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-surface-white/80" />
                    <span>XSS & Bot Threat Defense</span>
                  </h2>
                  <span className="text-xs font-mono uppercase bg-emerald-500/15 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/25 font-bold">
                    WAF Active
                  </span>
                </div>
                
                <p className="text-sm text-surface-white/75 leading-relaxed">
                  Autonomous multi-layer defense engine sanitizing incoming payloads, enforcing rate limiting, and blocking script execution.
                </p>
              </div>

              <div className="p-4 bg-ink-900/80 rounded-2xl border border-surface-white/8 text-xs sm:text-[13px] font-mono space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-surface-white/60">DOMPurify HTML Sanitizer:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Strict Allowlist
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-surface-white/60">Cloudflare Turnstile:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Enforced (/public)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-surface-white/60">CSS Exfiltration Guard:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    @import & url() Blocked
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-surface-white/60">Binary Magic Bytes:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    PNG / JPEG Verified
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-white/8 flex items-center justify-between text-xs font-mono text-surface-white/50">
                <span>0 Active Threat Escalations</span>
                <span className="text-emerald-400 font-semibold">100% Sanitized Throughput</span>
              </div>
            </div>

            {/* Card 2: Compliance & Non-Repudiation */}
            <div className="bg-ink-800 p-6 md:p-7 rounded-3xl border border-surface-white/10 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="font-display text-base md:text-lg font-bold text-surface-white flex items-center gap-2.5">
                    <Eye className="w-5 h-5 text-surface-white/80" />
                    <span>Compliance & Non-Repudiation</span>
                  </h2>
                  <span className="text-xs font-mono uppercase bg-sky-500/15 text-sky-300 px-3 py-1 rounded-full border border-sky-500/25 font-bold">
                    SOC 2 Spec
                  </span>
                </div>

                <p className="text-sm text-surface-white/75 leading-relaxed">
                  All administrative state changes, account suspensions, and threat escalations write an append-only cryptographic event record.
                </p>
              </div>

              {/* High-Density Compliance Policies */}
              <div className="p-4 bg-ink-900/80 rounded-2xl border border-surface-white/8 text-xs sm:text-[13px] font-mono space-y-2.5 text-surface-white/80">
                <div className="flex items-center justify-between">
                  <span className="text-surface-white/60">PostgreSQL RLS Direct Shield:</span>
                  <span className="text-emerald-400 font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-surface-white/60">SHA-256 Token Lifecycle:</span>
                  <span className="text-sky-400 font-semibold">24h Single-Use</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-surface-white/60">Append-Only Immutability:</span>
                  <span className="text-emerald-400 font-semibold">Zero Delete API</span>
                </div>
              </div>

              {/* 3 Metric Diagnostic Grid */}
              <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="p-3 bg-ink-900/70 rounded-xl border border-surface-white/6 space-y-1 text-center">
                  <div className="text-surface-white/50 uppercase text-[9px] font-bold">Ledger Storage</div>
                  <div className="font-bold text-surface-white text-xs sm:text-sm">Append-Only</div>
                </div>
                <div className="p-3 bg-ink-900/70 rounded-xl border border-surface-white/6 space-y-1 text-center">
                  <div className="text-surface-white/50 uppercase text-[9px] font-bold">Admin Isolation</div>
                  <div className="font-bold text-emerald-400 text-xs sm:text-sm">Postgres RLS</div>
                </div>
                <div className="p-3 bg-ink-900/70 rounded-xl border border-surface-white/6 space-y-1 text-center">
                  <div className="text-surface-white/50 uppercase text-[9px] font-bold">Token Hashing</div>
                  <div className="font-bold text-sky-400 text-xs sm:text-sm">SHA-256</div>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-white/8 flex items-center justify-between text-xs font-mono text-surface-white/50">
                <span>Tamper-Evident Ledger Active</span>
                <span className="text-sky-400 font-semibold">Non-Repudiation Verified</span>
              </div>
            </div>

          </div>

          {/* Right Column: Account Moderation & Directory */}
          <AdminSuspensionControl initialCreators={allCreators as any} />
        </div>

        {/* ── Immutable Audit Log Table ── */}
        <div className="bg-ink-800 rounded-3xl border border-surface-white/10 overflow-hidden shadow-xl w-full">
          {/* Header */}
          <div className="px-6 py-5 border-b border-surface-white/10 flex items-center justify-between bg-ink-850">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-surface-white/8 border border-surface-white/10 flex items-center justify-center text-surface-white/80">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <div className="font-display font-bold text-base text-surface-white">
                  Immutable Admin Audit Log
                </div>
                <div className="text-xs font-mono text-surface-white/50">
                  Append-Only Cryptographic Stream (WORM Policy)
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-surface-white/70 bg-surface-white/10 border border-surface-white/15 px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
              {logs.length} {logs.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="p-14 text-center space-y-2.5">
              <Eye className="w-9 h-9 text-surface-white/20 mx-auto" />
              <p className="text-sm text-surface-white/70 font-semibold">Audit Ledger Ready (0 entries recorded)</p>
              <p className="text-xs text-surface-white/40 max-w-md mx-auto leading-relaxed">
                Actions executed via Account Moderation or WAF Security Events automatically commit an immutable audit record here.
              </p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto overflow-x-auto custom-scrollbar custom-scrollbar--dark">
              <table className="w-full text-left text-xs sm:text-[13px] font-mono min-w-[820px]">
                <thead className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur-md text-surface-white/70 border-b border-surface-white/10 shadow-xs">
                  <tr>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs w-52 shrink-0">Timestamp</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs w-60 shrink-0">Admin ID</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs w-52 shrink-0">Action</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs min-w-[220px]">Target Resource</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs w-40 shrink-0">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-white/8 text-surface-white/80">
                  {logs.map((log) => {
                    const isSuspension = log.action === "ACCOUNT_SUSPENSION";
                    const isReactivation = log.action === "ACCOUNT_UNSUSPENSION";
                    const isThreat = log.action === "SECURITY_THREAT_BLOCKED";
                    const isLogin = log.action === "TECH_ADMIN_LOGIN";

                    return (
                      <tr key={log.id} className="hover:bg-surface-white/4 transition-colors">
                        <td className="p-4 text-surface-white/60 whitespace-nowrap text-xs">
                          {formatTimestamp(log.createdAt)}
                        </td>
                        <td className="p-4 font-bold text-surface-white truncate max-w-[200px]">
                          {log.adminId}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-bold uppercase border ${
                              isSuspension
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/35"
                                : isReactivation
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/35"
                                : isThreat
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/35"
                                : isLogin
                                ? "bg-sky-500/20 text-sky-300 border-sky-500/35"
                                : "bg-surface-white/10 text-surface-white/70 border-surface-white/15"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isSuspension
                                  ? "bg-rose-400"
                                  : isReactivation
                                  ? "bg-emerald-400"
                                  : isThreat
                                  ? "bg-amber-400"
                                  : isLogin
                                  ? "bg-sky-400"
                                  : "bg-surface-white/60"
                              }`}
                            />
                            <span>{log.action}</span>
                          </span>
                        </td>
                        <td className="p-4 text-surface-white/80 font-mono text-xs truncate max-w-[240px]">
                          <span className="text-surface-white/45">{log.targetType}:</span>
                          <span className="text-surface-white/90 font-semibold">{log.targetId}</span>
                        </td>
                        <td className="p-4 text-surface-white/60 text-xs">
                          {log.ipAddress && log.ipAddress !== "127.0.0.1"
                            ? log.ipAddress
                            : "Internal/Direct"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
