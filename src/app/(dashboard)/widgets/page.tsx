"use client";

import { useState, useEffect } from "react";
import { Sparkles, Copy, Check, Code, Eye, Plus, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface WidgetItem {
  id: string;
  name: string;
  slug: string;
  themeConfig: Record<string, any>;
  isActive: boolean;
}

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<WidgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("Default Portfolio Widget");
  const [slug, setSlug] = useState("my-portfolio");
  const [cardStyle, setCardStyle] = useState("border");
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchWidgets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/widgets");
      const data = await res.json();
      if (data.widgets) {
        setWidgets(data.widgets);
      }
    } catch (err) {
      console.error("Failed to load widgets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWidgets();
  }, []);

  const handleCreateWidget = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          themeConfig: {
            primaryColor,
            cardStyle,
            showRating: true,
            showAvatar: true,
          },
          isActive: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Widget created successfully!");
        fetchWidgets();
      } else {
        alert(data.error || "Failed to create widget.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setCreating(false);
    }
  };

  const getEmbedCode = (widgetSlug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://app.clientecho.com";
    return `<script src="${origin}/widget.js" data-widget-slug="${widgetSlug}" async></script>`;
  };

  const handleCopy = (widgetSlug: string, widgetId: string) => {
    navigator.clipboard.writeText(getEmbedCode(widgetSlug));
    setCopiedId(widgetId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Widget Customizer & Embed Generator</h1>
        <p className="text-slate-500 text-sm mt-1">
          Customize styling and grab your sandboxed iframe embed script.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Widget Configuration Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Create New Widget</span>
          </h2>

          <form onSubmit={handleCreateWidget} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Widget Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Embed Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Card Style
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["border", "glass", "minimal"].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setCardStyle(style)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition ${
                      cardStyle === style
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Accent Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
                />
                <span className="font-mono text-xs text-slate-600 uppercase">{primaryColor}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Widget...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Save & Generate Embed Code</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Widgets & Embed Scripts */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-600" />
            <span>Your Active Widgets</span>
          </h2>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading widgets...</span>
            </div>
          ) : widgets.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm italic">
              No widgets created yet. Use the form on the left to create your first embed widget!
            </div>
          ) : (
            widgets.map((widget) => (
              <div
                key={widget.id}
                className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-sm space-y-4 border border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{widget.name}</h3>
                    <span className="text-xs text-indigo-400 font-mono">slug: {widget.slug}</span>
                  </div>

                  <button
                    onClick={() => handleCopy(widget.slug, widget.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    {copiedId === widget.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === widget.id ? "Copied!" : "Copy Embed Script"}</span>
                  </button>
                </div>

                <pre className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800 whitespace-pre-wrap">
                  {getEmbedCode(widget.slug)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
