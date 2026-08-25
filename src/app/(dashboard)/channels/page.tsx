"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  SlidersHorizontal,
  Send,
  Globe,
  Upload,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Loader2,
  Save,
  AlertTriangle,
  Search,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { Button } from "@/components/ui/Button";
import Tooltip from "@/components/ui/Tooltip";

export const dynamic = "force-dynamic";

interface SentMagicLinkLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  widgetName: string;
  sentAt: string;
  status: "pending" | "approved" | "expired";
  resendCount?: number;
}

export default function IngestionChannelsPage() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Channel toggles
  const [magicLinksEnabled, setMagicLinksEnabled] = useState(true);
  const [publicFormEnabled, setPublicFormEnabled] = useState(true);
  const [manualImportEnabled, setManualImportEnabled] = useState(true);

  // Public form settings
  const [requireRating, setRequireRating] = useState(true);
  const [formIntroCopy, setFormIntroCopy] = useState(
    "Share your experience working with us! Your feedback helps us improve and build social proof."
  );

  // Sent Magic Links History Log from DB
  const [sentLinksLog, setSentLinksLog] = useState<SentMagicLinkLog[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState<"all" | "pending" | "approved" | "expired">("all");

  // Track pending log IDs to trigger live notifications on approval
  const prevPendingIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  const loadChannelData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch("/api/channels");
      const data = await res.json();
      if (res.ok && data.settings) {
        const s = data.settings;
        setMagicLinksEnabled(s.magicLinksEnabled !== false);
        setPublicFormEnabled(s.publicFormEnabled !== false);
        setManualImportEnabled(s.manualImportEnabled !== false);
        setRequireRating(s.requireRating !== false);
        if (s.formIntroCopy) setFormIntroCopy(s.formIntroCopy);
        if (Array.isArray(data.sentMagicLinks)) {
          const freshLogs: SentMagicLinkLog[] = data.sentMagicLinks;

          // Detect live status transitions from 'pending' -> 'approved'
          if (!isInitialLoadRef.current) {
            freshLogs.forEach((freshLog) => {
              if (
                prevPendingIdsRef.current.has(freshLog.id) &&
                freshLog.status === "approved"
              ) {
                showToast(
                  `🎉 ${freshLog.recipientName} just confirmed & approved their testimonial!`,
                  "success"
                );
              }
            });
          }

          // Update tracked pending set
          const currentPending = new Set(
            freshLogs
              .filter((log) => log.status === "pending")
              .map((log) => log.id)
          );
          prevPendingIdsRef.current = currentPending;
          isInitialLoadRef.current = false;

          setSentLinksLog(freshLogs);
        }
      } else if (!silent) {
        showToast(data.error || "Failed to load channel configurations.", "error");
      }
    } catch (err) {
      if (!silent) {
        showToast("Network error while loading channels data.", "error");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadChannelData();

    // ─── Real-time Smart Background Polling & Visibility Revalidation ───
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadChannelData(true);
      }
    }, 8000);

    const onFocus = () => {
      loadChannelData(true);
    };

    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [showToast]);

  const handleSaveChannelSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          magicLinksEnabled,
          publicFormEnabled,
          manualImportEnabled,
          requireRating,
          formIntroCopy,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Ingestion channel configurations saved successfully!", "success");
      } else {
        showToast(data.error || "Failed to save channel configurations.", "error");
      }
    } catch (err) {
      showToast("Network error while saving channel settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Filtered Sent Magic Link Logs
  const filteredLogs = useMemo(() => {
    return sentLinksLog.filter((log) => {
      const matchesFilter = logStatusFilter === "all" ? true : log.status === logStatusFilter;
      const q = logSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.recipientName.toLowerCase().includes(q) ||
        log.recipientEmail.toLowerCase().includes(q) ||
        log.widgetName.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [sentLinksLog, logStatusFilter, logSearchQuery]);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="border-b border-ink-900/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-3 tracking-tight">
            <SlidersHorizontal className="w-7 h-7 text-ink-900" />
            <span>Ingestion Channels Configuration</span>
          </h1>
          <p className="text-ink-800/80 text-xs sm:text-sm mt-1 leading-relaxed">
            Manage how social proof enters your workspace — intake method toggles, public form rules, and sent magic link request history.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-white border border-ink-900/15 text-xs sm:text-[13px] font-mono font-bold text-ink-900 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Sync Active</span>
          </div>
          <Tooltip content="Refresh channel data & logs">
            <button
              type="button"
              onClick={() => loadChannelData(false)}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center p-2 rounded-xl bg-surface-white hover:bg-surface-light border border-ink-900/15 text-ink-900 transition shadow-xs cursor-pointer disabled:opacity-50"
              aria-label="Refresh channel data & logs"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-ink-900" : "text-ink-800/80"}`} />
            </button>
          </Tooltip>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8">
          {/* Section 1 Skeleton: Active Intake Channel Toggles */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="w-6 h-6 rounded-lg" />
              <SkeletonBlock className="w-64 h-7 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-2xl border border-ink-900/10 space-y-4 bg-surface-light/40">
                  <div className="flex items-center justify-between">
                    <SkeletonBlock className="w-12 h-12 rounded-xl" />
                    <SkeletonBlock className="w-6 h-6 rounded" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonBlock className="w-40 h-5 rounded-md" />
                    <SkeletonBlock className="w-full h-4 rounded-md" />
                    <SkeletonBlock className="w-3/4 h-4 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 Skeleton: Public Submission Form Rules */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="w-6 h-6 rounded-lg" />
              <SkeletonBlock className="w-64 h-7 rounded-lg" />
            </div>

            <div className="space-y-4">
              <SkeletonBlock className="w-full h-16 rounded-2xl" />
              <div className="space-y-2">
                <SkeletonBlock className="w-56 h-4 rounded-md" />
                <SkeletonBlock className="w-full h-20 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveChannelSettings} className="space-y-8">
          {/* Section 1: Active Intake Channel Toggles */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-[0_4px_20px_-4px_rgba(45,45,45,0.06),0_2px_6px_-2px_rgba(45,45,45,0.04)] space-y-6">
            <h2 className="font-display text-xl font-bold text-ink-900 flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-ink-900" />
              <span>Active Intake Channel Toggles</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Magic Link Channel */}
              <div className="p-6 rounded-2xl border border-ink-900/10 space-y-4 bg-surface-light/40 hover:bg-surface-light/70 transition">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-ink-900 text-surface-white rounded-2xl flex items-center justify-center shadow-xs">
                    <Send className="w-6 h-6" />
                  </div>
                  <input
                    type="checkbox"
                    checked={magicLinksEnabled}
                    onChange={(e) => setMagicLinksEnabled(e.target.checked)}
                    className="w-6 h-6 rounded-lg border-2 border-ink-900 text-ink-900 focus:ring-ink-900 cursor-pointer"
                  />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-ink-900">1-Click Magic Links</h3>
                  <p className="text-xs sm:text-sm text-ink-800/75 leading-relaxed mt-1">
                    Send single-use cryptographic links for instant client 1-click approvals without login prompts.
                  </p>
                </div>
              </div>

              {/* Public Form Channel */}
              <div className="p-6 rounded-2xl border border-ink-900/10 space-y-4 bg-surface-light/40 hover:bg-surface-light/70 transition">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-ink-900 text-surface-white rounded-2xl flex items-center justify-center shadow-xs">
                    <Globe className="w-6 h-6" />
                  </div>
                  <input
                    type="checkbox"
                    checked={publicFormEnabled}
                    onChange={(e) => setPublicFormEnabled(e.target.checked)}
                    className="w-6 h-6 rounded-lg border-2 border-ink-900 text-ink-900 focus:ring-ink-900 cursor-pointer"
                  />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-ink-900">Public Submission Form</h3>
                  <p className="text-xs sm:text-sm text-ink-800/75 leading-relaxed mt-1">
                    Allow client visitors to submit testimonials directly via widget public submission buttons.
                  </p>
                </div>
              </div>

              {/* Offline Praise Import Channel */}
              <div className="p-6 rounded-2xl border border-ink-900/10 space-y-4 bg-surface-light/40 hover:bg-surface-light/70 transition">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-ink-900 text-surface-white rounded-2xl flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <input
                    type="checkbox"
                    checked={manualImportEnabled}
                    onChange={(e) => setManualImportEnabled(e.target.checked)}
                    className="w-6 h-6 rounded-lg border-2 border-ink-900 text-ink-900 focus:ring-ink-900 cursor-pointer"
                  />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-ink-900">Manual Offline Praise</h3>
                  <p className="text-xs sm:text-sm text-ink-800/75 leading-relaxed mt-1">
                    Import offline feedback from Slack, DMs, or email with hardcoded trust verification badges.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Public Form Customization Rules */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-[0_4px_20px_-4px_rgba(45,45,45,0.06),0_2px_6px_-2px_rgba(45,45,45,0.04)] space-y-6">
            <h2 className="font-display text-xl font-bold text-ink-900 flex items-center gap-2.5">
              <Globe className="w-6 h-6 text-ink-900" />
              <span>Public Submission Form Rules</span>
            </h2>

            <div className="space-y-4">
              <label className="flex items-start gap-3.5 p-5 rounded-2xl border border-ink-900/10 hover:bg-surface-light/50 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireRating}
                  onChange={(e) => setRequireRating(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded-md border-2 border-ink-900 text-ink-900 focus:ring-ink-900 cursor-pointer"
                />
                <div>
                  <div className="text-sm sm:text-base font-bold text-ink-900">
                    Require 1–5 Star Rating Field
                  </div>
                  <div className="text-xs sm:text-sm text-ink-800/75 leading-relaxed mt-0.5">
                    When enabled, clients must select a star rating before submitting feedback.
                  </div>
                </div>
              </label>

              <div>
                <label className="block text-xs sm:text-[13px] font-mono font-bold uppercase tracking-wider text-ink-900 mb-2">
                  Public Form Introductory Prompt Text
                </label>
                <textarea
                  rows={3}
                  value={formIntroCopy}
                  onChange={(e) => setFormIntroCopy(e.target.value)}
                  className="w-full p-4 border-2 border-ink-900/20 rounded-2xl text-sm sm:text-base font-medium focus:outline-none focus:border-ink-900 transition"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button
                type="submit"
                loading={saving}
                loadingText="Saving Settings..."
                icon={<Save className="w-4 h-4" />}
                className="px-6 py-3 text-sm font-bold"
              >
                Save Ingestion Rules
              </Button>
            </div>
          </div>

          {/* Section 3: Sent Magic Link Requests History Log (Containerized & Scrollable) */}
          <div className="bg-surface-white rounded-3xl border border-ink-900/10 shadow-sm overflow-hidden space-y-0">
            <div className="p-4 sm:p-6 border-b border-ink-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
                  <h2 className="font-display text-base sm:text-lg font-bold text-ink-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-ink-900 shrink-0" />
                    <span>Sent Magic Link Requests Log</span>
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-light border border-ink-900/10 text-ink-800 shrink-0">
                    {filteredLogs.length} of {sentLinksLog.length} Tracked
                  </span>
                </div>
                <p className="text-xs text-ink-800/60 font-sans">
                  Scroll through recent invitation requests. Real-time updates sync automatically.
                </p>
              </div>

              {/* Search & Filter Controls */}
              {sentLinksLog.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 sm:w-52">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-800/40 pointer-events-none" />
                    <input
                      type="text"
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      placeholder="Search recipient or widget..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-light border border-ink-900/10 rounded-xl focus:outline-none focus:border-ink-900 focus:bg-surface-white transition"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-surface-light p-1 rounded-xl border border-ink-900/10 text-[11px] font-mono justify-between sm:justify-start overflow-x-auto no-scrollbar">
                    {(["all", "pending", "approved", "expired"] as const).map((filterVal) => (
                      <button
                        key={filterVal}
                        type="button"
                        onClick={() => setLogStatusFilter(filterVal)}
                        className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg font-semibold capitalize transition text-center ${
                          logStatusFilter === filterVal
                            ? "bg-ink-900 text-surface-white shadow-xs"
                            : "text-ink-800/70 hover:text-ink-900"
                        }`}
                      >
                        {filterVal}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {sentLinksLog.length === 0 ? (
              <div className="p-12 text-center text-xs text-ink-800/50 space-y-2">
                <Send className="w-6 h-6 text-ink-800/30 mx-auto" />
                <p className="font-medium text-ink-900">No magic link requests sent yet.</p>
                <p className="text-[11px] text-ink-800/60">
                  Send your first 1-click magic link approval request from the Approval Queue tab.
                </p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-800/50 space-y-1">
                <p className="font-semibold text-ink-900">No matching requests found.</p>
                <p className="text-[11px]">Try changing your search term or status filter.</p>
              </div>
            ) : (
              <div>
                {/* ── Responsive Header ── */}
                <div className="bg-surface-light text-ink-900 border-b border-ink-900/10 px-4 sm:px-6 py-3 flex items-center justify-between sm:grid sm:grid-cols-12 text-xs font-mono font-bold tracking-wider">
                  <div className="sm:col-span-4">Recipient</div>
                  <div className="hidden sm:block sm:col-span-3">Target Widget</div>
                  <div className="hidden sm:block sm:col-span-3">Sent Timestamp</div>
                  <div className="sm:col-span-2 text-right">Status</div>
                </div>

                {/* ── Scrollable Body Rows ── */}
                <div className="max-h-[340px] overflow-y-auto custom-scrollbar divide-y divide-ink-900/10">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="px-4 sm:px-6 py-3.5 flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center justify-between gap-2.5 sm:gap-2 hover:bg-surface-light/40 transition text-ink-900"
                    >
                      <div className="w-full sm:w-auto sm:col-span-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs font-sans text-ink-900">{log.recipientName}</span>
                          {log.resendCount !== undefined && log.resendCount > 0 && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-ink-900/10 text-ink-900 font-semibold"
                              title={`Resent ${log.resendCount} times`}
                            >
                              Resent {log.resendCount}x
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-ink-800/60 truncate">{log.recipientEmail}</div>
                      </div>
                      <div className="hidden sm:block sm:col-span-3 text-xs font-mono text-ink-800/80 truncate">
                        {log.widgetName}
                      </div>
                      <div className="hidden sm:block sm:col-span-3 text-xs font-mono text-ink-800/60">
                        {new Date(log.sentAt).toLocaleString()}
                      </div>
                      <div className="w-full sm:w-auto sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t border-ink-900/5 sm:border-0">
                        <span className="sm:hidden text-[10px] font-mono text-ink-800/50">
                          {new Date(log.sentAt).toLocaleDateString()}
                        </span>
                        {log.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Claimed & Approved</span>
                          </span>
                        ) : log.status === "expired" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-800 border border-rose-500/30 shrink-0">
                            <AlertTriangle className="w-3 h-3 text-rose-700" />
                            <span>Token Expired</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30 shrink-0">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Pending Client Click</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
