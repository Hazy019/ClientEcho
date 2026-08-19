"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Code,
  Eye,
  Plus,
  Loader2,
  Palette,
  Type,
  Layout,
  Code2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Edit3,
  Sun,
  Moon,
  Sliders,
  Play,
  Layers,
  HelpCircle,
  Maximize2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import UpgradeModal from "@/components/ui/UpgradeModal";
import CustomSelect from "@/components/ui/CustomSelect";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import WidgetDisplayClient from "@/app/embed/[slug]/WidgetDisplayClient";

export const dynamic = "force-dynamic";

function generateRandomSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `portfolio-${result}`;
}

function getLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length !== 6) return 0.5;
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

interface WidgetItem {
  id: string;
  name: string;
  slug: string;
  themeConfig: Record<string, any>;
  isActive: boolean;
}

const sampleTestimonials = [
  {
    id: "sample-1",
    authorName: "Sarah Jenkins",
    authorTitle: "Founder at Acme Studio",
    content: "ClientEcho completely eliminated back-and-forth friction for our client testimonials. The magic link approval process took less than 30 seconds!",
    rating: 5,
    source: "magic_link" as const,
    isImportedSelfReported: false,
  },
  {
    id: "sample-2",
    authorName: "Marcus Chen",
    authorTitle: "VP Product at LinearFlow",
    content: "Embedding the verified widget on our landing page boosted our demo conversion rate by 34% in the first two weeks. Exceptional build quality.",
    rating: 5,
    source: "magic_link" as const,
    isImportedSelfReported: false,
  },
  {
    id: "sample-3",
    authorName: "Elena Rostova",
    authorTitle: "Design Lead at Prisma Lab",
    content: "Cleanest testimonial widget I've integrated. The dark mode matches our design system seamlessly with zero CSS overrides needed.",
    rating: 5,
    source: "manual_import" as const,
    isImportedSelfReported: true,
  },
];

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

  // Collapsible Sections State
  const [starterOpen, setStarterOpen] = useState(true);
  const [noCodeOpen, setNoCodeOpen] = useState(true);
  const [cssCheatSheetOpen, setCssCheatSheetOpen] = useState(false);

  // Free Tier State
  const [name, setName] = useState("Default Portfolio Widget");
  const [slug, setSlug] = useState(() => generateRandomSlug());
  const [cardStyle, setCardStyle] = useState<"border" | "glass" | "minimal">("border");
  const [showRating, setShowRating] = useState(true);
  const [showAvatar, setShowAvatar] = useState(true);

  // Real-time Slug Availability Indicator State
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
    isOwner?: boolean;
  }>({
    checking: false,
    available: null,
    message: "",
  });

  // Pro & Styling Tier State
  const [fontPairing, setFontPairing] = useState<"Syne" | "Manrope" | "Inter" | "Roboto" | "Outfit">("Manrope");
  const [accentColor, setAccentColor] = useState("#2D2D2D");
  const [layoutVariant, setLayoutVariant] = useState<"grid" | "carousel" | "rotator" | "marquee" | "spotlight">("grid");
  const [customCss, setCustomCss] = useState("");

  // Pass 13 & 14 No-Code Presets, Motion & Sizing Settings
  const [borderRadius, setBorderRadius] = useState(16); // 0px to 32px
  const [paddingDensity, setPaddingDensity] = useState<"compact" | "comfortable" | "spacious">("comfortable");
  const [shadowIntensity, setShadowIntensity] = useState<"none" | "subtle" | "pronounced">("subtle");
  const [sizePreset, setSizePreset] = useState<"compact" | "standard" | "large" | "full" | "custom">("standard");
  const [customMaxWidth, setCustomMaxWidth] = useState("");
  const [defaultTheme, setDefaultTheme] = useState<"light" | "dark" | "auto">("light");
  const [textReveal, setTextReveal] = useState(false);
  const [autoRotateInterval, setAutoRotateInterval] = useState(6);

  // Live Preview Theme Switcher & Replay State
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");
  const [replayCount, setReplayCount] = useState(0);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSyncSnippet, setCopiedSyncSnippet] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);

  // Auto-play animation once on load or whenever layout/motion/size changes
  useEffect(() => {
    setReplayCount((c) => c + 1);
  }, [layoutVariant, textReveal, sizePreset, borderRadius]);

  const checkSlugAvailability = useCallback(async (slugToCheck: string) => {
    const clean = slugToCheck.trim().toLowerCase();
    if (clean.length < 3) {
      setSlugStatus({
        checking: false,
        available: false,
        message: "Slug must be at least 3 characters",
      });
      return;
    }
    setSlugStatus((prev) => ({ ...prev, checking: true }));
    try {
      const res = await fetch(`/api/widgets/check-slug?slug=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok) {
        setSlugStatus({
          checking: false,
          available: data.available,
          message: data.message || (data.available ? "URL slug is available!" : "This slug is already taken."),
          isOwner: data.isOwner,
        });
      } else {
        setSlugStatus({
          checking: false,
          available: false,
          message: data.error || "Slug is unavailable or invalid.",
        });
      }
    } catch {
      setSlugStatus({ checking: false, available: null, message: "" });
    }
  }, []);

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

    // Client-side pre-validation for Workspace limits
    if (widgets.length >= 1 && !widgets.some((w) => w.slug === slug)) {
      showToast(
        "Your workspace is limited to 1 active widget. You can edit your existing widget or update its slug.",
        "info",
        "Widget Limit Reached"
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
            borderRadius,
            paddingDensity,
            shadowIntensity,
            sizePreset,
            customMaxWidth: sizePreset === "custom" ? customMaxWidth : undefined,
            defaultTheme,
            textReveal,
            autoRotateInterval,
          },
          isActive: true,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast("Widget configuration saved & script generated!", "success");
        setSlugStatus({
          checking: false,
          available: true,
          message: `"${slug}" is your active widget URL.`,
          isOwner: true,
        });
        fetchWidgets();
      } else if (res.status === 409) {
        showToast(data.error || `The URL "${slug}" is already taken. Try a different one.`, "error");
        setSlugStatus({
          checking: false,
          available: false,
          message: data.error || "Slug collision detected. Please pick another URL.",
        });
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

  const loadWidgetToEdit = (widget: WidgetItem) => {
    setName(widget.name);
    setSlug(widget.slug);
    setEditingWidgetId(widget.id);
    const cfg = widget.themeConfig || {};
    if (cfg.cardStyle) setCardStyle(cfg.cardStyle);
    if (cfg.showRating !== undefined) setShowRating(cfg.showRating);
    if (cfg.showAvatar !== undefined) setShowAvatar(cfg.showAvatar);
    if (cfg.fontPairing) setFontPairing(cfg.fontPairing);
    if (cfg.accentColor) setAccentColor(cfg.accentColor);
    if (cfg.layoutVariant) setLayoutVariant(cfg.layoutVariant);
    if (cfg.customCss !== undefined) setCustomCss(cfg.customCss);
    if (cfg.borderRadius !== undefined) setBorderRadius(Number(cfg.borderRadius) || 16);
    if (cfg.paddingDensity) setPaddingDensity(cfg.paddingDensity);
    if (cfg.shadowIntensity) setShadowIntensity(cfg.shadowIntensity);
    if (cfg.sizePreset) setSizePreset(cfg.sizePreset);
    if (cfg.customMaxWidth) setCustomMaxWidth(String(cfg.customMaxWidth));
    if (cfg.defaultTheme) {
      setDefaultTheme(cfg.defaultTheme);
      if (cfg.defaultTheme === "dark") setPreviewTheme("dark");
      else setPreviewTheme("light");
    }
    if (cfg.textReveal !== undefined) setTextReveal(Boolean(cfg.textReveal));
    if (cfg.autoRotateInterval) setAutoRotateInterval(Number(cfg.autoRotateInterval) || 6);

    setSlugStatus({
      checking: false,
      available: true,
      message: `"${widget.slug}" is your active widget URL.`,
      isOwner: true,
    });
    showToast(`Loaded "${widget.name}" into editor`, "info");
  };

  const handleNewWidget = () => {
    const newSlug = generateRandomSlug();
    setName("New Testimonial Widget");
    setSlug(newSlug);
    setEditingWidgetId(null);
    setCardStyle("border");
    setShowRating(true);
    setShowAvatar(true);
    setFontPairing("Manrope");
    setAccentColor("#2D2D2D");
    setLayoutVariant("grid");
    setCustomCss("");
    setBorderRadius(16);
    setPaddingDensity("comfortable");
    setShadowIntensity("subtle");
    setSizePreset("standard");
    setCustomMaxWidth("");
    setDefaultTheme("light");
    setPreviewTheme("light");
    setTextReveal(false);
    setAutoRotateInterval(6);
    setSlugStatus({ checking: false, available: null, message: "" });
    showToast("Ready to configure new widget", "info");
  };

  const getEmbedCode = (widgetSlug: string, themeVal?: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://app.clientecho.com";
    const selectedTheme = themeVal || defaultTheme;
    return `<script src="${origin}/widget.js" data-widget-slug="${widgetSlug}" data-theme="${selectedTheme}" async></script>`;
  };

  const handleCopy = (widgetSlug: string, widgetId: string) => {
    navigator.clipboard.writeText(getEmbedCode(widgetSlug));
    setCopiedId(widgetId);
    showToast("Embed code copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hostSyncSnippet = `// On your host website, whenever your own dark-mode toggle fires:
window.postMessage({ type: "clientecho-set-theme", theme: "dark" }, "*");`;

  const handleCopySyncSnippet = () => {
    navigator.clipboard.writeText(hostSyncSnippet);
    setCopiedSyncSnippet(true);
    showToast("Host theme sync snippet copied!", "success");
    setTimeout(() => setCopiedSyncSnippet(false), 2000);
  };

  const cssClassList = [
    { name: ".clientecho-card", desc: "The outer testimonial card container (background, borders, shadows)" },
    { name: ".clientecho-quote", desc: "The quote text paragraph element" },
    { name: ".clientecho-author-name", desc: "The reviewer's full name" },
    { name: ".clientecho-author-title", desc: "The reviewer's job title or company name" },
    { name: ".clientecho-avatar", desc: "The author avatar image or initial badge circle" },
    { name: ".clientecho-badge", desc: "The trust verification badge (Verified / Self-Reported)" },
    { name: ".clientecho-stars", desc: "The star rating row and star icons" },
    { name: ".clientecho-video-btn", desc: "The video testimonial watch button" },
    { name: ".clientecho-rotator-nav", desc: "The previous/next navigation bar in rotator layout" },
    { name: ".clientecho-spotlight-chips", desc: "The interactive reviewer thumbnail selector chips" },
  ];

  // Construct current preview widget configuration object
  const previewWidgetConfig = {
    id: editingWidgetId || "preview-widget",
    slug: slug || "preview-widget",
    name: name || "Preview Widget",
    themeConfig: {
      cardStyle,
      showRating,
      showAvatar,
      fontPairing,
      accentColor,
      layoutVariant,
      customCss,
      borderRadius,
      paddingDensity,
      shadowIntensity,
      sizePreset,
      customMaxWidth: sizePreset === "custom" ? customMaxWidth : undefined,
      defaultTheme: previewTheme,
      textReveal,
      autoRotateInterval,
    },
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="border-b border-ink-900/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Widget Customizer</h1>
          <p className="text-ink-800/70 text-sm mt-1">
            Configure real-time styling, 3D motion transitions, dark/light themes, sizing presets, and grab sandboxed embed code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-surface-white border border-ink-900/10 text-ink-900 font-semibold shadow-xs">
            Workspace Limit: {widgets.length} / 1 Active Widget
          </span>
          <button
            type="button"
            onClick={handleNewWidget}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink-900 text-surface-white hover:bg-ink-800 rounded-full text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Widget</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form Configurator */}
        <div className="bg-surface-white p-6 sm:p-8 rounded-3xl border border-ink-900/10 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-ink-900" />
              <span>{editingWidgetId ? "Edit Widget Configuration" : "Widget Configuration"}</span>
            </h2>
            {editingWidgetId && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 rounded font-semibold">
                Editing Existing
              </span>
            )}
          </div>

          <form onSubmit={handleSaveWidget} className="space-y-6">
            {/* Starter Tier Collapsible Section */}
            <div className="border border-ink-900/10 rounded-2xl overflow-hidden bg-surface-light/40">
              <button
                type="button"
                onClick={() => setStarterOpen(!starterOpen)}
                className="w-full p-4 flex items-center justify-between font-mono font-bold text-xs uppercase tracking-wider text-ink-900 hover:bg-surface-light transition text-left cursor-pointer"
              >
                <span>1. Core Identity & Cards</span>
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider">
                        Embed Slug (Unique Identifier)
                      </label>
                      {slugStatus.checking ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-800/60">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Checking...</span>
                        </span>
                      ) : slugStatus.available === true ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{slugStatus.isOwner ? "Your URL" : "Available"}</span>
                        </span>
                      ) : slugStatus.available === false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-700 font-semibold">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Already taken</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={slug}
                          onBlur={() => checkSlugAvailability(slug)}
                          onChange={(e) => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                            setSlug(val);
                            if (slugStatus.available !== null) {
                              setSlugStatus({ checking: false, available: null, message: "" });
                            }
                          }}
                          className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-mono focus:outline-none transition ${
                            slugStatus.available === true
                              ? "border-emerald-500 bg-emerald-500/5 focus:border-emerald-600"
                              : slugStatus.available === false
                              ? "border-rose-500 bg-rose-500/5 focus:border-rose-600"
                              : "border-ink-900/20 focus:border-ink-900"
                          }`}
                          placeholder="portfolio-a8f9x2"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const freshSlug = generateRandomSlug();
                          setSlug(freshSlug);
                          checkSlugAvailability(freshSlug);
                        }}
                        title="Generate random unique slug"
                        className="px-3 py-2.5 bg-surface-light hover:bg-ink-900/5 text-ink-900 border border-ink-900/10 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-ink-800/60" />
                        <span className="hidden sm:inline">Randomize</span>
                      </button>
                    </div>

                    {slugStatus.message && (
                      <p
                        className={`text-[11px] mt-1 font-mono ${
                          slugStatus.available === true
                            ? "text-emerald-700"
                            : slugStatus.available === false
                            ? "text-rose-600 font-semibold"
                            : "text-ink-800/60"
                        }`}
                      >
                        {slugStatus.message}
                      </p>
                    )}
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
                          className={`py-2.5 px-3 rounded-xl text-xs font-medium capitalize border transition cursor-pointer ${
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

            {/* No-Code Visual Presets Section */}
            <div className="border border-ink-900/10 rounded-2xl overflow-hidden bg-surface-light/40">
              <button
                type="button"
                onClick={() => setNoCodeOpen(!noCodeOpen)}
                className="w-full p-4 flex items-center justify-between font-mono font-bold text-xs uppercase tracking-wider text-ink-900 hover:bg-surface-light transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-ink-900" />
                  <span>2. Sizing, Visual & Theme Presets</span>
                </div>
                {noCodeOpen ? <ChevronUp className="w-4 h-4 text-ink-800/60" /> : <ChevronDown className="w-4 h-4 text-ink-800/60" />}
              </button>

              {noCodeOpen && (
                <div className="p-4 pt-0 space-y-4 border-t border-ink-900/5 bg-surface-white">
                  {/* Default Theme Selector */}
                  <div className="pt-3">
                    <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1.5">
                      Default Embed Theme
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["light", "dark", "auto"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setDefaultTheme(t);
                            if (t === "dark") setPreviewTheme("dark");
                            else setPreviewTheme("light");
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            defaultTheme === t
                              ? "border-ink-900 bg-ink-900 text-surface-white font-semibold shadow-sm"
                              : "border-ink-900/10 text-ink-800/70 hover:bg-surface-light"
                          }`}
                        >
                          {t === "light" && <Sun className="w-3.5 h-3.5" />}
                          {t === "dark" && <Moon className="w-3.5 h-3.5" />}
                          {t === "auto" && <Layers className="w-3.5 h-3.5" />}
                          <span>{t === "auto" ? "Auto (OS)" : t}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Widget Sizing Presets */}
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-ink-800/60" />
                      <span>Widget Container Size</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {[
                        { id: "compact", label: "Compact", sub: "320px" },
                        { id: "standard", label: "Standard", sub: "480px" },
                        { id: "large", label: "Large", sub: "640px" },
                        { id: "full", label: "Full Width", sub: "100%" },
                        { id: "custom", label: "Custom", sub: "Exact" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSizePreset(item.id as any)}
                          className={`py-2 px-2 rounded-xl text-center border transition flex flex-col items-center justify-center cursor-pointer ${
                            sizePreset === item.id
                              ? "border-ink-900 bg-ink-900 text-surface-white font-semibold shadow-sm"
                              : "border-ink-900/10 text-ink-800/70 hover:bg-surface-light"
                          }`}
                        >
                          <span className="text-xs font-medium">{item.label}</span>
                          <span className="text-[9px] opacity-70 font-mono">{item.sub}</span>
                        </button>
                      ))}
                    </div>

                    {sizePreset === "custom" && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={customMaxWidth}
                          onChange={(e) => setCustomMaxWidth(e.target.value)}
                          placeholder="e.g. 520px or 75%"
                          className="w-full px-3 py-2 border border-ink-900/20 rounded-xl text-xs font-mono focus:outline-none focus:border-ink-900"
                        />
                        <span className="text-[11px] text-ink-800/60 font-mono whitespace-nowrap">
                          Responsive max-width
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Corner Roundness Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider">
                        Corner Roundness
                      </label>
                      <span className="text-xs font-mono font-bold text-ink-900 bg-surface-light px-2 py-0.5 rounded border border-ink-900/10">
                        {borderRadius}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={32}
                      step={2}
                      value={borderRadius}
                      onChange={(e) => setBorderRadius(Number(e.target.value))}
                      className="w-full h-2 bg-ink-900/10 rounded-lg appearance-none cursor-pointer accent-ink-900"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-ink-800/50 mt-1">
                      <span>Sharp (0px)</span>
                      <span>Card (16px)</span>
                      <span>Pill (32px)</span>
                    </div>
                  </div>

                  {/* Padding Density */}
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1.5">
                      Card Padding Density
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["compact", "comfortable", "spacious"] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setPaddingDensity(d)}
                          className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border transition cursor-pointer ${
                            paddingDensity === d
                              ? "border-ink-900 bg-ink-900 text-surface-white font-semibold shadow-sm"
                              : "border-ink-900/10 text-ink-800/70 hover:bg-surface-light"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shadow Intensity */}
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1.5">
                      Shadow Elevation
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["none", "subtle", "pronounced"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setShadowIntensity(s)}
                          className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border transition cursor-pointer ${
                            shadowIntensity === s
                              ? "border-ink-900 bg-ink-900 text-surface-white font-semibold shadow-sm"
                              : "border-ink-900/10 text-ink-800/70 hover:bg-surface-light"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Layout, Typography & Motion Customization */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-ink-900/10">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900 flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-ink-900" />
                  <span>3. Layout Variety & React Bits Motion</span>
                </div>
                <span className="text-[10px] font-mono font-medium uppercase px-2 py-0.5 bg-surface-light border border-ink-900/10 text-ink-800 rounded">
                  React Bits Enabled
                </span>
              </div>

              {/* Layout Format Variety (Grid, Carousel, Rotator, Marquee, Spotlight) */}
              <div>
                <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1.5">
                  Layout Format
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { id: "grid", label: "Grid" },
                    { id: "carousel", label: "Carousel" },
                    { id: "rotator", label: "Rotator" },
                    { id: "marquee", label: "Marquee" },
                    { id: "spotlight", label: "Spotlight" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLayoutVariant(item.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-medium capitalize border transition flex items-center justify-center cursor-pointer ${
                        layoutVariant === item.id
                          ? "border-ink-900 bg-ink-900 text-surface-white font-semibold shadow-sm"
                          : "border-ink-900/10 text-ink-800/70 hover:bg-surface-light"
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rotator & Spotlight specific settings */}
              {(layoutVariant === "rotator" || layoutVariant === "spotlight") && (
                <div className="p-3 bg-surface-light/60 rounded-xl border border-ink-900/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-semibold text-ink-900 flex items-center gap-1">
                      <Play className="w-3.5 h-3.5 text-ink-800" />
                      <span>Auto-Rotate Interval</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-ink-900">
                      {autoRotateInterval}s (Pause on hover)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={15}
                    step={1}
                    value={autoRotateInterval}
                    onChange={(e) => setAutoRotateInterval(Number(e.target.value))}
                    className="w-full h-1.5 bg-ink-900/10 rounded-lg appearance-none cursor-pointer accent-ink-900"
                  />
                </div>
              )}

              {/* Text Reveal Blur Animation Toggle */}
              <div className="flex items-center justify-between p-3 bg-surface-light/60 rounded-xl border border-ink-900/10">
                <div>
                  <div className="text-xs font-mono font-semibold text-ink-900">
                    Quote Blur-to-Sharp Text Reveal (React Bits)
                  </div>
                  <div className="text-[11px] text-ink-800/60 mt-0.5">
                    Restrained per-word blur & fade-in when quote becomes active (respects reduced motion)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={textReveal}
                  onChange={(e) => setTextReveal(e.target.checked)}
                  className="w-4 h-4 rounded border-ink-900 text-ink-900 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Typography Override */}
              <div>
                <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Type className="w-3.5 h-3.5 text-ink-800/60" />
                    <span>Typography Pairing</span>
                  </span>
                </label>
                <CustomSelect
                  options={[
                    { value: "Manrope", label: "Manrope (Clean Modern Sans)" },
                    { value: "Inter", label: "Inter (Neutral Precision)" },
                    { value: "Syne", label: "Syne (Bold Geometric Display)" },
                    { value: "Roboto", label: "Roboto (Classic Sans)" },
                    { value: "Outfit", label: "Outfit (High Contrast Premium)" },
                  ]}
                  value={fontPairing}
                  onChange={(val) => setFontPairing(val as any)}
                />
              </div>

              {/* Accent Color Picker */}
              <div>
                <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-ink-800/60" />
                    <span>Widget Accent Color</span>
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
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
                {(() => {
                  const safeHex = accentColor.startsWith("#") ? accentColor : "#2D2D2D";
                  const ratio = getContrastRatio(safeHex, previewTheme === "dark" ? "#1A1A1D" : "#FFFFFF");
                  if (ratio < 3.0) {
                    return (
                      <div className="mt-2.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-900 flex items-center gap-2 font-sans">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>
                          <strong>Low Contrast Warning:</strong> Accent color ({accentColor}) has a {ratio.toFixed(1)}:1 contrast ratio against {previewTheme === "dark" ? "dark" : "light"} background.
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Custom CSS Injection & Discoverable Cheat Sheet */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5 text-ink-800/60" />
                    <span>Scoped Custom CSS (Advanced)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCssCheatSheetOpen(!cssCheatSheetOpen)}
                    className="text-[11px] font-mono text-ink-900 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{cssCheatSheetOpen ? "Hide Class API" : "Available CSS Classes"}</span>
                  </button>
                </div>

                {cssCheatSheetOpen && (
                  <div className="p-3 bg-surface-light border border-ink-900/10 rounded-xl space-y-2 text-xs">
                    <div className="font-mono font-bold text-[11px] text-ink-900 uppercase">
                      Stable CSS Target Selectors:
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {cssClassList.map((item) => (
                        <div key={item.name} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-[11px] py-1 border-b border-ink-900/5">
                          <code className="font-mono font-semibold text-ink-900 bg-surface-white px-1.5 py-0.5 rounded border border-ink-900/10">
                            {item.name}
                          </code>
                          <span className="text-ink-800/70 text-[10px]">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  rows={3}
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  placeholder=".clientecho-card { border-width: 2px; }&#10;.clientecho-quote { font-style: italic; }"
                  className="w-full px-3.5 py-2 border border-ink-900/20 rounded-xl text-xs font-mono focus:outline-none focus:border-ink-900 placeholder:text-ink-800/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3.5 bg-ink-900 hover:bg-ink-800 text-surface-white font-display font-semibold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-ink-900" />
              <span>Live Instant Preview</span>
            </h2>

            <div className="flex items-center gap-2">
              {/* Replay Animation Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setReplayCount((c) => c + 1);
                  showToast("Replaying animation...", "info");
                }}
                title="Trigger and replay active layout & text-reveal transitions"
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-surface-white border border-ink-900/15 hover:bg-surface-light text-ink-900 shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3 h-3 text-ink-900 fill-ink-900" />
                <span>Replay animation</span>
              </button>

              {/* Preview Light / Dark Mode Toggle */}
              <div className="flex items-center bg-surface-light border border-ink-900/10 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewTheme("light")}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition flex items-center gap-1 cursor-pointer ${
                    previewTheme === "light"
                      ? "bg-surface-white text-ink-900 shadow-xs"
                      : "text-ink-800/60 hover:text-ink-900"
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme("dark")}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition flex items-center gap-1 cursor-pointer ${
                    previewTheme === "dark"
                      ? "bg-ink-900 text-surface-white shadow-xs"
                      : "text-ink-800/60 hover:text-ink-900"
                  }`}
                >
                  <Moon className="w-3 h-3" />
                  <span>Dark</span>
                </button>
              </div>

              <span className="text-[10px] font-mono uppercase bg-surface-light border border-ink-800/20 text-ink-800 px-2 py-1 rounded">
                {layoutVariant}
              </span>
            </div>
          </div>

          {/* Rendered Live Preview using full WidgetDisplayClient with seeded samples */}
          <div className="bg-surface-light/60 p-4 sm:p-6 rounded-3xl border border-ink-900/10 min-h-[380px] flex flex-col justify-center transition-all duration-300 overflow-hidden">
            <WidgetDisplayClient
              widget={previewWidgetConfig}
              testimonials={sampleTestimonials}
              initialTheme={previewTheme}
              replayKey={replayCount}
            />
          </div>

          {/* Host Page Live Dark Mode Sync Documentation */}
          <div className="bg-surface-white p-5 rounded-2xl border border-ink-900/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-ink-900" />
                <h3 className="font-display text-xs font-bold text-ink-900 uppercase tracking-wider">
                  Host Site Dark Mode Sync
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopySyncSnippet}
                className="text-[11px] font-mono text-ink-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedSyncSnippet ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSyncSnippet ? "Copied!" : "Copy Snippet"}</span>
              </button>
            </div>
            <p className="text-xs text-ink-800/70 leading-relaxed">
              If your host site has its own manual theme toggle, trigger this postMessage whenever your theme switches to update the embedded widget live:
            </p>
            <pre className="bg-ink-900 text-surface-white p-3 rounded-xl font-mono text-[11px] overflow-x-auto border border-ink-800">
              {hostSyncSnippet}
            </pre>
          </div>

          {/* Active Widgets Embed List */}
          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-ink-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-ink-900" />
              <span>Active Embed Codes</span>
            </h3>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-surface-white p-6 rounded-2xl border border-ink-900/10 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <SkeletonBlock className="w-40 h-5 rounded-md" />
                        <SkeletonBlock className="w-48 h-3 rounded-md" />
                      </div>
                      <SkeletonBlock className="w-24 h-9 rounded-xl" />
                    </div>
                    <SkeletonBlock className="w-full h-16 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : widgets.length === 0 ? (
              <div className="bg-surface-white p-6 rounded-2xl border border-ink-900/10 text-center text-xs text-ink-800/60 italic">
                Save your first widget configuration above to generate embed script tags!
              </div>
            ) : (
              widgets.map((widget) => (
                <div
                  key={widget.id}
                  className={`bg-ink-900 text-surface-white p-5 rounded-2xl shadow-sm space-y-3 border transition ${
                    editingWidgetId === widget.id ? "border-emerald-500 ring-1 ring-emerald-500" : "border-ink-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-surface-white text-sm">
                          {widget.name}
                        </h4>
                        {editingWidgetId === widget.id && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                            Editing
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-surface-white/60 font-mono">
                        slug: {widget.slug}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadWidgetToEdit(widget)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-surface-white/10 hover:bg-surface-white/20 text-surface-white rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(widget.slug, widget.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-white text-ink-900 hover:bg-surface-light rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        {copiedId === widget.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === widget.id ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  <pre className="bg-ink-800 p-3 rounded-xl font-mono text-[11px] text-surface-white/90 overflow-x-auto border border-surface-white/10 whitespace-pre-wrap">
                    {getEmbedCode(widget.slug, widget.themeConfig?.defaultTheme)}
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
