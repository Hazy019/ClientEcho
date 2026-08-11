import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { adminAuditLog } from "@/db/schema";
import { redirect } from "next/navigation";
import { Shield, Lock, Activity, Eye, AlertOctagon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TechAdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Enforce Tech Admin Role Requirement
  const isTechAdmin = user?.app_metadata?.role === "tech_admin";

  if (!isTechAdmin && process.env.NODE_ENV !== "development") {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10 space-y-8">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>Tech Admin Dashboard</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-mono">
                READ-ONLY MODERATION
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              System monitoring & immutable audit logs. RLS strictly denies admin testimonial updates/deletions.
            </p>
          </div>
        </div>
      </div>

      {/* RLS Enforcement Warning Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-3">
        <AlertOctagon className="w-5 h-5 flex-shrink-0 text-amber-400" />
        <div>
          <strong>Database Security Constraint (Section 5):</strong> Tech Admin accounts are strictly forbidden from modifying or deleting creator testimonials at the database level. RLS policies reject all update/delete attempts.
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Rate Limits Monitored</span>
          </div>
          <div className="text-2xl font-bold text-white">Upstash Sliding Window</div>
        </div>

        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-400" />
            <span>Audit Log Entries</span>
          </div>
          <div className="text-2xl font-bold text-white">{logs.length}</div>
        </div>

        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Testimonial Mutability</span>
          </div>
          <div className="text-2xl font-bold text-rose-400">DENIED</div>
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 font-bold text-sm text-slate-200">
          Immutable Admin Audit Log
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 italic">
            No audit log entries recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Admin ID</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 text-indigo-400">{log.adminId}</td>
                    <td className="p-3 font-semibold text-white">{log.action}</td>
                    <td className="p-3 text-slate-400">
                      {log.targetType}:{log.targetId}
                    </td>
                    <td className="p-3 text-slate-500">{log.ipAddress || "127.0.0.1"}</td>
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
