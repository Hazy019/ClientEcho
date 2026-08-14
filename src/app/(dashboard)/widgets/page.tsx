"use client";

import { useState, useEffect } from "react";
import { Sparkles, Copy, Check, Code, Eye, Plus, Loader2, Star, Crown, Palette, Type, Layout, Code2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import UpgradeModal from "@/components/ui/UpgradeModal";

export const dynamic = "force-dynamic";

interface WidgetItem {
  id: string;
  name: string;
  slug: string;
  themeConfig: Record<string, any>;
  isActive: boolean;
}

export default function WidgetsPage() {
  const { showToast } = useToast();

  const [widgets, setWidgets] = useState<WidgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Subscription & CSS trial state
  const [subscriptionStatus, setSubscriptionStatus] = useState<"free" | "pro">("free");
  const [customCssTrialsUsed, setCustomCssTrialsUsed] = useState(0);

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTitle, setUpgradeTitle] = useState("Upgrade to Pro Workspace");
  const [upgradeFeatureName, setUpgradeFeatureName] = useState("Pro Feature Access");
  const [upgradeDescription, setUpgradeDescription] = useState("Unlock unlimited widgets, custom typography, accent colors, layout variants, and bulk approvals.");

  // Collapsible Starter Options State
  const [starterOpen, setStarterOpen] = useState(true);

  // Free Tier State
  const [name, setName] = useState("Default Portfolio Widget");
  const [slug, setSlug] = useState("my-portfolio");
  const [cardStyle, setCardStyle] = useState<"border" | "glass" | "minimal">("border");
  const [showRating, setShowRating] = useState(true);
  const [showAvatar, setShowAvatar] = useState(true);

  // Pro Tier State
  const [fontPairing, setFontPairing] = useState<"Syne" | "Manrope" | "Inter" | "Roboto" | "Outfit">("Manrope");
  const [accentColor, setAccentColor] = useState("#2D2D2D");
  const [layoutVariant, setLayoutVariant] = useState<"grid" | "carousel" | "rotator">("grid");
  const [customCss, setCustomCss] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isPro = subscriptionStatus === "pro";

  const fetchWidgets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/widgets");
      const data = await res.json();

      if (data.widgets) {
        setWidgets(data.widgets);
      }
      if (data.creator) {
        setSubscriptionStatus(data.creator.subscriptionStatus || "free");
        setCustomCssTrialsUsed(data.creator.customCssTrialsUsed || 0);
      }
    } catch (err) {
      console.error("Failed to load widgets:", err);
      showToast("Failed to load active widgets.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWidgets();
  }, []);

  const triggerUpgrade = (featureName: string, title: string, description: string) => {
    setUpgradeFeatureName(featureName);
    setUpgradeTitle(title);
    setUpgradeDescription(description);
    setShowUpgradeModal(true);
  };

  const handleSaveWidget = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side pre-validation for Free tier limits
    if (!isPro && widgets.length >= 1 && !widgets.some((w) => w.slug === slug)) {
      triggerUpgrade(
        "1 Active Widget Cap Reached",
        "Free Plan Widget Limit",
        "Starter Free workspaces are limited to 1 active testimonial widget. Upgrade to Pro for unlimited widgets!"
      );
      return;
    }

    if (!isPro && customCss.trim().length > 0 && customCssTrialsUsed >= 3) {
      triggerUpgrade(
        "Custom CSS Trial Limit Exhausted",
        "3 Free Custom CSS Trials Used",
        "You have used all 3 free Custom CSS trial edits. Upgrade to Pro for unlimited custom CSS customization!"
      );
      return;
    }

    setCreating(true);

    try {
      const res = await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          themeConfig: {
            cardStyle,
            showRating,
            showAvatar,
            fontPairing,
            accentColor,
            layoutVariant,
            customCss,
          },
          isActive: true,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast("Widget configuration saved & script generated!", "success");
        fetchWidgets();
      } else if (res.status === 402 || data.code === "PRO_REQUIRED" || data.code === "LIMIT_REACHED") {
        triggerUpgrade(
          "Pro Subscription Required",
          data.error || "Pro Feature Gated",
          "Upgrade to Pro Workspace to save custom fonts, colors, carousel layouts, and unlimited CSS."
        );
      } else {
        showToast(data.error || "Failed to save widget.", "error");
      }
    } catch {
      showToast("Network error while saving widget.", "error");
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
    showToast("Embed code copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="border-b border-ink-900/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Widget Customizer</h1>
          <p className="text-ink-800/70 text-sm mt-1">
            Configure real-time styling with live side-by-side preview and grab sandboxed embed code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-surface-white border border-ink-900/10 text-ink-900 font-semibold shadow-xs">
            Plan: {isPro ? "Pro Workspace (Unlimited)" : "Starter Free (1 Widget Cap)"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form Configurator */}
        <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
          <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-ink-900" />
            <span>Widget Styling Configuration</span>
          </h2>

          <form onSubmit={handleSaveWidget} className="space-y-6">
            {/* Starter Tier Collapsible Section */}
            <div className="border border-ink-900/10 rounded-2xl overflow-hidden bg-surface-light/40">
              <button
                type="button"
                onClick={() => setStarterOpen(!starterOpen)}
                className="w-full p-4 flex items-center justify-between font-mono font-bold text-xs uppercase tracking-wider text-ink-900 hover:bg-surface-light transition text-left"
              >
                <span>Starter Tier Options (All Plans)</span>
                {starterOpen ? <ChevronUp className="w-4 h-4 text-ink-800/60" /> : <ChevronDown className="w-4 h-4 text-ink-800/60" />}
              </button>

              {starterOpen && (
                <div className="p-4 pt-0 space-y-4 border-t border-ink-900/5 bg-surface-white">
                  <div className="pt-3">
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

                  <div className="flex items-center justify-between pt-1">
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
                </div>
              )}
            </div>

            {/* Pro Tier Section with Gating */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-ink-900/10">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-ink-900" />
                  <span>Pro Tier Customizations</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-ink-900 text-surface-white rounded">
                  PRO
                </span>
              </div>

              {/* Typography Override */}
              <div>
                <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Type className="w-3.5 h-3.5 text-ink-800/60" />
                    <span>Typography Override</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-surface-light border border-ink-800/20 text-ink-800 rounded font-bold">
                    PRO
                  </span>
                </label>
                <select
                  value={fontPairing}
                  onChange={(e) => {
                    if (!isPro && ["Syne", "Roboto", "Outfit"].includes(e.target.value)) {
                      triggerUpgrade(
                        "Pro Typography",
                        "Custom Font Pairings",
                        "Syne, Roboto, and Outfit typography overrides require a Pro Workspace plan."
                      );
                      return;
                    }
                    setFontPairing(e.target.value as any);
                  }}
                  className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-xs font-sans focus:outline-none focus:border-ink-900 bg-surface-white cursor-pointer"
                >
                  <option value="Manrope">Manrope (Clean Modern Sans - Starter)</option>
                  <option value="Inter">Inter (Neutral Precision - Starter)</option>
                  <option value="Syne">Syne (Bold Geometric Display - Pro)</option>
                  <option value="Roboto">Roboto (Classic Sans - Pro)</option>
                  <option value="Outfit">Outfit (High Contrast Premium - Pro)</option>
                </select>
              </div>

              {/* Accent Color Picker */}
              <div>
                <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-ink-800/60" />
                    <span>Widget Accent Color</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-surface-light border border-ink-800/20 text-ink-800 rounded font-bold">
                    PRO
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => {
                      if (!isPro) {
                        triggerUpgrade(
                          "Pro Color Customization",
                          "Custom Accent Colors",
                          "Custom rating stars and verification badge colors require a Pro Workspace plan."
                        );
                        return;
                      }
                      setAccentColor(e.target.value);
                    }}
                    className="w-10 h-10 rounded-xl border border-ink-900/20 cursor-pointer p-1 bg-surface-white"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-xs font-mono focus:outline-none focus:border-ink-900"
                    placeholder="#2D2D2D"
                  />
                </div>
              </div>

              {/* Layout Variant */}
              <div>
                <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Layout className="w-3.5 h-3.5 text-ink-800/60" />
                    <span>Layout Variant</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-surface-light border border-ink-800/20 text-ink-800 rounded font-bold">
                    PRO
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["grid", "carousel", "rotator"] as const).map((variant) => (
                    <button
                      key={variant}
                      type="button"
                      onClick={() => {
                        if (!isPro && variant !== "grid") {
                          triggerUpgrade(
                            "Pro Layout Variants",
                            "Carousel & Rotator Layouts",
                            "Carousel and Single-Quote Rotator presentation modes require a Pro Workspace plan."
                          );
                          return;
                        }
                        setLayoutVariant(variant);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border transition flex items-center justify-center gap-1 ${
                        layoutVariant === variant
                          ? "border-ink-900 bg-ink-900 text-surface-white font-semibold shadow-sm"
                          : "border-ink-900/10 text-ink-800/70 hover:bg-surface-light"
                      }`}
                    >
                      <span>{variant}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom CSS Injection with 3-Trial Counter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5 text-ink-800/60" />
                    <span>Scoped Custom CSS</span>
                  </label>

                  {!isPro ? (
                    <span className="text-[10px] font-mono text-ink-800/70 bg-surface-light px-2 py-0.5 rounded border border-ink-800/20 font-semibold">
                      {Math.max(0, 3 - customCssTrialsUsed)} of 3 free trial edits remaining
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-ink-900 text-surface-white rounded font-bold uppercase">
                      Unlimited PRO
                    </span>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  placeholder=".clientecho-card { border-radius: 20px; }"
                  className="w-full px-3.5 py-2 border border-ink-900/20 rounded-xl text-xs font-mono focus:outline-none focus:border-ink-900 placeholder:text-ink-800/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3.5 bg-ink-900 hover:bg-ink-800 text-surface-white font-display font-semibold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Configuration...</span>
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

        {/* Live Side-by-Side Preview Pane (Sticky in Viewport) */}
        <div className="space-y-6 sticky top-24">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-ink-900" />
              <span>Live Instant Preview Pane</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-ink-900 text-surface-white px-2 py-0.5 rounded">
                Live Preview
              </span>
              <span className="text-[10px] font-mono uppercase bg-surface-light border border-ink-800/20 text-ink-800 px-2 py-0.5 rounded">
                Font: {fontPairing}
              </span>
            </div>
          </div>

          {/* Rendered Dynamic Live Card Preview */}
          <div
            style={{ fontFamily: fontPairing }}
            className="bg-surface-light p-6 rounded-3xl border border-ink-900/10 space-y-4 min-h-[340px] flex flex-col justify-center transition-all duration-300"
          >
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
                    <Star
                      key={s}
                      className="w-4 h-4"
                      style={{ fill: accentColor, color: accentColor }}
                    />
                  ))}
                </div>
              )}

              <p className="text-sm text-ink-900 leading-relaxed mb-4">
                "ClientEcho completely eliminated back-and-forth friction for our client testimonials. The magic link approval process took less than 30 seconds!"
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-ink-900/5">
                <div className="flex items-center gap-3">
                  {showAvatar && (
                    <div
                      className="w-8 h-8 rounded-full text-surface-white flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: accentColor }}
                    >
                      S
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-ink-900 text-xs">Sarah Jenkins</div>
                    <div className="text-[11px] text-ink-800/60">Founder at Acme Studio</div>
                  </div>
                </div>

                <span
                  className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded text-surface-white"
                  style={{ backgroundColor: accentColor }}
                >
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
                Save your first widget configuration above to generate embed script tags!
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

      {/* Upgrade to Pro Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={upgradeTitle}
        featureName={upgradeFeatureName}
        description={upgradeDescription}
      />
    </div>
  );
}
