import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { widgets, testimonials } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { MessageSquare, Sparkles, Plus, Send, Upload, ShieldCheck, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let activeWidgetsCount = 0;
  let approvedTestimonialsCount = 0;
  let pendingTestimonialsCount = 0;

  if (user) {
    try {
      const userWidgets = await db
        .select()
        .from(widgets)
        .where(eq(widgets.creatorId, user.id));

      activeWidgetsCount = userWidgets.length;

      const userApproved = await db
        .select()
        .from(testimonials)
        .where(and(eq(testimonials.creatorId, user.id), eq(testimonials.status, "approved")));

      approvedTestimonialsCount = userApproved.length;

      const userPending = await db
        .select()
        .from(testimonials)
        .where(and(eq(testimonials.creatorId, user.id), eq(testimonials.status, "pending")));

      pendingTestimonialsCount = userPending.length;
    } catch (err) {
      console.error("Dashboard overview query error:", err);
    }
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 md:p-8 rounded-2xl text-white shadow-lg">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome to ClientEcho</h1>
          <p className="text-indigo-200 text-sm mt-1">
            Zero-friction client testimonials for freelancers & small agencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/testimonials"
            className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow transition"
          >
            <Send className="w-4 h-4" />
            <span>Request Magic Link</span>
          </Link>
          <Link
            href="/widgets"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-4 py-2.5 rounded-lg border border-white/20 backdrop-blur-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Widget</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Widgets</div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{activeWidgetsCount}</div>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Testimonials</div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{approvedTestimonialsCount}</div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Moderation</div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{pendingTestimonialsCount}</div>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-600" />
            <span>Magic Link Flow (Draft & Approve)</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Send a single-use cryptographically hashed link to your client. They can review, tweak, and approve the testimonial with 1-click.
          </p>
          <Link
            href="/testimonials"
            className="inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Manage Testimonials &rarr;
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-600" />
            <span>Manual Offline Screenshot Import</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Import Slack messages, tweets, or email screenshots. Automatically tagged with the hardcoded trust badge: <code className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded text-xs border border-amber-200">[Self-Reported / Imported]</code>.
          </p>
          <Link
            href="/testimonials"
            className="inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Import Testimonial &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
