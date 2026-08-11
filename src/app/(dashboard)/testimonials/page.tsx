"use client";

import { useState, useEffect } from "react";
import { Send, Upload, Star, Check, X, Trash2, Loader2, Filter } from "lucide-react";

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
}

export default function TestimonialsModerationPage() {
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [widgetsList, setWidgetsList] = useState<Array<{ id: string; name: string }>>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [loadingItems, setLoadingItems] = useState(true);

  const [showMagicModal, setShowMagicModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      // Fetch creator widgets
      const widgetsRes = await fetch("/api/widgets");
      const widgetsData = await widgetsRes.json();
      if (widgetsData.widgets) {
        setWidgetsList(widgetsData.widgets);
        if (widgetsData.widgets.length > 0) {
          setMagicWidgetId(widgetsData.widgets[0].id);
          setImportWidgetId(widgetsData.widgets[0].id);
        }
      }

      // Fetch creator testimonials
      const testimonialsRes = await fetch("/api/testimonials");
      const testimonialsData = await testimonialsRes.json();
      if (testimonialsData.testimonials) {
        setItems(testimonialsData.testimonials);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
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
      alert("Please create a widget first in the Widgets tab!");
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
        alert("Magic link sent successfully!");
        setShowMagicModal(false);
        setMagicEmail("");
        setMagicName("");
        setMagicContent("");
        fetchInitialData();
      } else {
        alert(data.error || "Failed to send magic link.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importWidgetId) {
      alert("Please create a widget first in the Widgets tab!");
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
        alert("Testimonial imported!");
        setShowImportModal(false);
        setImportName("");
        setImportTitle("");
        setImportContent("");
        fetchInitialData();
      } else {
        alert(data.error || "Import failed.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setItems(items.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
      } else {
        alert("Failed to update status.");
      }
    } catch {
      alert("Network error.");
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
      } else {
        alert("Failed to delete testimonial.");
      }
    } catch {
      alert("Network error.");
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Testimonials Moderation</h1>
          <p className="text-slate-500 text-sm mt-1">
            Approve, reject, or request single-click magic link testimonials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMagicModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
          >
            <Send className="w-4 h-4" />
            <span>Send Magic Link</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
          >
            <Upload className="w-4 h-4" />
            <span>Import Screenshot</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <Filter className="w-4 h-4 text-slate-400 mr-2" />
        {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
              filter === tab
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Testimonials Grid */}
      {loadingItems ? (
        <div className="py-12 flex items-center justify-center text-indigo-600 text-sm font-medium gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading your testimonials...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <p className="text-slate-500 text-sm italic">No testimonials found for this view.</p>
          <p className="text-xs text-slate-400">
            Click "Send Magic Link" or "Import Screenshot" above to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{item.authorName}</h3>
                  {item.authorTitle && <p className="text-xs text-slate-500">{item.authorTitle}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      item.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : item.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {item.status}
                  </span>

                  {item.isImportedSelfReported && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                      [Self-Reported / Imported]
                    </span>
                  )}
                </div>
              </div>

              {item.rating && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (item.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
              )}

              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{item.content}"
              </p>

              {/* Moderation Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {item.status !== "approved" && (
                    <button
                      onClick={() => handleStatusChange(item.id, "approved")}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}
                  {item.status !== "rejected" && (
                    <button
                      onClick={() => handleStatusChange(item.id, "rejected")}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-slate-400 hover:text-rose-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Magic Link Modal */}
      {showMagicModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              <span>Send Magic Link Request</span>
            </h2>

            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Widget
                </label>
                <select
                  value={magicWidgetId}
                  onChange={(e) => setMagicWidgetId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                >
                  {widgetsList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={magicName}
                  onChange={(e) => setMagicName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Draft Testimonial Content
                </label>
                <textarea
                  rows={3}
                  value={magicContent}
                  onChange={(e) => setMagicContent(e.target.value)}
                  placeholder="Draft testimonial for client to review..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMagicModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-600" />
              <span>Import Offline Testimonial</span>
            </h2>

            <form onSubmit={handleManualImport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Widget
                </label>
                <select
                  value={importWidgetId}
                  onChange={(e) => setImportWidgetId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                >
                  {widgetsList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Author Name
                </label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Author Title
                </label>
                <input
                  type="text"
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  placeholder="VP of Growth"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Content
                </label>
                <textarea
                  rows={3}
                  value={importContent}
                  onChange={(e) => setImportContent(e.target.value)}
                  placeholder="Copy Slack/Email content here..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                Notice: All manual imports are permanently tagged with the hardcoded trust badge:{" "}
                <strong>[Self-Reported / Imported]</strong>.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Importing..." : "Import Testimonial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
