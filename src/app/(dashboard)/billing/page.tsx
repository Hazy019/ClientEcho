"use client";

import { useState, useEffect } from "react";
import { CreditCard, Crown, Check, ShieldCheck, ExternalLink, Zap, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import UpgradeModal from "@/components/ui/UpgradeModal";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { PRO_PLAN } from "@/lib/config/pricing";

export const dynamic = "force-dynamic";

export default function BillingPage() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"free" | "pro">("free");
  const [widgetCount, setWidgetCount] = useState(1);
  const [testimonialCount, setTestimonialCount] = useState(18);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    async function fetchBillingData() {
      setLoading(true);
      try {
        const res = await fetch("/api/widgets");
        const data = await res.json();
        if (data.widgets) {
          setWidgetCount(data.widgets.length);
        }
        if (data.creator) {
          setSubscriptionStatus(data.creator.subscriptionStatus || "free");
        }
      } catch (err) {
        console.error("Failed to load billing status:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBillingData();
  }, []);

  const isPro = ["pro", "active"].includes(subscriptionStatus);

  const handleManageStripePortal = async () => {
    showToast("Opening PCI-compliant Stripe Customer Portal...", "info");
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || "Failed to open Stripe Customer Portal.", "error");
      }
    } catch {
      showToast("Network error opening Customer Portal.", "error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      {/* Page Header */}
      <div className="border-b border-ink-900/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900 flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-ink-900" />
            <span>Billing & Workspace Plan</span>
          </h1>
          <p className="text-ink-800/70 text-sm mt-1">
            Manage your subscription plan, usage limits, and PCI-compliant Stripe customer portal.
          </p>
        </div>

        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide uppercase ${
          isPro
            ? "bg-ink-900 text-surface-white"
            : "bg-surface-white text-ink-900 border border-ink-900/20"
        }`}>
          {isPro ? <Crown className="w-4 h-4" /> : <Zap className="w-4 h-4 text-ink-900" />}
          <span>{isPro ? "Pro Workspace" : "Starter Free Plan"}</span>
        </span>
      </div>

      {loading ? (
        <div className="space-y-8">
          {/* Plan Usage & Capability Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Widget Limit Meter Skeleton */}
            <div className="bg-surface-white p-6 rounded-3xl border border-ink-900/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="w-32 h-3 rounded-md" />
                <SkeletonBlock className="w-20 h-3 rounded-md" />
              </div>
              <SkeletonBlock className="w-full h-3 rounded-full" />
              <SkeletonBlock className="w-full h-3 rounded-md" />
            </div>

            {/* Testimonials Limit Meter Skeleton */}
            <div className="bg-surface-white p-6 rounded-3xl border border-ink-900/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="w-36 h-3 rounded-md" />
                <SkeletonBlock className="w-20 h-3 rounded-md" />
              </div>
              <SkeletonBlock className="w-full h-3 rounded-full" />
              <SkeletonBlock className="w-full h-3 rounded-md" />
            </div>
          </div>

          {/* Current Active Plan Overview Skeleton */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-900/10 pb-6">
              <div className="space-y-2">
                <SkeletonBlock className="w-64 h-6 rounded-lg" />
                <SkeletonBlock className="w-80 h-3 rounded-md" />
              </div>
              <SkeletonBlock className="w-44 h-11 rounded-xl" />
            </div>

            {/* Plan Feature Checklist Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <SkeletonBlock className="w-5 h-5 rounded-lg flex-shrink-0" />
                  <SkeletonBlock className="w-48 h-4 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          <SkeletonBlock className="w-full h-12 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Plan Usage & Capability Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Widget Limit Meter */}
            <div className="bg-surface-white p-6 rounded-3xl border border-ink-900/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70">
                  Active Widget Limit
                </span>
                <span className="text-xs font-mono font-bold text-ink-900">
                  {widgetCount} of {isPro ? "Unlimited" : "1 Limit"}
                </span>
              </div>
              <div className="w-full bg-surface-light h-3 rounded-full overflow-hidden border border-ink-900/10">
                <div
                  className="bg-ink-900 h-full transition-all duration-300"
                  style={{ width: isPro ? "25%" : `${Math.min(100, (widgetCount / 1) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-ink-800/70 leading-relaxed">
                {isPro
                  ? "Pro workspaces can create and embed unlimited widgets across client sites."
                  : "Starter Free plan is limited to 1 active widget. Upgrade to Pro for unlimited scale."}
              </p>
            </div>

            {/* Testimonials Limit Meter */}
            <div className="bg-surface-white p-6 rounded-3xl border border-ink-900/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70">
                  Approved Testimonials
                </span>
                <span className="text-xs font-mono font-bold text-ink-900">
                  {testimonialCount} of {isPro ? "Unlimited" : "25 Limit"}
                </span>
              </div>
              <div className="w-full bg-surface-light h-3 rounded-full overflow-hidden border border-ink-900/10">
                <div
                  className="bg-ink-900 h-full transition-all duration-300"
                  style={{ width: isPro ? "20%" : `${Math.min(100, (testimonialCount / 25) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-ink-800/70 leading-relaxed">
                {isPro
                  ? "Pro workspaces enjoy unlimited testimonial moderation and magic link approvals."
                  : "Starter Free plan allows up to 25 approved testimonials."}
              </p>
            </div>
          </div>

          {/* Current Active Plan Overview */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-900/10 pb-6">
              <div>
                <h2 className="font-display text-xl font-bold text-ink-900">
                  {isPro ? `Pro Workspace Subscription (${PRO_PLAN.priceDisplay}/mo)` : "Starter Free Plan ($0/forever)"}
                </h2>
                <p className="text-xs text-ink-800/70 mt-1">
                  {isPro
                    ? "Billed monthly via Stripe. Cancel or update payment method anytime."
                    : "Ideal for testing magic link approvals and public submission forms."}
                </p>
              </div>

              {isPro ? (
                <button
                  onClick={handleManageStripePortal}
                  className="px-5 py-2.5 bg-ink-900 hover:bg-ink-800 text-surface-white text-xs font-semibold rounded-xl transition shadow-sm inline-flex items-center gap-2"
                >
                  <span>Manage Subscription</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-5 py-2.5 bg-ink-900 hover:bg-ink-800 text-surface-white text-xs font-semibold rounded-xl transition shadow-sm inline-flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  <span>Upgrade to Pro ({PRO_PLAN.priceDisplay}/mo)</span>
                </button>
              )}
            </div>

            {/* Plan Feature Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-ink-900 text-surface-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-ink-900 font-medium">1-Click Magic Link Approvals</span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-ink-900 text-surface-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-ink-900 font-medium">Postgres RLS Row-Level Data Isolation</span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-ink-900 text-surface-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-ink-900 font-medium">
                  {isPro ? "Unlimited Active Widgets" : "1 Active Widget Cap"}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-ink-900 text-surface-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-ink-900 font-medium">
                  {isPro ? "Remove ClientEcho Branding" : "ClientEcho Footer Branding Included"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-surface-light rounded-2xl border border-ink-900/10 text-xs font-mono text-ink-800/70 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-ink-900 flex-shrink-0" />
            <span>
              All payment transactions are handled securely via PCI-compliant Stripe Checkout and Customer Portal. ClientEcho never stores raw credit card details.
            </span>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade to Pro Workspace Plan"
        featureName="Unlimited Widgets & Pro Features"
        description="Unlock unlimited widgets, remove ClientEcho branding, custom Google Fonts, accent colors, and carousel presentation layouts for $19/month."
      />
    </div>
  );
}
