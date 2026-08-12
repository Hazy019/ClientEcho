"use client";

import { useState, useEffect } from "react";
import { Sparkles, Copy, Check, Code, Eye, Plus, Loader2, Star } from "lucide-react";

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

  // Live Form State
  const [name, setName] = useState("Default Portfolio Widget");
  const [slug, setSlug] = useState("my-portfolio");
  const [cardStyle, setCardStyle] = useState<"border" | "glass" | "minimal">("border");
  const [primaryColor, setPrimaryColor] = useState("#2D2D2D");
  const [showRating, setShowRating] = useState(true);
  const [showAvatar, setShowAvatar] = useState(true);
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
            showRating,
            showAvatar,
          },
          isActive: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Widget saved & generated!");
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
      <div className="border-b border-ink-900/10 pb-6">
        <h1 className="font-display text-3xl font-bold text-ink-900">Widget Customizer</h1>
        <p className="text-ink-800/70 text-sm mt-1">
          Configure real-time styling with live side-by-side preview and grab sandboxed embed code.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Configurator */}
        <div className="bg-surface-white p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
          <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-ink-900" />
            <span>Widget Styling Configuration</span>
          </h2>

          <form onSubmit={handleCreateWidget} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1">
                Widget Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-sm focus:outline-none focus:border-ink-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1">
                Embed Slug (Unique Identifier)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-xs font-mono focus:outline-none focus:border-ink-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1">
                Card Presentation Style
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["border", "glass", "minimal"] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setCardStyle(style)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium capitalize border transition ${
                      cardStyle === style
                        ? "border-ink-900 bg-ink-900 text-surface-white font-semibold shadow-sm"
                        : "border-ink-900/10 text-ink-800/70 hover:bg-surface-light"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider">
                Display Rating Stars
              </label>
              <input
                type="checkbox"
                checked={showRating}
                onChange={(e) => setShowRating(e.target.checked)}
                className="w-4 h-4 rounded border-ink-900 text-ink-900 focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider">
                Display Author Avatar Badge
              </label>
              <input
                type="checkbox"
                checked={showAvatar}
                onChange={(e) => setShowAvatar(e.target.checked)}
                className="w-4 h-4 rounded border-ink-900 text-ink-900 focus:ring-0 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 bg-ink-900 hover:bg-ink-800 text-surface-white font-display font-semibold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Widget...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Save Configuration & Generate Script</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Side-by-Side Preview Pane (No Reload Needed) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-ink-900" />
              <span>Live Instant Preview Pane</span>
            </h2>
            <span className="text-[10px] font-mono uppercase bg-ink-900 text-surface-white px-2 py-0.5 rounded">
              Live Preview
            </span>
          </div>

          {/* Rendered Live Card Preview */}
          <div className="bg-surface-light p-6 rounded-3xl border border-ink-900/10 space-y-4 min-h-[300px] flex flex-col justify-center">
            <div
              className={`p-6 rounded-2xl transition-all duration-200 ${
                cardStyle === "glass"
                  ? "bg-surface-white/70 backdrop-blur-md shadow-sm border border-surface-white"
                  : cardStyle === "border"
                  ? "bg-surface-white border border-ink-900/10 shadow-sm"
                  : "bg-surface-white/40"
              }`}
            >
              {showRating && (
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-ink-900 text-ink-900" />
                  ))}
                </div>
              )}

              <p className="text-sm text-ink-900 leading-relaxed font-sans mb-4">
                "ClientEcho completely eliminated back-and-forth friction for our client testimonials. The magic link approval process took less than 30 seconds!"
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-ink-900/5">
                <div className="flex items-center gap-3">
                  {showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-ink-900 text-surface-white flex items-center justify-center font-bold text-xs">
                      S
                    </div>
                  )}
                  <div>
                    <div className="font-display font-bold text-ink-900 text-xs">Sarah Jenkins</div>
                    <div className="text-[11px] text-ink-800/60 font-sans">Founder at Acme Studio</div>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-ink-900 text-surface-white">
                  Verified & Approved
                </span>
              </div>
            </div>
          </div>

          {/* Active Widgets Embed List */}
          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-ink-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-ink-900" />
              <span>Active Embed Codes</span>
            </h3>

            {loading ? (
              <div className="py-6 text-center text-ink-800/50 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading active widgets...</span>
              </div>
            ) : widgets.length === 0 ? (
              <div className="bg-surface-white p-6 rounded-2xl border border-ink-900/10 text-center text-xs text-ink-800/60 italic">
                Save your first widget above to generate embed script tags!
              </div>
            ) : (
              widgets.map((widget) => (
                <div
                  key={widget.id}
                  className="bg-ink-900 text-surface-white p-5 rounded-2xl shadow-sm space-y-3 border border-ink-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-bold text-surface-white text-sm">
                        {widget.name}
                      </h4>
                      <span className="text-[11px] text-surface-white/60 font-mono">
                        slug: {widget.slug}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(widget.slug, widget.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-white text-ink-900 hover:bg-surface-light rounded-lg text-xs font-semibold transition"
                    >
                      {copiedId === widget.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === widget.id ? "Copied!" : "Copy Embed"}</span>
                    </button>
                  </div>

                  <pre className="bg-ink-800 p-3 rounded-xl font-mono text-[11px] text-surface-white/90 overflow-x-auto border border-surface-white/10 whitespace-pre-wrap">
                    {getEmbedCode(widget.slug)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
