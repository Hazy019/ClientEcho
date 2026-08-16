"use client";

import { useState, useEffect } from "react";
import { Send, Upload, Star, Check, X, Trash2, Loader2, Filter, Edit2, ShieldCheck, Crown, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useToast } from "@/components/ui/Toast";
import UpgradeModal from "@/components/ui/UpgradeModal";
import CustomSelect from "@/components/ui/CustomSelect";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export const dynamic = "force-dynamic";

interface TestimonialItem {
  id: string;
  widgetId: string;
  authorName: string;
  authorTitle?: string | null;
  content: string;
  rating?: number | null;
  status: "pending" | "approved" | "rejected";
  source: "magic_link" | "public_form" | "manual_import";
  isImportedSelfReported: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TestimonialsModerationPage() {
  const { showToast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [widgetsList, setWidgetsList] = useState<Array<{ id: string; name: string }>>([]);
  const [filter, setFilter] = useState<"pending" | "all" | "approved" | "rejected">("pending");
  const [loadingItems, setLoadingItems] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editAuthorName, setEditAuthorName] = useState("");

  const [showMagicModal, setShowMagicModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Per-card idempotency: tracks which testimonial ID is currently being actioned
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Magic link form state
  const [magicWidgetId, setMagicWidgetId] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [magicName, setMagicName] = useState("");
  const [magicContent, setMagicContent] = useState("");
  const [magicPrompt, setMagicPrompt] = useState("");

  // Manual import form state
  const [importWidgetId, setImportWidgetId] = useState("");
  const [importName, setImportName] = useState("");
  const [importTitle, setImportTitle] = useState("");
  const [importContent, setImportContent] = useState("");
  const [importRating, setImportRating] = useState(5);

  const fetchInitialData = async () => {
    setLoadingItems(true);
    try {
      const widgetsRes = await fetch("/api/widgets");
      const widgetsData = await widgetsRes.json();
      if (widgetsData.widgets) {
        setWidgetsList(widgetsData.widgets);
        if (widgetsData.widgets.length > 0) {
          setMagicWidgetId(widgetsData.widgets[0].id);
          setImportWidgetId(widgetsData.widgets[0].id);
        }
      }

      const testimonialsRes = await fetch("/api/testimonials");
      const testimonialsData = await testimonialsRes.json();
      if (testimonialsData.testimonials) {
        setItems(testimonialsData.testimonials);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      showToast("Failed to load queue data.", "error");
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const filteredItems = items.filter((item) => (filter === "all" ? true : item.status === filter));

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicWidgetId) {
      showToast("Please create a widget first in the Widgets tab!", "info");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/testimonials/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetId: magicWidgetId,
          clientEmail: magicEmail,
          authorName: magicName,
          content: magicContent,
          promptMessage: magicPrompt,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.devApprovalUrl) {
          console.log("[DEV APPROVAL LINK]:", data.devApprovalUrl);
          showToast(`Magic link created! Dev URL: ${data.devApprovalUrl}`, "success");
        } else {
          showToast("Magic link request sent to client!", "success");
        }
        setShowMagicModal(false);
        setMagicEmail("");
        setMagicName("");
        setMagicContent("");
        fetchInitialData();
      } else {
        showToast(data.error || "Failed to send magic link.", "error");
      }
    } catch {
      showToast("Network error while sending magic link.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importWidgetId) {
      showToast("Please create a widget first in the Widgets tab!", "info");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/testimonials/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetId: importWidgetId,
          authorName: importName,
          authorTitle: importTitle,
          content: importContent,
          rating: importRating,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Offline praise successfully imported!", "success");
        setShowImportModal(false);
        setImportName("");
        setImportTitle("");
        setImportContent("");
        fetchInitialData();
      } else {
        showToast(data.error || "Import failed.", "error");
      }
    } catch {
      showToast("Network error while importing praise.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: "approved" | "rejected") => {
    if (actionLoadingId) return; // Prevent concurrent actions
    setActionLoadingId(id);
    try {
      const res = await fetch("/api/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setItems(items.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
        showToast(`Testimonial ${newStatus === "approved" ? "approved ✓" : "rejected"}.`, "success");
      } else {
        showToast("Failed to update status.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleInlineSave = async (id: string) => {
    try {
      const res = await fetch("/api/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "approved", content: editContent, authorName: editAuthorName }),
      });
      if (res.ok) {
        setItems(
          items.map((item) =>
            item.id === id ? { ...item, content: editContent, authorName: editAuthorName, status: "approved" } : item
          )
        );
        setEditingId(null);
        showToast("Changes saved and testimonial approved!", "success");
      } else {
        showToast("Failed to save changes.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    try {
      const res = await fetch(`/api/testimonials?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems(items.filter((item) => item.id !== id));
        showToast("Testimonial deleted from queue.", "info");
      } else {
        showToast("Failed to delete testimonial.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const renderSourceBadge = (item: TestimonialItem) => {
    if (item.source === "magic_link") {
      return (
        <a
          href={`/verify/${item.id}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open Public Verification Page"
          className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-ink-900 text-surface-white hover:bg-ink-800 transition cursor-pointer"
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Verified & Approved</span>
        </a>
      );
    }
    if (item.source === "public_form") {
      return (
        <a
          href={`/verify/${item.id}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open Public Verification Page"
          className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-ink-800 text-ink-900 hover:bg-surface-light transition cursor-pointer"
        >
          <span>Verified Direct Submission</span>
        </a>
      );
    }
    return (
      <a
        href={`/verify/${item.id}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Open Public Verification Page"
        className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-light border border-ink-800/20 text-ink-800 hover:bg-surface-light/80 transition cursor-pointer"
      >
        <span>Self-Reported / Imported</span>
      </a>
    );
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Top Header & Ingestion Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink-900/10 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Approval Queue</h1>
          <p className="text-ink-800/70 text-sm mt-1">
            Moderation tool for reviewing, approving, or tweaking client testimonials.
          </p>
        </div>

        <div id="channels" className="flex items-center gap-3">
          <button
            onClick={() => setShowMagicModal(true)}
            className="inline-flex items-center gap-2 bg-ink-900 hover:bg-ink-800 text-surface-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Send className="w-4 h-4" />
            <span>Request Magic Link</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 bg-surface-white hover:bg-surface-light text-ink-900 border border-ink-800 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Upload className="w-4 h-4" />
            <span>Import Praise</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Pro Bulk Actions Nudge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-white p-4 rounded-2xl border border-ink-900/10">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-ink-800/50 mr-1" />
          {(["pending", "all", "approved", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                filter === tab
                  ? "bg-ink-900 text-surface-white shadow-sm"
                  : "text-ink-800/70 hover:bg-surface-light"
              }`}
            >
              {tab === "pending" ? "Pending Queue" : tab}
            </button>
          ))}
        </div>

        {/* Pro Tier Bulk Approval Nudge */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-light text-ink-800/70 border border-ink-800/10 hover:border-ink-800 transition font-medium"
          >
            <Crown className="w-3.5 h-3.5 text-ink-900" />
            <span>Bulk Select & Approve</span>
            <span className="text-[10px] font-mono uppercase bg-ink-900 text-surface-white px-1.5 py-0.5 rounded">
              Pro
            </span>
          </button>
        </div>
      </div>

      {loadingItems ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-white p-6 rounded-3xl border border-ink-900/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="w-10 h-10 rounded-full" />
                  <div className="space-y-1">
                    <SkeletonBlock className="w-32 h-4 rounded-md" />
                    <SkeletonBlock className="w-24 h-3 rounded-md" />
                  </div>
                </div>
                <SkeletonBlock className="w-28 h-6 rounded-full" />
              </div>
              <SkeletonBlock className="w-full h-12 rounded-xl" />
              <div className="flex items-center justify-between pt-2 border-t border-ink-900/5">
                <SkeletonBlock className="w-24 h-4 rounded-md" />
                <div className="flex items-center gap-2">
                  <SkeletonBlock className="w-20 h-8 rounded-xl" />
                  <SkeletonBlock className="w-20 h-8 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-surface-white p-16 rounded-3xl border border-ink-900/10 text-center space-y-3">
          <p className="text-ink-800/60 text-sm italic">No items matching current view.</p>
          <p className="text-xs text-ink-800/40">
            Use "Request Magic Link" or "Import Praise" above to populate your moderation queue.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
                className="bg-surface-white p-6 rounded-2xl border border-ink-900/10 shadow-sm space-y-4 transition hover:border-ink-900/20"
              >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-900/5 pb-3">
                <div className="flex items-center gap-3">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editAuthorName}
                      onChange={(e) => setEditAuthorName(e.target.value)}
                      className="px-2 py-1 text-sm font-bold border border-ink-800 rounded"
                    />
                  ) : (
                    <div>
                      <h3 className="font-display font-bold text-ink-900 text-base">
                        {item.authorName}
                      </h3>
                      {item.authorTitle && (
                        <p className="text-xs text-ink-800/60">{item.authorTitle}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {renderSourceBadge(item)}

                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                      item.status === "approved"
                        ? "bg-ink-900 text-surface-white"
                        : item.status === "pending"
                        ? "border border-ink-800 text-ink-900"
                        : "bg-surface-light text-ink-800/60"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Rating */}
              {item.rating && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (item.rating || 0)
                          ? "fill-ink-900 text-ink-900"
                          : "text-ink-900/20"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Content Body (Inline Editable) */}
              {editingId === item.id ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-3 text-sm border border-ink-800 rounded-xl focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-xs text-ink-800/70 hover:bg-surface-light rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleInlineSave(item.id)}
                      className="px-3 py-1 text-xs font-semibold bg-ink-900 text-surface-white rounded"
                    >
                      Save & Approve
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-900 leading-relaxed bg-surface-light p-4 rounded-xl border border-ink-900/5 italic">
                  "{item.content}"
                </p>
              )}

              {/* Footer: Last Verified Timestamp + Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs">
                <div className="flex items-center gap-1 text-ink-800/50 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Last Verified:{" "}
                    {new Date(item.updatedAt || item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {editingId !== item.id && (
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditContent(item.content);
                        setEditAuthorName(item.authorName);
                      }}
                      className="inline-flex items-center gap-1 text-ink-800/70 hover:text-ink-900 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}

                  {item.status !== "approved" && (
                    <button
                      onClick={() => handleStatusChange(item.id, "approved")}
                      disabled={actionLoadingId === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink-900 hover:bg-ink-800 text-surface-white font-semibold rounded-lg shadow-sm transition active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      {actionLoadingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Approve</span>
                    </button>
                  )}

                  {item.status !== "rejected" && (
                    <button
                      onClick={() => handleStatusChange(item.id, "rejected")}
                      disabled={actionLoadingId === item.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-light hover:bg-ink-900/10 text-ink-900 border border-ink-900/20 font-medium rounded-lg transition active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      {actionLoadingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                      <span>Reject</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-ink-800/40 hover:text-ink-900 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    )}

      {/* Magic Link Modal */}
      <AnimatePresence>
        {showMagicModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop Fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setShowMagicModal(false)}
              className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-surface-white max-w-lg w-full p-6 sm:p-8 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-ink-900/10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div>
                <h2 className="font-display text-xl font-bold text-ink-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-ink-900" />
                  <span>Send Magic Link Request</span>
                </h2>
                <p className="text-xs text-ink-800/70 leading-relaxed mt-1">
                  Your client will see this draft and can approve it in one click or suggest a small edit — no account needed on their end.
                </p>
              </div>

              <form onSubmit={handleSendMagicLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                    Target Widget
                  </label>
                  <CustomSelect
                    options={widgetsList.map((w) => ({ value: w.id, label: w.name }))}
                    value={magicWidgetId}
                    onChange={(val) => setMagicWidgetId(val)}
                    placeholder="Select a widget..."
                    emptyGuidance="Create a widget first to send magic links"
                  />
                </div>

                {/* 2-Column Row on Desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                      Client Email
                    </label>
                    <input
                      type="email"
                      value={magicEmail}
                      onChange={(e) => setMagicEmail(e.target.value)}
                      placeholder="client@company.com"
                      className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-sm focus:outline-none focus:border-ink-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={magicName}
                      onChange={(e) => setMagicName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-sm focus:outline-none focus:border-ink-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                    Draft Testimonial Content
                  </label>
                  <textarea
                    rows={3}
                    value={magicContent}
                    onChange={(e) => setMagicContent(e.target.value)}
                    placeholder="Draft testimonial text for client review..."
                    className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-sm focus:outline-none focus:border-ink-900"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMagicModal(false)}
                    className="px-4 py-2.5 text-xs font-medium text-ink-800/70 hover:bg-surface-light rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs font-semibold text-surface-white bg-ink-900 hover:bg-ink-800 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{submitting ? "Sending Link..." : "Send Magic Link"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop Fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setShowImportModal(false)}
              className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-surface-white max-w-lg w-full p-6 sm:p-8 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-ink-900/10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div>
                <h2 className="font-display text-xl font-bold text-ink-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-ink-900" />
                  <span>Import Offline Praise</span>
                </h2>
                <p className="text-xs text-ink-800/70 leading-relaxed mt-1">
                  Import offline feedback from Slack, email, or DMs. Self-reported praise will be clearly tagged with a trust verification badge.
                </p>
              </div>

              <form onSubmit={handleManualImport} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                    Target Widget
                  </label>
                  <CustomSelect
                    options={widgetsList.map((w) => ({ value: w.id, label: w.name }))}
                    value={importWidgetId}
                    onChange={(val) => setImportWidgetId(val)}
                    placeholder="Select a widget..."
                    emptyGuidance="Create a widget first to import praise"
                  />
                </div>

                {/* 2-Column Row on Desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={importName}
                      onChange={(e) => setImportName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-sm focus:outline-none focus:border-ink-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                      Author Title
                    </label>
                    <input
                      type="text"
                      value={importTitle}
                      onChange={(e) => setImportTitle(e.target.value)}
                      placeholder="VP of Growth"
                      className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-sm focus:outline-none focus:border-ink-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1">
                    Content Body
                  </label>
                  <textarea
                    rows={3}
                    value={importContent}
                    onChange={(e) => setImportContent(e.target.value)}
                    placeholder="Copy Slack/Email praise here..."
                    className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-sm focus:outline-none focus:border-ink-900"
                    required
                  />
                </div>

                {/* Trust Badge Pill Aesthetic Callout */}
                <div className="p-3.5 rounded-2xl bg-surface-light border border-ink-900/10 text-xs text-ink-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-mono font-semibold text-ink-900">
                    <ShieldCheck className="w-4 h-4 text-ink-900" />
                    <span>Trust Verification Badge Applied</span>
                  </div>
                  <p className="text-[11px] text-ink-800/70 leading-relaxed">
                    Imported testimonials will carry the public trust pill badge:
                  </p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-white border border-ink-800/20 text-ink-800 font-mono text-[10px] font-semibold shadow-xs">
                      <span>Self-Reported / Imported</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2.5 text-xs font-medium text-ink-800/70 hover:bg-surface-light rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs font-semibold text-surface-white bg-ink-900 hover:bg-ink-800 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{submitting ? "Importing..." : "Import Praise"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upgrade to Pro Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Bulk Select & Approve Testimonials"
        featureName="Pro Batch Moderation"
        description="1-click batch approvals and bulk moderation are exclusive to Pro Workspaces. Upgrade to moderate 10+ testimonials instantly!"
      />
    </div>
  );
}
