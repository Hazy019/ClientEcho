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
    <div className="space-y-6 sm:space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-ink-900 p-6 sm:p-8 rounded-2xl text-surface-white shadow-lg border border-ink-800">
        <div className="space-y-1.5 max-w-xl">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-surface-white tracking-tight">
            Workspace Overview & Analytics
          </h1>
          <p className="text-surface-white/80 text-sm leading-relaxed">
            Zero-friction client testimonial engine for freelancers & agencies.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/testimonials"
            className="inline-flex items-center justify-center gap-2 bg-surface-white hover:bg-surface-light text-ink-900 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-sm active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            <Send className="w-4 h-4 text-ink-900" />
            <span>Open Approval Queue</span>
          </Link>
          <Link
            href="/widgets"
            className="inline-flex items-center justify-center gap-2 bg-surface-white/10 hover:bg-surface-white/20 text-surface-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl border border-surface-white/20 transition active:scale-[0.98] whitespace-nowrap backdrop-blur-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>New Widget</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-surface-white p-5 sm:p-6 rounded-2xl border border-ink-900/10 shadow-xs flex items-center justify-between transition hover:-translate-y-0.5 hover:shadow-sm">
          <div>
            <div className="text-xs font-mono font-bold text-ink-800/70 uppercase tracking-wider">
              Active Widgets
            </div>
            <div className="font-display text-3xl sm:text-4xl font-bold text-ink-900 mt-1">
              {activeWidgetsCount}
            </div>
          </div>
          <div className="w-11 h-11 bg-ink-900 text-surface-white rounded-xl flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-white p-5 sm:p-6 rounded-2xl border border-ink-900/10 shadow-xs flex items-center justify-between transition hover:-translate-y-0.5 hover:shadow-sm">
          <div>
            <div className="text-xs font-mono font-bold text-ink-800/70 uppercase tracking-wider">
              Approved Testimonials
            </div>
            <div className="font-display text-3xl sm:text-4xl font-bold text-ink-900 mt-1">
              {approvedTestimonialsCount}
            </div>
          </div>
          <div className="w-11 h-11 bg-ink-900 text-surface-white rounded-xl flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-white p-5 sm:p-6 rounded-2xl border border-ink-900/10 shadow-xs flex items-center justify-between transition hover:-translate-y-0.5 hover:shadow-sm">
          <div>
            <div className="text-xs font-mono font-bold text-ink-800/70 uppercase tracking-wider">
              Pending Moderation
            </div>
            <div className="font-display text-3xl sm:text-4xl font-bold text-ink-900 mt-1">
              {pendingTestimonialsCount}
            </div>
          </div>
          <div className="w-11 h-11 bg-amber-500/15 border border-amber-500/30 text-amber-900 rounded-xl flex items-center justify-center shadow-xs">
            <Clock className="w-5 h-5 text-amber-700" />
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        <div className="bg-surface-white p-6 sm:p-7 rounded-2xl border border-ink-900/10 shadow-xs space-y-3 transition hover:border-ink-900/25">
          <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-ink-900" />
            <span>Magic Link Approval Pipeline</span>
          </h2>
          <p className="text-xs sm:text-sm text-ink-800/80 leading-relaxed">
            Send a single-use cryptographically hashed link to your client. They can review, tweak, and approve the testimonial with 1-click.
          </p>
          <Link
            href="/testimonials"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-display font-bold text-ink-900 hover:text-ink-800 hover:underline pt-1 group"
          >
            <span>Manage Approval Queue</span>
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>

        <div className="bg-surface-white p-6 sm:p-7 rounded-2xl border border-ink-900/10 shadow-xs space-y-3 transition hover:border-ink-900/25">
          <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-ink-900" />
            <span>Manual Praise Import</span>
          </h2>
          <p className="text-xs sm:text-sm text-ink-800/80 leading-relaxed">
            Import Slack messages, tweets, or email screenshots. Automatically tagged with the hardcoded trust badge: <code className="bg-surface-light text-ink-900 px-1.5 py-0.5 rounded text-xs font-mono font-bold border border-ink-800/20">[Self-Reported / Imported]</code>.
          </p>
          <Link
            href="/testimonials"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-display font-bold text-ink-900 hover:text-ink-800 hover:underline pt-1 group"
          >
            <span>Import Testimonial</span>
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

