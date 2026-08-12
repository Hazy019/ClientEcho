import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { widgets, testimonials } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { CheckSquare, Sparkles, Send, Upload, Clock, CheckCircle2 } from "lucide-react";

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-ink-900 p-8 rounded-3xl text-surface-white shadow-md border border-ink-800">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold">Workspace Overview & Analytics</h1>
          <p className="text-surface-white/70 text-sm">
            Zero-friction client testimonial engine for freelancers & agencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/testimonials"
            className="inline-flex items-center gap-2 bg-surface-white text-ink-900 hover:bg-surface-light font-display font-semibold text-xs px-5 py-3 rounded-xl transition shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Open Approval Queue</span>
          </Link>
          <Link
            href="/widgets"
            className="inline-flex items-center gap-2 bg-ink-800 text-surface-white hover:bg-surface-white/10 font-display font-semibold text-xs px-5 py-3 rounded-xl border border-surface-white/20 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>New Widget</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface-white p-6 rounded-2xl border border-ink-900/10 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-semibold text-ink-800/60 uppercase tracking-wider">Active Widgets</div>
            <div className="font-display text-3xl font-bold text-ink-900 mt-2">{activeWidgetsCount}</div>
          </div>
          <div className="w-12 h-12 bg-ink-900 text-surface-white rounded-2xl flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface-white p-6 rounded-2xl border border-ink-900/10 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-semibold text-ink-800/60 uppercase tracking-wider">Approved Testimonials</div>
            <div className="font-display text-3xl font-bold text-ink-900 mt-2">{approvedTestimonialsCount}</div>
          </div>
          <div className="w-12 h-12 bg-ink-900 text-surface-white rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface-white p-6 rounded-2xl border border-ink-900/10 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-semibold text-ink-800/60 uppercase tracking-wider">Pending Moderation</div>
            <div className="font-display text-3xl font-bold text-ink-900 mt-2">{pendingTestimonialsCount}</div>
          </div>
          <div className="w-12 h-12 bg-surface-light border border-ink-800/20 text-ink-900 rounded-2xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-white p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-4">
          <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-ink-900" />
            <span>Magic Link Approval Pipeline</span>
          </h2>
          <p className="text-sm text-ink-800/80 leading-relaxed">
            Send a single-use cryptographically hashed link to your client. They can review, tweak, and approve the testimonial with 1-click.
          </p>
          <Link
            href="/testimonials"
            className="inline-block text-xs font-display font-bold text-ink-900 hover:underline pt-2"
          >
            Manage Approval Queue &rarr;
          </Link>
        </div>

        <div className="bg-surface-white p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-4">
          <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-ink-900" />
            <span>Manual Praise Import</span>
          </h2>
          <p className="text-sm text-ink-800/80 leading-relaxed">
            Import Slack messages, tweets, or email screenshots. Automatically tagged with the hardcoded trust badge: <code className="bg-surface-light text-ink-900 px-1.5 py-0.5 rounded text-xs font-mono border border-ink-800/20">[Self-Reported / Imported]</code>.
          </p>
          <Link
            href="/testimonials"
            className="inline-block text-xs font-display font-bold text-ink-900 hover:underline pt-2"
          >
            Import Testimonial &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

