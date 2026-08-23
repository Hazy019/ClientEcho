"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Send,
  Upload,
  Star,
  Check,
  X,
  Trash2,
  Loader2,
  Filter,
  Edit2,
  ShieldCheck,
  Crown,
  Clock,
  Sparkles,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Zap,
  Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/ConfirmModal";
import UpgradeModal from "@/components/ui/UpgradeModal";
import CustomSelect from "@/components/ui/CustomSelect";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export const dynamic = "force-dynamic";

// 1-Click Starter Suggestions for Draft Testimonial Content
const DRAFT_STARTERS = [
  {
    id: "speed",
    label: "Speed & Reliability",
    icon: "⚡",
    text: "Working together was smooth and effortless. The communication was crystal clear throughout and the deliverables were completed ahead of schedule with zero friction.",
  },
  {
    id: "quality",
    label: "Design & Craft",
    icon: "🎨",
    text: "Transformed our rough concepts into a polished, high-performing design. The attention to detail, visual craftsmanship, and responsiveness were exceptional.",
  },
  {
    id: "impact",
    label: "Results & ROI",
    icon: "📈",
    text: "The work provided saved us weeks of trial and error and had an immediate positive impact on our project launch. Highly recommend their expertise!",
  },
];

// Warm, respectful invitation note templates for email & review page
const NOTE_TEMPLATES = [
  {
    id: "save_time",
    label: "Save Time (Respectful)",
    getText: (name: string) =>
      `Hi ${name.trim() || "[Client Name]"}, I'm updating my web portfolio and would love to feature our recent project. I know you are incredibly busy, so to save you time, I drafted a quick blurb based on the feedback you gave me during the launch. Please feel free to edit this, rewrite it completely, or just approve it if it looks good!`,
  },
  {
    id: "launch",
    label: "Project Launch",
    getText: (name: string) =>
      `Hi ${name.trim() || "[Client Name]"}, thank you for the wonderful collaboration on our recent launch! To showcase our work on my portfolio, I put together a quick draft review. Feel free to tweak any words or confirm with 1 click if you're happy with it!`,
  },
  {
    id: "direct",
    label: "Short & Direct",
    getText: (name: string) =>
      `Hi ${name.trim() || "[Client Name]"}, I drafted a short testimonial quote based on our project together. Please take a look, make any adjustments you like, or confirm approval!`,
  },
];

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

function formatTimestampDisplay(dateStr?: string | Date | null) {
  if (!dateStr) return { full: "Unknown", short: "Unknown", timeOnly: "", relative: "", isRecent: false };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { full: "Unknown", short: "Unknown", timeOnly: "", relative: "", isRecent: false };

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  let relative = "";
  if (diffSecs < 60) {
    relative = "Just now";
  } else if (diffMins < 60) {
    relative = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    relative = `${diffHours}h ago`;
  }

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const dateStrFormatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return {
    full: `${dateStrFormatted} at ${timeStr}`,
    short: `${dateStrFormatted} • ${timeStr}`,
    timeOnly: timeStr,
    relative,
    isRecent: diffMins < 15,
  };
}

export default function TestimonialsModerationPage() {
  const { showToast } = useToast();
  const { confirm } = useModal();
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
  const [selectedNoteTemplate, setSelectedNoteTemplate] = useState<string>("save_time");
  const [customNote, setCustomNote] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [activeDraftStarter, setActiveDraftStarter] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const effectivePrompt = useMemo(() => {
    if (isEditingNote && customNote.trim()) {
      return customNote;
    }
    const tpl = NOTE_TEMPLATES.find((t) => t.id === selectedNoteTemplate) || NOTE_TEMPLATES[0];
    return tpl.getText(magicName);
  }, [isEditingNote, customNote, selectedNoteTemplate, magicName]);

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
      const widgetsData = await widgetsRes.json().catch(() => ({ widgets: [] }));
      if (widgetsData.widgets) {
        setWidgetsList(widgetsData.widgets);
        if (widgetsData.widgets.length > 0) {
          setMagicWidgetId(widgetsData.widgets[0].id);
          setImportWidgetId(widgetsData.widgets[0].id);
        }
      }

      const testimonialsRes = await fetch("/api/testimonials");
      const testimonialsData = await testimonialsRes.json().catch(() => ({ testimonials: [] }));
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

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => (filter === "all" ? true : item.status === filter))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items, filter]);

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
          promptMessage: effectivePrompt,
        }),
      });

      const data = await res.json().catch(() => ({
        error: `Server responded with HTTP ${res.status}: ${res.statusText || "Unexpected error"}`,
      }));

      if (res.ok && data.success) {
        const linkToCopy = data.approvalUrl || data.devApprovalUrl;
        if (linkToCopy) {
          try {
            await navigator.clipboard.writeText(linkToCopy);
          } catch (_) {}
        }
        if (data.emailSent) {
          showToast(`Magic link invitation emailed to ${magicEmail}!`, "success");
        } else {
          showToast(
            `Magic link created & copied to clipboard! (Email note: ${data.emailError || "Dev sandbox mode"})`,
            "info"
          );
        }
        setShowMagicModal(false);
        setMagicEmail("");
        setMagicName("");
        setMagicContent("");
        setCustomNote("");
        setIsEditingNote(false);
        setActiveDraftStarter(null);
        fetchInitialData();
      } else {
        showToast(data.error || "Failed to send magic link.", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Network error while sending magic link.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendMagicLink = async (testimonialId: string) => {
    setResendingId(testimonialId);
    try {
      const res = await fetch("/api/testimonials/resend-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testimonialId }),
      });
      const data = await res.json().catch(() => ({
        error: `Server responded with HTTP ${res.status}: ${res.statusText || "Unexpected error"}`,
      }));
      if (res.ok && data.success) {
        const linkToCopy = data.approvalUrl || data.devApprovalUrl;
        if (linkToCopy) {
          try {
            await navigator.clipboard.writeText(linkToCopy);
          } catch (_) {}
        }
        if (data.emailSent) {
          showToast("Approval invitation re-sent to client's email!", "success");
        } else {
          showToast(
            `Magic link copied to clipboard! (Email note: ${data.emailError || "Sandbox mode"})`,
            "info"
          );
        }
      } else {
        showToast(data.error || "Failed to resend magic link.", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Network error while resending link.", "error");
    } finally {
      setResendingId(null);
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

      const data = await res.json().catch(() => ({
        error: `Server responded with HTTP ${res.status}: ${res.statusText || "Unexpected error"}`,
      }));
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
    } catch (err: any) {
      showToast(err?.message || "Network error while importing praise.", "error");
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
    // Step 1: Show beautiful glassmorphic confirm overlay
    const confirmed = await confirm({
      title: "Delete this testimonial?",
      description:
        "This testimonial will be permanently removed from your queue. You\'ll have 5 seconds to undo after confirming.",
      confirmLabel: "Delete",
      cancelLabel: "Keep it",
      variant: "danger",
    });
    if (!confirmed) return;

    // Step 2: Optimistically remove from UI immediately
    const deletedItem = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));

    // Step 3: 5-second undo window via a separate undo toast
    let undone = false;
    const undoToastId = `undo-delete-${id}`;

    // We trigger undo logic via a custom event so the UndoToast
    // can call back into our component
    const commitDelete = async () => {
      if (undone) return;
      try {
        const res = await fetch(`/api/testimonials?id=${id}`, { method: "DELETE" });
        if (!res.ok) {
          showToast("Failed to delete. Restoring testimonial.", "error");
          if (deletedItem) setItems((prev) => [deletedItem, ...prev]);
        }
      } catch {
        showToast("Network error. Restoring testimonial.", "error");
        if (deletedItem) setItems((prev) => [deletedItem, ...prev]);
      }
    };

    // Dispatch a custom event that ModalProvider's undo system will pick up
    const event = new CustomEvent("ce:undo-action", {
      detail: {
        id: undoToastId,
        message: "Testimonial deleted",
        onUndo: () => {
          undone = true;
          if (deletedItem) setItems((prev) => [deletedItem, ...prev]);
          showToast("Deletion undone! Testimonial restored.", "success");
        },
        onCommit: commitDelete,
      },
    });
    window.dispatchEvent(event);
  };

  const renderSourceBadge = (item: TestimonialItem) => {
    if (item.source === "magic_link") {
      if (item.status === "approved") {
        return (
          <a
            href={`/verify/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Public Verification Page"
            className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-600 text-surface-white hover:bg-emerald-700 transition cursor-pointer shadow-2xs"
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Verified & Approved</span>
          </a>
        );
      }
      if (item.status === "pending") {
        return (
          <span
            title="Awaiting client approval via email magic link"
            className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-900"
          >
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Awaiting Client Approval</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-800">
          <X className="w-3 h-3 text-rose-600" />
          <span>Magic Link Rejected</span>
        </span>
      );
    }
    if (item.source === "public_form") {
      if (item.status === "approved") {
        return (
          <a
            href={`/verify/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Public Verification Page"
            className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-ink-800 text-ink-900 hover:bg-surface-light transition cursor-pointer"
          >
            <ShieldCheck className="w-3 h-3 text-indigo-600" />
            <span>Verified Direct Submission</span>
          </a>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-900">
          <span>Direct Form Submission</span>
        </span>
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

        {/* Queue Count */}
        <div className="flex items-center gap-2 text-xs font-mono text-ink-800/60">
          <span>{filteredItems.length} {filter === "all" ? "total" : filter}</span>
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

              {/* Footer: Created Timestamp + Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs">
                {(() => {
                  const ts = formatTimestampDisplay(item.createdAt);
                  return (
                    <div
                      className="flex items-center gap-1.5 font-mono text-[11px]"
                      title={ts.full}
                    >
                      <Clock className="w-3.5 h-3.5 text-ink-800/50 shrink-0" />
                      <span className="text-ink-800/60">
                        {ts.short}
                      </span>
                      {ts.relative && (
                        <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                          ts.isRecent
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-surface-light text-ink-800/50"
                        }`}>
                          {ts.relative}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Action Controls */}
                {item.source === "magic_link" && item.status === "pending" ? (
                  <div className="flex items-center gap-2">
                    {/* Copy Link & Resend */}
                    <button
                      type="button"
                      onClick={() => handleResendMagicLink(item.id)}
                      disabled={resendingId === item.id}
                      title="Copy approval link to clipboard & re-send email invitation"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink-900 hover:bg-ink-800 text-surface-white font-semibold rounded-lg shadow-sm text-xs transition active:scale-[0.97] disabled:opacity-60"
                    >
                      {resendingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy Link & Resend</span>
                    </button>

                    {editingId !== item.id && (
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditContent(item.content);
                          setEditAuthorName(item.authorName);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-ink-800/70 hover:text-ink-900 transition px-2 py-1 hover:bg-surface-light rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Draft</span>
                      </button>
                    )}

                    {/* Manual publish fallback */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, "approved")}
                      disabled={actionLoadingId === item.id}
                      title="Publish immediately without waiting for client email confirmation (converts to creator self-reported)"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-ink-800/80 hover:text-ink-900 border border-ink-900/15 hover:bg-surface-light rounded-lg transition"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Publish Manually</span>
                    </button>

                    {/* Cancel magic link request */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Cancel magic link request"
                      className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 px-2 py-1 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                ) : (
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
                )}
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

                {/* Warm Email Note to Client (Framing Message) */}
                <div className="p-3.5 bg-surface-light/70 rounded-2xl border border-ink-900/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-ink-900" />
                      <span>Email Note to Client</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isEditingNote) {
                          setCustomNote(effectivePrompt);
                        }
                        setIsEditingNote(!isEditingNote);
                      }}
                      className="text-[11px] font-mono text-ink-800/80 hover:text-ink-900 underline cursor-pointer"
                    >
                      {isEditingNote ? "Reset to Template" : "Customize Note"}
                    </button>
                  </div>

                  {/* Template Selector Pills */}
                  {!isEditingNote && (
                    <div className="flex flex-wrap gap-1.5">
                      {NOTE_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setSelectedNoteTemplate(tpl.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer border ${
                            selectedNoteTemplate === tpl.id
                              ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                              : "bg-surface-white border-ink-900/10 text-ink-800/80 hover:bg-surface-light"
                          }`}
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Note Preview or Custom Input */}
                  {isEditingNote ? (
                    <textarea
                      rows={3}
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      placeholder="Type your custom email message to client..."
                      className="w-full px-3 py-2 border border-ink-900/20 rounded-xl text-xs font-mono bg-surface-white focus:outline-none focus:border-ink-900 leading-relaxed"
                    />
                  ) : (
                    <div className="p-2.5 bg-surface-white rounded-xl border border-ink-900/10 text-xs text-ink-800/80 italic leading-relaxed">
                      "{effectivePrompt}"
                    </div>
                  )}
                </div>

                {/* Draft Testimonial Content with 1-Click Starter Suggestions */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <label className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-ink-900" />
                      <span>Draft Testimonial Content</span>
                    </label>
                    <span className="text-[10px] font-mono text-ink-800/50">
                      Client can approve or edit
                    </span>
                  </div>

                  {/* 1-Click Starter Draft Suggestions */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-ink-800/60 uppercase tracking-wider">
                      1-Click Starter Suggestions:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      {DRAFT_STARTERS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setMagicContent(s.text);
                            setActiveDraftStarter(s.id);
                            showToast(`Applied "${s.label}" draft`, "info");
                          }}
                          className={`px-2 py-1.5 rounded-xl text-[11px] font-medium border text-left transition cursor-pointer flex items-center gap-1.5 ${
                            activeDraftStarter === s.id && magicContent === s.text
                              ? "bg-ink-900 text-surface-white border-ink-900 shadow-xs font-semibold"
                              : "bg-surface-light border-ink-900/10 text-ink-900 hover:bg-ink-900/5"
                          }`}
                        >
                          <span>{s.icon}</span>
                          <span className="truncate">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={magicContent}
                    onChange={(e) => {
                      setMagicContent(e.target.value);
                      setActiveDraftStarter(null);
                    }}
                    placeholder="Draft testimonial text for client review..."
                    className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-sm focus:outline-none focus:border-ink-900 bg-surface-white leading-relaxed"
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
    </div>
  );
}
