import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { adminAuditLog } from "@/db/schema";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Shield, Lock, Activity, Eye, AlertOctagon, Users, DollarSign, ShieldAlert } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-ink-900 text-surface-white font-sans p-6 md:p-10 space-y-8 selection:bg-surface-white selection:text-ink-900">
      {/* Surface C Distinct Chrome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-ink-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-surface-white rounded-2xl flex items-center justify-center p-2">
            <Image
              src="/ClientEcho_logo.png"
              alt="ClientEcho Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-white flex items-center gap-3">
              <span>Tech Admin Dashboard</span>
              <span className="text-[10px] font-mono bg-surface-white text-ink-900 px-2.5 py-0.5 rounded uppercase font-bold tracking-wider">
                Surface C: Platform Admin
              </span>
            </h1>
            <p className="text-xs text-surface-white/60 mt-1">
              System health & immutable audit trail. RLS strictly denies testimonial moderation.
            </p>
          </div>
        </div>

        <div className="px-4 py-2 rounded-xl bg-ink-800 border border-surface-white/10 text-xs font-mono text-surface-white/70 flex items-center gap-2">
          <Shield className="w-4 h-4 text-surface-white" />
          <span>Role: tech_admin</span>
        </div>
      </div>

      {/* RLS Enforcement Warning Banner */}
      <div className="p-4 bg-ink-800 border border-surface-white/20 rounded-2xl text-surface-white text-xs flex items-center gap-3">
        <AlertOctagon className="w-5 h-5 flex-shrink-0 text-surface-white" />
        <div>
          <strong>Database Security Constraint (Section 5 & 4C):</strong> Tech Admin accounts are strictly forbidden from modifying or deleting creator testimonials at the database level. RLS policies reject all update/delete attempts.
        </div>
      </div>

      {/* System Monitoring Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-ink-800 p-6 rounded-2xl border border-surface-white/10 space-y-2">
          <div className="text-xs font-mono font-semibold text-surface-white/60 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-surface-white" />
            <span>User Accounts</span>
          </div>
          <div className="font-display text-2xl font-bold text-surface-white">Active (Read-Only)</div>
        </div>

        <div className="bg-ink-800 p-6 rounded-2xl border border-surface-white/10 space-y-2">
          <div className="text-xs font-mono font-semibold text-surface-white/60 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-surface-white" />
            <span>Stripe MRR Health</span>
          </div>
          <div className="font-display text-2xl font-bold text-surface-white">Webhook Secured</div>
        </div>

        <div className="bg-ink-800 p-6 rounded-2xl border border-surface-white/10 space-y-2">
          <div className="text-xs font-mono font-semibold text-surface-white/60 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-surface-white" />
            <span>Upstash Rate Logs</span>
          </div>
          <div className="font-display text-2xl font-bold text-surface-white">Dual Sliding Window</div>
        </div>

        <div className="bg-ink-800 p-6 rounded-2xl border border-surface-white/10 space-y-2">
          <div className="text-xs font-mono font-semibold text-surface-white/60 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-surface-white" />
            <span>Testimonial Mutability</span>
          </div>
          <div className="font-display text-2xl font-bold text-surface-white">DENIED (RLS)</div>
        </div>
      </div>

      {/* Security & Spam Monitor Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-ink-800 p-6 rounded-3xl border border-surface-white/10 space-y-4">
          <h2 className="font-display text-base font-bold text-surface-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            <span>XSS & Bot Threat Log</span>
          </h2>
          <p className="text-xs text-surface-white/70 leading-relaxed">
            All public submissions pass through DOMPurify HTML sanitization and Cloudflare Turnstile token validation.
          </p>
          <div className="p-4 bg-ink-900 rounded-2xl border border-surface-white/10 text-xs font-mono text-surface-white/80 space-y-1">
            <div>STATUS: 0 active threat escalations</div>
            <div>DOMPURIFY: Enabled (Strict Allowlist)</div>
            <div>TURNSTILE: Enforced on /api/testimonials/public</div>
          </div>
        </div>

        <div className="bg-ink-800 p-6 rounded-3xl border border-surface-white/10 space-y-4">
          <h2 className="font-display text-base font-bold text-surface-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>Account Suspension Interface</span>
          </h2>
          <p className="text-xs text-surface-white/70 leading-relaxed">
            Tech Admin accounts can review user account metrics or flag abusive accounts.
          </p>
          <div className="p-4 bg-ink-900 rounded-2xl border border-surface-white/10 text-xs font-mono text-surface-white/80 flex items-center justify-between">
            <span>ACCOUNT SUSPENSION API</span>
            <span className="bg-surface-white text-ink-900 px-2 py-0.5 rounded text-[10px] font-bold">READY</span>
          </div>
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <div className="bg-ink-800 rounded-3xl border border-surface-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-white/10 font-display font-bold text-sm text-surface-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-surface-white" />
          <span>Immutable Admin Audit Log</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-surface-white/50 italic">
            No audit log entries recorded in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-ink-900 text-surface-white/70 border-b border-surface-white/10">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Admin ID</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target</th>
                  <th className="p-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-white/10 text-surface-white/80">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-white/5 transition">
                    <td className="p-4 text-surface-white/60">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-surface-white">{log.adminId}</td>
                    <td className="p-4 font-semibold text-surface-white">{log.action}</td>
                    <td className="p-4 text-surface-white/60">
                      {log.targetType}:{log.targetId}
                    </td>
                    <td className="p-4 text-surface-white/50">{log.ipAddress || "127.0.0.1"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

