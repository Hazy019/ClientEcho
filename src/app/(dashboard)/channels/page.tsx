"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, Send, Globe, Upload, CheckCircle2, Clock, ShieldCheck, Loader2, Save, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface SentMagicLinkLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  widgetName: string;
  sentAt: string;
  status: "pending" | "approved" | "expired";
}

export default function IngestionChannelsPage() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    async function loadChannelData() {
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
            setSentLinksLog(data.sentMagicLinks);
          }
        } else {
          showToast(data.error || "Failed to load channel configurations.", "error");
        }
      } catch (err) {
        showToast("Network error while loading channels data.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadChannelData();
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="border-b border-ink-900/10 pb-6">
        <h1 className="font-display text-3xl font-bold text-ink-900 flex items-center gap-3">
          <SlidersHorizontal className="w-7 h-7 text-ink-900" />
          <span>Ingestion Channels Configuration</span>
        </h1>
        <p className="text-ink-800/70 text-sm mt-1">
          Manage how social proof enters your workspace — intake method toggles, public form rules, and sent magic link request history.
        </p>
      </div>

      {loading ? (
        <div className="space-y-8">
          {/* Section 1 Skeleton: Active Intake Channel Toggles */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="w-5 h-5 rounded-lg" />
              <SkeletonBlock className="w-56 h-6 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-2xl border border-ink-900/10 space-y-4 bg-surface-light/40">
                  <div className="flex items-center justify-between">
                    <SkeletonBlock className="w-10 h-10 rounded-xl" />
                    <SkeletonBlock className="w-5 h-5 rounded" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonBlock className="w-32 h-4 rounded-md" />
                    <SkeletonBlock className="w-full h-3 rounded-md" />
                    <SkeletonBlock className="w-3/4 h-3 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 Skeleton: Public Submission Form Rules */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="w-5 h-5 rounded-lg" />
              <SkeletonBlock className="w-64 h-6 rounded-lg" />
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-ink-900/10 flex items-start gap-3">
                <SkeletonBlock className="w-4 h-4 rounded mt-0.5" />
                <div className="space-y-2 flex-1">
                  <SkeletonBlock className="w-48 h-4 rounded-md" />
                  <SkeletonBlock className="w-3/4 h-3 rounded-md" />
                </div>
              </div>

              <div className="space-y-2">
                <SkeletonBlock className="w-56 h-3 rounded-md" />
                <SkeletonBlock className="w-full h-20 rounded-xl" />
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <SkeletonBlock className="w-36 h-10 rounded-xl" />
            </div>
          </div>

          {/* Section 3 Skeleton: Sent Magic Link Requests History Log */}
          <div className="bg-surface-white rounded-3xl border border-ink-900/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-ink-900/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="w-5 h-5 rounded-lg" />
                <SkeletonBlock className="w-60 h-6 rounded-lg" />
              </div>
              <SkeletonBlock className="w-28 h-4 rounded-md" />
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-ink-900/5 last:border-0">
                  <div className="space-y-2">
                    <SkeletonBlock className="w-36 h-4 rounded-md" />
                    <SkeletonBlock className="w-48 h-3 rounded-md" />
                  </div>
                  <SkeletonBlock className="w-24 h-3 rounded-md" />
                  <SkeletonBlock className="w-32 h-3 rounded-md" />
                  <SkeletonBlock className="w-28 h-6 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveChannelSettings} className="space-y-8">
          {/* Section 1: Active Intake Channel Toggles */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
            <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-ink-900" />
              <span>Active Intake Channel Toggles</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Magic Link Channel */}
              <div className="p-5 rounded-2xl border border-ink-900/10 space-y-3 bg-surface-light/40">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-ink-900 text-surface-white rounded-xl flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <input
                    type="checkbox"
                    checked={magicLinksEnabled}
                    onChange={(e) => setMagicLinksEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-ink-900/30 text-ink-900 focus:ring-ink-900 cursor-pointer"
                  />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-ink-900">1-Click Magic Links</h3>
                  <p className="text-xs text-ink-800/70 leading-relaxed mt-1">
                    Send single-use cryptographic links for instant client 1-click approvals without login prompts.
                  </p>
                </div>
              </div>

              {/* Public Form Channel */}
              <div className="p-5 rounded-2xl border border-ink-900/10 space-y-3 bg-surface-light/40">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-ink-900 text-surface-white rounded-xl flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <input
                    type="checkbox"
                    checked={publicFormEnabled}
                    onChange={(e) => setPublicFormEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-ink-900/30 text-ink-900 focus:ring-ink-900 cursor-pointer"
                  />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-ink-900">Public Submission Form</h3>
                  <p className="text-xs text-ink-800/70 leading-relaxed mt-1">
                    Allow client visitors to submit testimonials directly via widget public submission buttons.
                  </p>
                </div>
              </div>

              {/* Offline Praise Import Channel */}
              <div className="p-5 rounded-2xl border border-ink-900/10 space-y-3 bg-surface-light/40">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-ink-900 text-surface-white rounded-xl flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <input
                    type="checkbox"
                    checked={manualImportEnabled}
                    onChange={(e) => setManualImportEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-ink-900/30 text-ink-900 focus:ring-ink-900 cursor-pointer"
                  />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-ink-900">Manual Offline Praise</h3>
                  <p className="text-xs text-ink-800/70 leading-relaxed mt-1">
                    Import offline feedback from Slack, DMs, or email with hardcoded trust verification badges.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Public Form Customization Rules */}
          <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
            <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-ink-900" />
              <span>Public Submission Form Rules</span>
            </h2>

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 rounded-2xl border border-ink-900/10 hover:bg-surface-light/50 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireRating}
                  onChange={(e) => setRequireRating(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-ink-900/30 text-ink-900 focus:ring-ink-900"
                />
                <div>
                  <div className="text-sm font-semibold text-ink-900">
                    Require 1–5 Star Rating Field
                  </div>
                  <div className="text-xs text-ink-800/70 leading-relaxed mt-0.5">
                    When enabled, clients must select a star rating before submitting feedback.
                  </div>
                </div>
              </label>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-2">
                  Public Form Introductory Prompt Text
                </label>
                <textarea
                  rows={2}
                  value={formIntroCopy}
                  onChange={(e) => setFormIntroCopy(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-sm focus:outline-none focus:border-ink-900"
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
              >
                Save Ingestion Rules
              </Button>
            </div>
          </div>

          {/* Section 3: Sent Magic Link Requests History Log */}
          <div className="bg-surface-white rounded-3xl border border-ink-900/10 shadow-sm overflow-hidden space-y-0">
            <div className="p-6 border-b border-ink-900/10 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-ink-900" />
                <span>Sent Magic Link Requests Log</span>
              </h2>
              <span className="text-xs font-mono text-ink-800/60 uppercase">
                {sentLinksLog.length} Requests Tracked
              </span>
            </div>

            {sentLinksLog.length === 0 ? (
              <div className="p-12 text-center text-xs text-ink-800/50 space-y-2">
                <Send className="w-6 h-6 text-ink-800/30 mx-auto" />
                <p className="font-medium text-ink-900">No magic link requests sent yet.</p>
                <p className="text-[11px] text-ink-800/60">
                  Send your first 1-click magic link approval request from the Approval Queue tab.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-surface-light text-ink-900 border-b border-ink-900/10">
                    <tr>
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Target Widget</th>
                      <th className="p-4">Sent Timestamp</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-900/10 text-ink-900 font-sans">
                    {sentLinksLog.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-light/50 transition">
                        <td className="p-4">
                          <div className="font-semibold text-ink-900 text-xs">{log.recipientName}</div>
                          <div className="text-[11px] font-mono text-ink-800/60">{log.recipientEmail}</div>
                        </td>
                        <td className="p-4 text-xs font-mono text-ink-800/80">{log.widgetName}</td>
                        <td className="p-4 text-xs font-mono text-ink-800/60">
                          {new Date(log.sentAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          {log.status === "approved" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>Claimed & Approved</span>
                            </span>
                          ) : log.status === "expired" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-800 border border-rose-500/30">
                              <AlertTriangle className="w-3 h-3 text-rose-700" />
                              <span>Token Expired</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>Pending Client Click</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
