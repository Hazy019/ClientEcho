"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  RefreshCw,
  Search,
  ArrowUp,
  ArrowUpDown,
  Inbox,
  SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/ConfirmModal";
import UpgradeModal from "@/components/ui/UpgradeModal";
import CustomSelect from "@/components/ui/CustomSelect";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import Tooltip from "@/components/ui/Tooltip";

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
  authorEmail?: string | null;
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
  const [copyingMagicLinkId, setCopyingMagicLinkId] = useState<string | null>(null);
  const [copiedMagicLinkId, setCopiedMagicLinkId] = useState<string | null>(null);

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

  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevPendingIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  const fetchInitialData = async (silent = false) => {
    if (!silent) {
      if (isInitialLoadRef.current) {
        setLoadingItems(true);
      } else {
        setIsRefreshing(true);
      }
    }
    try {
      const [widgetsRes, testimonialsRes] = await Promise.all([
        fetch("/api/widgets"),
        fetch("/api/testimonials"),
      ]);

      const widgetsData = await widgetsRes.json().catch(() => ({ widgets: [] }));
      if (widgetsData.widgets) {
        setWidgetsList(widgetsData.widgets);
        if (widgetsData.widgets.length > 0) {
          setMagicWidgetId((prev) => prev || widgetsData.widgets[0].id);
          setImportWidgetId((prev) => prev || widgetsData.widgets[0].id);
        }
      }

      const testimonialsData = await testimonialsRes.json().catch(() => ({ testimonials: [] }));
      if (testimonialsData.testimonials && Array.isArray(testimonialsData.testimonials)) {
        const freshItems: TestimonialItem[] = testimonialsData.testimonials;

        // Detect live status transitions from 'pending' -> 'approved'
        if (!isInitialLoadRef.current) {
          freshItems.forEach((freshItem) => {
            if (
              prevPendingIdsRef.current.has(freshItem.id) &&
              freshItem.status === "approved"
            ) {
              showToast(
                `🎉 ${freshItem.authorName} just confirmed & published their testimonial!`,
                "success"
              );
            }
          });
        }

        // Update tracked pending set
        const currentPending = new Set(
          freshItems
            .filter((item) => item.status === "pending")
            .map((item) => item.id)
        );
        prevPendingIdsRef.current = currentPending;
        isInitialLoadRef.current = false;

        setItems(freshItems);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      if (!silent) {
        showToast("Failed to load queue data.", "error");
      }
    } finally {
      setLoadingItems(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialData();

    // Proactive background revalidation every 8s + immediate revalidation on window focus
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchInitialData(true);
      }
    }, 8000);

    const onFocus = () => {
      fetchInitialData(true);
    };

    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [showToast]);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "rating">("newest");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const counts = useMemo(() => {
    return {
      pending: items.filter((i) => i.status === "pending").length,
      approved: items.filter((i) => i.status === "approved").length,
      rejected: items.filter((i) => i.status === "rejected").length,
      all: items.length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesFilter = filter === "all" ? true : item.status === filter;
        if (!matchesFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.authorName?.toLowerCase().includes(q);
        const matchTitle = item.authorTitle?.toLowerCase().includes(q);
        const matchContent = item.content?.toLowerCase().includes(q);
        const matchEmail = item.authorEmail?.toLowerCase().includes(q);
        return Boolean(matchName || matchTitle || matchContent || matchEmail);
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "rating") {
          return (b.rating || 5) - (a.rating || 5);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [items, filter, searchQuery, sortBy]);

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

  const handleCopyMagicLink = async (testimonialId: string) => {
    setCopyingMagicLinkId(testimonialId);
    try {
      const res = await fetch("/api/testimonials/resend-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testimonialId, sendEmail: false }),
      });
      const data = await res.json().catch(() => ({
        error: `Server responded with HTTP ${res.status}: ${res.statusText || "Unexpected error"}`,
      }));
      if (res.ok && data.success && data.approvalUrl) {
        await navigator.clipboard.writeText(data.approvalUrl);
        setCopiedMagicLinkId(testimonialId);
        showToast("Magic approval link copied to clipboard!", "success");
        setTimeout(() => setCopiedMagicLinkId(null), 2500);
      } else {
        showToast(data.error || "Failed to generate approval link.", "error");
      }
    } catch {
      showToast("Network error while copying magic link.", "error");
    } finally {
      setCopyingMagicLinkId(null);
    }
  };

  const handleResendMagicLink = async (testimonialId: string) => {
    setResendingId(testimonialId);
    try {
      const res = await fetch("/api/testimonials/resend-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testimonialId, sendEmail: true }),
      });
      const data = await res.json().catch(() => ({
        error: `Server responded with HTTP ${res.status}: ${res.statusText || "Unexpected error"}`,
      }));
      if (res.ok && data.success) {
        if (data.emailSent) {
          showToast("Approval invitation re-sent to client's email!", "success");
        } else {
          showToast(
            `Email queued (note: ${data.emailError || "Sandbox mode"})`,
            "info"
          );
        }
      } else {
        showToast(data.error || "Failed to resend email.", "error");
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
          <Tooltip content="Open Public Verification Page">
            <a
              href={`/verify/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-600 text-surface-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified & Approved</span>
            </a>
          </Tooltip>
        );
      }
      if (item.status === "pending") {
        return (
          <Tooltip content="Awaiting client approval via 1-click email magic link">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Awaiting Client Approval</span>
            </span>
          </Tooltip>
        );
      }
      return (
        <Tooltip content="Magic link invitation was rejected or expired">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-800">
            <X className="w-3.5 h-3.5 text-rose-600" />
            <span>Magic Link Rejected</span>
          </span>
        </Tooltip>
      );
    }
    if (item.source === "public_form") {
      if (item.status === "approved") {
        return (
          <Tooltip content="Open Public Verification Page">
            <a
              href={`/verify/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full border border-ink-800 bg-surface-white text-ink-900 hover:bg-surface-light transition cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Verified Direct Submission</span>
            </a>
          </Tooltip>
        );
      }
      return (
        <Tooltip content="Submitted via public embed form">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-900">
            <span>Direct Form Submission</span>
          </span>
        </Tooltip>
      );
    }
    return (
      <Tooltip content="Creator imported from offline Slack, DM, or email praise">
        <a
          href={`/verify/${item.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full bg-surface-light border border-ink-800/20 text-ink-900 hover:bg-surface-white transition cursor-pointer shadow-xs"
        >
          <span>Self-Reported / Imported</span>
        </a>
      </Tooltip>
    );
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Top Header & Ingestion Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-ink-900/10 pb-6">
        <div>
          <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 flex-wrap">
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-ink-900 tracking-tight shrink-0">
              Approval Queue
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-white border border-ink-900/15 text-[11px] sm:text-xs font-mono font-semibold text-ink-900 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="whitespace-nowrap">Live Sync</span>
              </div>
              <Tooltip content="Refresh queue">
                <button
                  type="button"
                  onClick={() => fetchInitialData(false)}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-xl bg-surface-white hover:bg-surface-light border border-ink-900/15 text-ink-900 transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                  aria-label="Refresh queue"
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? "animate-spin text-ink-900" : "text-ink-800/80"}`} />
                </button>
              </Tooltip>
            </div>
          </div>
          <p className="text-ink-800/80 text-xs sm:text-sm md:text-base mt-1.5 leading-relaxed">
            Moderation tool for reviewing, approving, or tweaking client testimonials in real time.
          </p>
        </div>

        <div id="channels" className="flex items-center gap-2.5 sm:gap-3 flex-wrap w-full md:w-auto">
          <button
            onClick={() => setShowMagicModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-ink-900 hover:bg-ink-800 text-surface-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-sm transition active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            <Send className="w-4 h-4 shrink-0" />
            <span>Request Magic Link</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-surface-white hover:bg-surface-light text-ink-900 border-2 border-ink-900 text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-sm transition active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span>Import Praise</span>
          </button>
        </div>
      </div>

      {/* Dedicated Queue Command Center Box */}
      <div className="bg-surface-white rounded-3xl border border-ink-900/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col transition-all">
        {/* Integrated Command Center Toolbar */}
        <div className="p-4 sm:p-5 border-b border-ink-900/10 bg-surface-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
          {/* Filter Tabs with Live Item Counts */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {(["pending", "all", "approved", "rejected"] as const).map((tab) => {
              const count = counts[tab];
              const isActive = filter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? "bg-ink-900 text-surface-white shadow-xs"
                      : "text-ink-800/75 hover:text-ink-900 hover:bg-surface-light"
                  }`}
                >
                  <span className="capitalize">{tab === "pending" ? "Pending Queue" : tab}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold transition ${
                      isActive
                        ? "bg-surface-white/20 text-surface-white"
                        : "bg-surface-light text-ink-800/70"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-ink-800/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search client, role, quote..."
                className="w-full pl-9 pr-8 py-2 bg-surface-light/60 hover:bg-surface-light focus:bg-surface-white border border-ink-900/10 focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10 rounded-xl text-xs sm:text-sm transition outline-none placeholder:text-ink-800/40 font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-800/40 hover:text-ink-900 p-0.5 transition cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Custom Animated Sort Dropdown */}
            <div ref={sortDropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-light/60 hover:bg-surface-light active:bg-surface-white border border-ink-900/10 focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10 rounded-xl text-xs sm:text-sm font-semibold text-ink-900 transition cursor-pointer shadow-xs whitespace-nowrap"
                aria-haspopup="listbox"
                aria-expanded={isSortDropdownOpen}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-ink-800/60" />
                <span>
                  {sortBy === "newest"
                    ? "Newest First"
                    : sortBy === "oldest"
                    ? "Oldest First"
                    : "Highest Rating"}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-ink-800/60 transition-transform duration-200 ${
                    isSortDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isSortDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-48 bg-surface-white rounded-2xl border border-ink-900/12 shadow-[0_12px_36px_rgba(0,0,0,0.12)] p-1.5 z-50 overflow-hidden"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-800/50 font-bold">
                      Sort Queue By
                    </div>
                    {[
                      { id: "newest", label: "Newest First" },
                      { id: "oldest", label: "Oldest First" },
                      { id: "rating", label: "Highest Rating" },
                    ].map((opt) => {
                      const isSelected = sortBy === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.id as any);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-xs sm:text-sm text-left rounded-xl flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? "bg-surface-light font-bold text-ink-900"
                              : "text-ink-800 hover:bg-surface-light/70 hover:text-ink-900"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-ink-900" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Scrollable Queue Feed Container */}
        <div
          ref={scrollContainerRef}
          className="max-h-[calc(100vh-320px)] min-h-[460px] overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4 bg-surface-light/35 flex-1 relative"
        >
          {loadingItems ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-white p-6 sm:p-8 rounded-2xl border border-ink-900/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <SkeletonBlock className="w-12 h-12 rounded-full" />
                      <div className="space-y-1.5">
                        <SkeletonBlock className="w-36 h-5 rounded-md" />
                        <SkeletonBlock className="w-28 h-4 rounded-md" />
                      </div>
                    </div>
                    <SkeletonBlock className="w-32 h-7 rounded-full" />
                  </div>
                  <SkeletonBlock className="w-full h-16 rounded-xl" />
                  <div className="flex items-center justify-between pt-2 border-t border-ink-900/5">
                    <SkeletonBlock className="w-28 h-4 rounded-md" />
                    <div className="flex items-center gap-2">
                      <SkeletonBlock className="w-24 h-9 rounded-xl" />
                      <SkeletonBlock className="w-24 h-9 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-surface-white p-12 sm:p-16 rounded-2xl border border-ink-900/10 text-center space-y-3 shadow-xs my-auto">
              <div className="w-12 h-12 rounded-2xl bg-surface-light text-ink-800/60 flex items-center justify-center mx-auto mb-2">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-ink-900 text-base font-bold">
                {searchQuery ? "No testimonials matching your search." : "No items matching current view."}
              </p>
              <p className="text-xs sm:text-sm text-ink-800/60 max-w-sm mx-auto leading-relaxed">
                {searchQuery
                  ? `Try clearing your search query "${searchQuery}" or switching filter tabs.`
                  : 'Use "Request Magic Link" or "Import Praise" to send invitations and populate your queue.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 bg-ink-900 text-surface-white rounded-xl text-xs font-semibold shadow-xs hover:bg-ink-800 transition cursor-pointer"
                >
                  Clear Search
                </button>
              )}
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
                    className="bg-surface-white p-6 sm:p-7 rounded-2xl border border-ink-900/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-ink-900/20 space-y-4 transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-900/5 pb-4">
                      <div className="flex items-center gap-3">
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editAuthorName}
                            onChange={(e) => setEditAuthorName(e.target.value)}
                            className="px-3 py-1.5 text-base font-bold border-2 border-ink-900 rounded-xl"
                          />
                        ) : (
                          <div>
                            <h3 className="font-display font-bold text-ink-900 text-lg sm:text-xl tracking-tight">
                              {item.authorName}
                            </h3>
                            {item.authorTitle && (
                              <p className="text-xs sm:text-sm text-ink-800/70 font-medium">{item.authorTitle}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {renderSourceBadge(item)}

                        <span
                          className={`text-xs font-mono uppercase px-3 py-1 rounded-full font-bold ${
                            item.status === "approved"
                              ? "bg-ink-900 text-surface-white"
                              : item.status === "pending"
                              ? "border-2 border-ink-900 text-ink-900"
                              : "bg-surface-light text-ink-800/70"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Rating */}
                    {item.rating && (
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (item.rating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-ink-900/15"
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Content Body (Inline Editable) */}
                    {editingId === item.id ? (
                      <div className="space-y-3">
                        <textarea
                          rows={4}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-4 text-base border-2 border-ink-900 rounded-2xl focus:outline-none"
                        />
                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 text-sm font-semibold text-ink-800/80 hover:bg-surface-light rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleInlineSave(item.id)}
                            className="px-4 py-2 text-sm font-bold bg-ink-900 text-surface-white rounded-xl shadow-xs cursor-pointer"
                          >
                            Save & Approve
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base text-ink-900/90 font-medium leading-relaxed bg-surface-light/60 p-4 sm:p-5 rounded-2xl border border-ink-900/5 italic">
                        "{item.content}"
                      </p>
                    )}

                    {/* Footer: Created Timestamp + Action Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-ink-900/5">
                      {(() => {
                        const ts = formatTimestampDisplay(item.createdAt);
                        return (
                          <div
                            className="flex items-center gap-2 font-mono text-xs sm:text-[13px]"
                            title={ts.full}
                          >
                            <Clock className="w-4 h-4 text-ink-800/60 shrink-0" />
                            <span className="text-ink-800/75">
                              {ts.short}
                            </span>
                            {ts.relative && (
                              <span className={`px-2 py-0.5 rounded-full font-bold ${
                                ts.isRecent
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-surface-light text-ink-800/60"
                              }`}>
                                {ts.relative}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Action Controls */}
                      {item.source === "magic_link" && item.status === "pending" ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Dedicated Copy Magic Link Button */}
                          <Tooltip content="Copy 1-click client approval URL to clipboard">
                            <button
                              type="button"
                              onClick={() => handleCopyMagicLink(item.id)}
                              disabled={copyingMagicLinkId === item.id}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-ink-900 hover:bg-ink-800 text-surface-white font-bold rounded-xl shadow-xs text-xs sm:text-sm transition active:scale-[0.97] disabled:opacity-60 cursor-pointer"
                            >
                              {copyingMagicLinkId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : copiedMagicLinkId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedMagicLinkId === item.id ? "Link Copied!" : "Copy Link"}</span>
                            </button>
                          </Tooltip>

                          {/* Dedicated Resend Email Button */}
                          <Tooltip content="Re-send email invitation directly to client's inbox">
                            <button
                              type="button"
                              onClick={() => handleResendMagicLink(item.id)}
                              disabled={resendingId === item.id}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-white hover:bg-surface-light text-ink-900 border border-ink-900/15 font-semibold rounded-xl text-xs sm:text-sm transition active:scale-[0.97] disabled:opacity-60 cursor-pointer shadow-xs"
                            >
                              {resendingId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5 text-ink-800/80" />
                              )}
                              <span>Resend Email</span>
                            </button>
                          </Tooltip>

                          {editingId !== item.id && (
                            <Tooltip content="Edit reviewer draft text or name">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditContent(item.content);
                                  setEditAuthorName(item.authorName);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-ink-800 hover:text-ink-900 transition px-3 py-2 hover:bg-surface-light rounded-xl cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit Draft</span>
                              </button>
                            </Tooltip>
                          )}

                          {/* Manual publish fallback */}
                          <Tooltip content="Publish immediately without waiting for client email confirmation (converts to self-reported)">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.id, "approved")}
                              disabled={actionLoadingId === item.id}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Publish Manually</span>
                            </button>
                          </Tooltip>

                          {/* Cancel magic link request */}
                          <Tooltip content="Cancel pending magic link request">
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 px-3 py-2 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          </Tooltip>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {editingId !== item.id && (
                            <Tooltip content="Edit testimonial content">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditContent(item.content);
                                  setEditAuthorName(item.authorName);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-ink-800 hover:text-ink-900 transition px-3 py-2 hover:bg-surface-light rounded-xl cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            </Tooltip>
                          )}

                          {item.status !== "approved" && (
                            <Tooltip content="Approve and display on widget">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.id, "approved")}
                                disabled={actionLoadingId === item.id}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-ink-900 hover:bg-ink-800 text-surface-white font-bold rounded-xl shadow-sm text-xs sm:text-sm transition active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {actionLoadingId === item.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>Approve</span>
                              </button>
                            </Tooltip>
                          )}

                          {item.status !== "rejected" && (
                            <Tooltip content="Reject and hide testimonial">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.id, "rejected")}
                                disabled={actionLoadingId === item.id}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-light hover:bg-ink-900/10 text-ink-900 border border-ink-900/20 font-semibold rounded-xl text-xs sm:text-sm transition active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {actionLoadingId === item.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <X className="w-3.5 h-3.5" />
                                )}
                                <span>Reject</span>
                              </button>
                            </Tooltip>
                          )}

                          <Tooltip content="Permanently delete testimonial">
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-ink-800/50 hover:text-rose-600 transition rounded-xl hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Pinned Box Footer Bar */}
        <div className="px-6 py-3.5 bg-surface-white border-t border-ink-900/10 flex items-center justify-between text-xs text-ink-800/60 font-mono shrink-0">
          <span>
            Showing <strong className="text-ink-900 font-bold">{filteredItems.length}</strong> of{" "}
            <strong className="text-ink-900 font-bold">{items.length}</strong> testimonials
          </span>
          {filteredItems.length > 3 && (
            <button
              type="button"
              onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 text-ink-800 hover:text-ink-900 transition cursor-pointer font-bold active:scale-95"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Scroll to Top</span>
            </button>
          )}
        </div>
      </div>

      {/* Magic Link Modal */}
      <AnimatePresence>
        {showMagicModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            {/* Backdrop Fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setShowMagicModal(false)}
              className="fixed inset-0 bg-ink-950/70 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-surface-white max-w-lg w-full rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.22)] border border-ink-900/10 flex flex-col max-h-[90vh] overflow-hidden z-10"
            >
              {/* Pinned Modal Header */}
              <div className="flex items-start justify-between gap-4 p-6 sm:p-7 border-b border-ink-900/10 bg-surface-white shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-ink-900 text-surface-white flex items-center justify-center shrink-0 shadow-sm">
                    <Send className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg sm:text-xl font-bold text-ink-900 tracking-tight truncate">
                      Send Magic Link Request
                    </h2>
                    <p className="text-xs text-ink-800/70 leading-normal mt-0.5">
                      Client approves in 1 click or edits directly — no login required.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMagicModal(false)}
                  className="p-2 -mr-2 -mt-2 text-ink-800/50 hover:text-ink-900 hover:bg-surface-light rounded-xl transition cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSendMagicLink} className="flex flex-col flex-1 min-h-0">
                <div className="p-6 sm:p-7 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1.5">
                      Target Widget
                    </label>
                    <CustomSelect
                      options={widgetsList.map((w) => ({ value: w.id, label: w.name }))}
                      value={magicWidgetId}
                      onChange={(val) => setMagicWidgetId(val)}
                      placeholder="Select a target widget..."
                      emptyGuidance="Create a widget first to send magic links"
                    />
                  </div>

                  {/* 2-Column Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1.5">
                        Client Email
                      </label>
                      <input
                        type="email"
                        value={magicEmail}
                        onChange={(e) => setMagicEmail(e.target.value)}
                        placeholder="client@company.com"
                        className="w-full px-3.5 py-2.5 bg-surface-white border border-ink-900/15 focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10 rounded-xl text-sm transition outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1.5">
                        Client Name
                      </label>
                      <input
                        type="text"
                        value={magicName}
                        onChange={(e) => setMagicName(e.target.value)}
                        placeholder="John Smith"
                        className="w-full px-3.5 py-2.5 bg-surface-white border border-ink-900/15 focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10 rounded-xl text-sm transition outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Warm Email Note to Client (Framing Message) */}
                  <div className="p-4 bg-surface-light/80 rounded-2xl border border-ink-900/10 space-y-3">
                    <div className="flex items-center justify-between gap-2">
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
                        className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-xs font-mono bg-surface-white focus:outline-none focus:border-ink-900 leading-relaxed shadow-inner"
                      />
                    ) : (
                      <div className="p-3 bg-surface-white rounded-xl border border-ink-900/10 text-xs text-ink-800/85 italic leading-relaxed shadow-2xs">
                        "{effectivePrompt}"
                      </div>
                    )}
                  </div>

                  {/* Draft Testimonial Content with 1-Click Starter Suggestions */}
                  <div className="space-y-2.5">
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
                    <div className="space-y-1.5">
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
                            className={`px-2.5 py-2 rounded-xl text-[11px] font-medium border text-left transition cursor-pointer flex items-center gap-1.5 ${
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
                      className="w-full px-3.5 py-2.5 border border-ink-900/15 focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10 rounded-xl text-sm bg-surface-white leading-relaxed outline-none transition"
                      required
                    />
                  </div>
                </div>

                {/* Pinned Modal Footer */}
                <div className="p-4 sm:p-5 px-6 sm:px-7 bg-surface-white border-t border-ink-900/10 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
                  <button
                    type="button"
                    onClick={() => setShowMagicModal(false)}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-ink-800/70 hover:text-ink-900 hover:bg-surface-light rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs sm:text-sm font-bold text-surface-white bg-ink-900 hover:bg-ink-800 rounded-xl shadow-sm transition active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Magic Link</span>
                      </>
                    )}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            {/* Backdrop Fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setShowImportModal(false)}
              className="fixed inset-0 bg-ink-950/70 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-surface-white max-w-lg w-full rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.22)] border border-ink-900/10 flex flex-col max-h-[90vh] overflow-hidden z-10"
            >
              {/* Pinned Modal Header */}
              <div className="flex items-start justify-between gap-4 p-6 sm:p-7 border-b border-ink-900/10 bg-surface-white shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-ink-900 text-surface-white flex items-center justify-center shrink-0 shadow-sm">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg sm:text-xl font-bold text-ink-900 tracking-tight truncate">
                      Import Offline Praise
                    </h2>
                    <p className="text-xs text-ink-800/70 leading-normal mt-0.5">
                      Import feedback from Slack, email, or DMs with hardcoded trust signals.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="p-2 -mr-2 -mt-2 text-ink-800/50 hover:text-ink-900 hover:bg-surface-light rounded-xl transition cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleManualImport} className="flex flex-col flex-1 min-h-0">
                <div className="p-6 sm:p-7 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1.5">
                      Target Widget
                    </label>
                    <CustomSelect
                      options={widgetsList.map((w) => ({ value: w.id, label: w.name }))}
                      value={importWidgetId}
                      onChange={(val) => setImportWidgetId(val)}
                      placeholder="Select a target widget..."
                      emptyGuidance="Create a widget first to import praise"
                    />
                  </div>

                  {/* 2-Column Row on Desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1.5">
                        Author Name
                      </label>
                      <input
                        type="text"
                        value={importName}
                        onChange={(e) => setImportName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full px-3.5 py-2.5 bg-surface-white border border-ink-900/15 focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10 rounded-xl text-sm transition outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1.5">
                        Author Title
                      </label>
                      <input
                        type="text"
                        value={importTitle}
                        onChange={(e) => setImportTitle(e.target.value)}
                        placeholder="VP of Growth"
                        className="w-full px-3.5 py-2.5 bg-surface-white border border-ink-900/15 focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10 rounded-xl text-sm transition outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-800/70 mb-1.5">
                      Content Body
                    </label>
                    <textarea
                      rows={3}
                      value={importContent}
                      onChange={(e) => setImportContent(e.target.value)}
                      placeholder="Copy Slack/Email praise here..."
                      className="w-full px-3.5 py-2.5 bg-surface-white border border-ink-900/15 focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10 rounded-xl text-sm transition outline-none leading-relaxed"
                      required
                    />
                  </div>

                  {/* Trust Badge Pill Aesthetic Callout */}
                  <div className="p-4 rounded-2xl bg-surface-light border border-ink-900/10 text-xs text-ink-800 space-y-2">
                    <div className="flex items-center gap-2 font-mono font-semibold text-ink-900">
                      <ShieldCheck className="w-4 h-4 text-ink-900" />
                      <span>Trust Verification Badge Applied</span>
                    </div>
                    <p className="text-[11px] text-ink-800/75 leading-relaxed">
                      Imported testimonials will carry the public trust pill badge:
                    </p>
                    <div className="pt-0.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-white border border-ink-800/20 text-ink-800 font-mono text-[11px] font-semibold shadow-xs">
                        <span>Self-Reported / Imported</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pinned Modal Footer */}
                <div className="p-4 sm:p-5 px-6 sm:px-7 bg-surface-white border-t border-ink-900/10 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-ink-800/70 hover:text-ink-900 hover:bg-surface-light rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs sm:text-sm font-bold text-surface-white bg-ink-900 hover:bg-ink-800 rounded-xl shadow-sm transition active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Import Praise</span>
                      </>
                    )}
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
