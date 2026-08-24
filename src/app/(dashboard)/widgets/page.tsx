"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
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
  LayoutGrid,
  ShieldCheck,
  Star,
  User,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  MoveHorizontal,
  RotateCw,
  Monitor,
  Tablet,
  Smartphone,
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

// CSS Helper functions for two-way synchronization between visual editor and customCss textarea
function getDarkSelector(selector: string): string {
  return `.clientecho-theme-dark ${selector}, [data-theme="dark"] ${selector}`;
}

function getCssDeclarationsForSelector(css: string, selector: string): Record<string, string> {
  const escapedSelector = selector
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/,\s*/g, ",\\s*");
  const regex = new RegExp(`(?:^|\\})\\s*(${escapedSelector})\\s*\\{([^}]*)\\}`, "i");
  const match = css.match(regex);
  if (!match || !match[2]) return {};

  const decls: Record<string, string> = {};
  const lines = match[2].split(";");
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const prop = line.slice(0, colonIdx).trim().toLowerCase();
      const val = line.slice(colonIdx + 1).trim();
      if (prop && val) {
        decls[prop] = val;
      }
    }
  }
  return decls;
}

function setCssDeclarationsForSelector(
  css: string,
  selector: string,
  updates: Record<string, string | null | undefined>
): string {
  const escapedSelector = selector
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/,\s*/g, ",\\s*");
  const regex = new RegExp(`(${escapedSelector}\\s*\\{)([^}]*)(\\})`, "i");
  const match = css.match(regex);

  const currentDecls = getCssDeclarationsForSelector(css, selector);
  const newDecls = { ...currentDecls };

  for (const [prop, val] of Object.entries(updates)) {
    if (val === null || val === undefined || val === "") {
      delete newDecls[prop.toLowerCase()];
    } else {
      newDecls[prop.toLowerCase()] = val;
    }
  }

  const declEntries = Object.entries(newDecls);
  if (declEntries.length === 0) {
    if (match) {
      return css.replace(regex, "").trim();
    }
    return css;
  }

  const serializedBody = declEntries
    .map(([p, v]) => `  ${p}: ${v};`)
    .join("\n");

  if (match) {
    return css.replace(regex, `${selector} {\n${serializedBody}\n}`);
  } else {
    const trimmed = css.trim();
    return trimmed.length > 0
      ? `${trimmed}\n\n${selector} {\n${serializedBody}\n}`
      : `${selector} {\n${serializedBody}\n}`;
  }
}

// Reusable Compact Theme-Aware Color Field (Linear / Figma Studio Inspector Style)
function ThemeAwareColorField({
  label,
  selector,
  property,
  defaultLight = "#2D2D2D",
  defaultDark = "#F3F3EF",
  customCss,
  onUpdate,
}: {
  label: string;
  selector: string;
  property: string;
  defaultLight?: string;
  defaultDark?: string;
  customCss: string;
  onUpdate: (nextCss: string) => void;
}) {
  const darkSelector = getDarkSelector(selector);
  const lightDecls = getCssDeclarationsForSelector(customCss, selector);
  const darkDecls = getCssDeclarationsForSelector(customCss, darkSelector);

  const lightVal = lightDecls[property] || "";
  const darkVal = darkDecls[property] || "";

  const [isSplit, setIsSplit] = useState(Boolean(darkVal));

  const handleLightChange = (val: string | null) => {
    let nextCss = setCssDeclarationsForSelector(customCss, selector, { [property]: val });
    if (!isSplit && darkVal) {
      nextCss = setCssDeclarationsForSelector(nextCss, darkSelector, { [property]: null });
    }
    onUpdate(nextCss);
  };

  const handleDarkChange = (val: string | null) => {
    const nextCss = setCssDeclarationsForSelector(customCss, darkSelector, { [property]: val });
    onUpdate(nextCss);
  };

  const handleToggleSplit = (split: boolean) => {
    setIsSplit(split);
    if (!split && darkVal) {
      const nextCss = setCssDeclarationsForSelector(customCss, darkSelector, { [property]: null });
      onUpdate(nextCss);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-1.5">
        <label className="text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider truncate">
          {label}
        </label>
        <div className="flex items-center bg-surface-light border border-ink-900/10 p-0.5 rounded-md text-[9px] font-mono shrink-0">
          <button
            type="button"
            onClick={() => handleToggleSplit(false)}
            className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
              !isSplit
                ? "bg-surface-white text-ink-900 font-semibold shadow-2xs"
                : "text-ink-800/60 hover:text-ink-900"
            }`}
          >
            Unified
          </button>
          <button
            type="button"
            onClick={() => handleToggleSplit(true)}
            className={`px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-0.5 ${
              isSplit
                ? "bg-ink-900 text-surface-white font-semibold shadow-2xs"
                : "text-ink-800/60 hover:text-ink-900"
            }`}
          >
            <span>Light/Dark</span>
          </button>
        </div>
      </div>

      {!isSplit ? (
        <div className="flex items-center gap-1.5">
          <div className="relative w-6 h-6 rounded border border-ink-900/20 overflow-hidden shrink-0 shadow-2xs group cursor-pointer">
            <input
              type="color"
              value={lightVal || defaultLight}
              onChange={(e) => handleLightChange(e.target.value)}
              className="absolute -inset-2 w-10 h-10 cursor-pointer opacity-0"
            />
            <div
              className="w-full h-full"
              style={{ backgroundColor: lightVal || defaultLight }}
            />
          </div>
          <input
            type="text"
            value={lightVal}
            onChange={(e) => handleLightChange(e.target.value)}
            placeholder={defaultLight}
            className="flex-1 min-w-0 px-2 py-1 border border-ink-900/15 rounded-md text-xs font-mono bg-surface-white text-ink-900 focus:outline-none focus:border-ink-900 placeholder:text-ink-800/30"
          />
          {lightVal && (
            <button
              type="button"
              onClick={() => handleLightChange(null)}
              className="text-[10px] font-mono text-ink-800/40 hover:text-rose-600 px-1 py-0.5 transition cursor-pointer"
              title="Reset property"
            >
              Reset
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex items-center gap-1 bg-surface-light/50 p-1 rounded-md border border-ink-900/5">
            <div className="relative w-5 h-5 rounded border border-ink-900/15 overflow-hidden shrink-0">
              <input
                type="color"
                value={lightVal || defaultLight}
                onChange={(e) => handleLightChange(e.target.value)}
                className="absolute -inset-2 w-8 h-8 cursor-pointer opacity-0"
              />
              <div
                className="w-full h-full"
                style={{ backgroundColor: lightVal || defaultLight }}
              />
            </div>
            <input
              type="text"
              value={lightVal}
              onChange={(e) => handleLightChange(e.target.value)}
              placeholder={`L: ${defaultLight}`}
              className="flex-1 min-w-0 px-1.5 py-0.5 rounded text-[11px] font-mono bg-surface-white border border-ink-900/10 text-ink-900 focus:outline-none focus:border-ink-900 placeholder:text-ink-800/30"
            />
          </div>

          <div className="flex items-center gap-1 bg-ink-900/5 p-1 rounded-md border border-ink-900/5">
            <div className="relative w-5 h-5 rounded border border-ink-900/15 overflow-hidden shrink-0">
              <input
                type="color"
                value={darkVal || defaultDark}
                onChange={(e) => handleDarkChange(e.target.value)}
                className="absolute -inset-2 w-8 h-8 cursor-pointer opacity-0"
              />
              <div
                className="w-full h-full"
                style={{ backgroundColor: darkVal || defaultDark }}
              />
            </div>
            <input
              type="text"
              value={darkVal}
              onChange={(e) => handleDarkChange(e.target.value)}
              placeholder={`D: ${defaultDark}`}
              className="flex-1 min-w-0 px-1.5 py-0.5 rounded text-[11px] font-mono bg-surface-white border border-ink-900/10 text-ink-900 focus:outline-none focus:border-ink-900 placeholder:text-ink-800/30"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface WidgetItem {
  id: string;
  name: string;
  slug: string;
  themeConfig: Record<string, any>;
  isActive: boolean;
}

// Authentic client testimonials describing real experiences
const sampleTestimonials = [
  {
    id: "sample-1",
    authorName: "Sarah Jenkins",
    authorTitle: "Founder at Acme Studio",
    content: "Working with Sarah on our brand revamp was effortless. She captured the exact tone we needed on the first draft and delivered a week ahead of schedule.",
    rating: 5,
    source: "magic_link" as const,
    isImportedSelfReported: false,
  },
  {
    id: "sample-2",
    authorName: "Marcus Chen",
    authorTitle: "Head of Product at LinearFlow",
    content: "Marcus helped us restructure our onboarding UX. Our team saw an immediate 28% drop in churn, and new signups consistently compliment how clean the interface feels.",
    rating: 5,
    source: "magic_link" as const,
    isImportedSelfReported: false,
  },
  {
    id: "sample-3",
    authorName: "Elena Rostova",
    authorTitle: "Design Director at Prisma Lab",
    content: "Elena turned our fragmented component library into a crisp, unified design system in under a month. High velocity, zero fluff, and exceptional craftsmanship.",
    rating: 5,
    source: "manual_import" as const,
    isImportedSelfReported: true,
  },
  {
    id: "sample-4",
    authorName: "David Vance",
    authorTitle: "CTO at Nexus Cloud",
    content: "The architectural advice and API optimizations provided saved our backend months of costly technical debt. Truly world-class execution from start to finish.",
    rating: 5,
    source: "public_form" as const,
    isImportedSelfReported: false,
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
  const [upgradeDescription, setUpgradeDescription] = useState("Unlock unlimited widgets, custom typography, layout variants, and bulk approvals.");

  // Collapsible Sections State
  const [starterOpen, setStarterOpen] = useState(true);
  const [noCodeOpen, setNoCodeOpen] = useState(true);
  const [styleEditorOpen, setStyleEditorOpen] = useState(true);
  const [activeElementEditor, setActiveElementEditor] = useState<string | null>(".clientecho-card");
  const [badgeVariantTarget, setBadgeVariantTarget] = useState<string>(".clientecho-badge");

  // Core Configuration State (Default cardStyle: border)
  const [name, setName] = useState("Default Portfolio Widget");
  const [slug, setSlug] = useState(() => generateRandomSlug());
  const [cardStyle, setCardStyle] = useState<"border" | "minimal" | "glass" | "transparent" | "outline">("border");
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

  // Typography, Layout & Motion State
  const [fontPairing, setFontPairing] = useState<"Syne" | "Manrope" | "Inter" | "Roboto" | "Outfit">("Manrope");
  const [layoutVariant, setLayoutVariant] = useState<"grid" | "carousel" | "rotator" | "marquee" | "spotlight" | "stacked_deck" | "orbit_avatars">("grid");
  const [customCss, setCustomCss] = useState("");
  const [marqueeSpeed, setMarqueeSpeed] = useState(35); // seconds per full cycle

  // Sizing & Theme Settings
  const [borderRadius, setBorderRadius] = useState(16); // 0px to 32px
  const [paddingDensity, setPaddingDensity] = useState<"compact" | "comfortable" | "spacious">("comfortable");
  const [shadowIntensity, setShadowIntensity] = useState<"none" | "subtle" | "pronounced">("subtle");
  const [sizePreset, setSizePreset] = useState<"compact" | "standard" | "large" | "full" | "custom">("standard");
  const [customMaxWidth, setCustomMaxWidth] = useState("");
  const [defaultTheme, setDefaultTheme] = useState<"light" | "dark" | "auto">("light");
  const [textReveal, setTextReveal] = useState(false);
  const [autoRotateInterval, setAutoRotateInterval] = useState(6);

  // Live Preview Theme Switcher & Replay State
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark" | "auto">("light");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
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

    // Client-side pre-validation for Workspace limits (3 active widgets on free tier)
    if (widgets.length >= 3 && !widgets.some((w) => w.slug === slug)) {
      triggerUpgrade(
        "Unlimited Active Widgets",
        "Workspace Limit Reached (3/3 Widgets)",
        "Your workspace has reached the limit of 3 active widgets. Upgrade to Pro to create unlimited widgets or edit your existing widgets."
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
            marqueeSpeed,
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
          "Upgrade to Pro Workspace to save custom fonts, layout variants, and unlimited CSS."
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
    if (cfg.layoutVariant) setLayoutVariant(cfg.layoutVariant);
    if (cfg.customCss !== undefined) setCustomCss(cfg.customCss);
    if (cfg.borderRadius !== undefined) setBorderRadius(Number(cfg.borderRadius) || 16);
    if (cfg.paddingDensity) setPaddingDensity(cfg.paddingDensity);
    if (cfg.shadowIntensity) setShadowIntensity(cfg.shadowIntensity);
    if (cfg.sizePreset) setSizePreset(cfg.sizePreset);
    if (cfg.customMaxWidth) setCustomMaxWidth(String(cfg.customMaxWidth));
    if (cfg.defaultTheme) {
      setDefaultTheme(cfg.defaultTheme);
      setPreviewTheme(cfg.defaultTheme);
    }
    if (cfg.textReveal !== undefined) setTextReveal(Boolean(cfg.textReveal));
    if (cfg.autoRotateInterval) setAutoRotateInterval(Number(cfg.autoRotateInterval) || 6);
    if (cfg.marqueeSpeed) setMarqueeSpeed(Number(cfg.marqueeSpeed) || 35);

    setSlugStatus({
      checking: false,
      available: true,
      message: `"${widget.slug}" is your active widget URL.`,
      isOwner: true,
    });
    showToast(`Loaded "${widget.name}" into editor`, "info");
  };

  const handleNewWidget = () => {
    if (widgets.length >= 3) {
      triggerUpgrade(
        "Unlimited Active Widgets",
        "Workspace Limit Reached (3/3 Widgets)",
        "Your workspace has reached the limit of 3 active widgets. Upgrade to Pro to create unlimited custom widgets for your clients and websites."
      );
      return;
    }
    const newSlug = generateRandomSlug();
    setName("New Testimonial Widget");
    setSlug(newSlug);
    setEditingWidgetId(null);
    setCardStyle("border");
    setShowRating(true);
    setShowAvatar(true);
    setFontPairing("Manrope");
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
    setMarqueeSpeed(35);
    setSlugStatus({ checking: false, available: null, message: "" });
    showToast("Ready to configure new widget", "info");
  };

  const getEmbedCode = (widgetSlug: string, themeVal?: string) => {
    let origin = typeof window !== "undefined" ? window.location.origin : "https://client-echo-web.vercel.app";
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      origin = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_APP_URL
        : "https://client-echo-web.vercel.app";
    }
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

  // List of styled elements for the interactive per-element editor (context-aware based on layoutVariant)
  const elementEditorList = useMemo(() => {
    const list = [
      {
        id: ".clientecho-card",
        name: "Card Container",
        selector: ".clientecho-card",
        desc: "Outer testimonial card background, borders, radius, and shadows",
        icon: LayoutGrid,
      },
      {
        id: ".clientecho-quote",
        name: "Quote Text",
        selector: ".clientecho-quote",
        desc: "Typography, font size, italic style, text color, and line height",
        icon: Type,
      },
      {
        id: ".clientecho-author-name",
        name: "Author Name",
        selector: ".clientecho-author-name",
        desc: "Reviewer full name size, font weight, and color",
        icon: User,
      },
      {
        id: ".clientecho-author-title",
        name: "Author Job Title",
        selector: ".clientecho-author-title",
        desc: "Reviewer role/company subtitle size, weight, and opacity",
        icon: User,
      },
      {
        id: ".clientecho-avatar",
        name: "Avatar Thumbnail",
        selector: ".clientecho-avatar",
        desc: "Avatar size, circle/square border radius, and outline border",
        icon: User,
      },
      {
        id: ".clientecho-badge",
        name: "Trust Verification Badges",
        selector: ".clientecho-badge",
        desc: "Per-badge coloring for Verified, Direct, and Self-Reported badges",
        icon: ShieldCheck,
      },
      {
        id: ".clientecho-stars",
        name: "Rating Stars",
        selector: ".clientecho-stars",
        desc: "Star fill color, active star highlight, and spacing",
        icon: Star,
      },
    ];

    if (layoutVariant === "orbit_avatars") {
      list.push({
        id: ".clientecho-orbit-row",
        name: "Orbit Avatar Row & Highlight",
        selector: ".clientecho-orbit-row",
        desc: "Avatar face row spacing, active highlight ring, size, and background",
        icon: Sparkles,
      });
    } else if (layoutVariant === "spotlight") {
      list.push({
        id: ".clientecho-spotlight-chips",
        name: "Reviewer Selection Chips",
        selector: ".clientecho-spotlight-chips",
        desc: "Featured reviewer chip background, active pill border, radius, and text color",
        icon: Sparkles,
      });
    } else if (layoutVariant === "carousel") {
      list.push({
        id: ".clientecho-carousel-nav",
        name: "Carousel Navigation Arrows",
        selector: ".clientecho-carousel-nav",
        desc: "Navigation button background, arrow icon color, border, and corner radius",
        icon: MoveHorizontal,
      });
    } else if (layoutVariant === "rotator") {
      list.push({
        id: ".clientecho-rotator-nav",
        name: "Rotator Navigation & Counter",
        selector: ".clientecho-rotator-nav",
        desc: "Counter text color, arrow button background, icon color, and border",
        icon: RotateCw,
      });
    }

    return list;
  }, [layoutVariant]);

  // Helper to read and write declarations for the currently active element
  const getDecls = (selector: string) => getCssDeclarationsForSelector(customCss, selector);
  const updateDecls = (selector: string, updates: Record<string, string | null | undefined>) => {
    const nextCss = setCssDeclarationsForSelector(customCss, selector, updates);
    setCustomCss(nextCss);
  };

  // Construct current preview widget configuration object
  const previewWidgetConfig = useMemo(() => ({
    id: editingWidgetId || "preview-widget",
    slug: slug || "preview-widget",
    name: name || "Preview Widget",
    themeConfig: {
      cardStyle,
      showRating,
      showAvatar,
      fontPairing,
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
      marqueeSpeed,
    },
  }), [
    editingWidgetId,
    slug,
    name,
    cardStyle,
    showRating,
    showAvatar,
    fontPairing,
    layoutVariant,
    customCss,
    borderRadius,
    paddingDensity,
    shadowIntensity,
    sizePreset,
    customMaxWidth,
    previewTheme,
    textReveal,
    autoRotateInterval,
    marqueeSpeed,
  ]);

  return (
    <div className="space-y-8 font-sans">
      <div className="border-b border-ink-900/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Widget Customizer</h1>
          <p className="text-ink-800/70 text-sm mt-1">
            Configure real-time styling, dark/light themes, per-element CSS rules, layout formats, and grab sandboxed embed code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-surface-white border border-ink-900/10 text-ink-900 font-semibold shadow-xs">
            Workspace Limit: {widgets.length} / 3 Active Widgets
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
              <LayoutGrid className="w-5 h-5 text-ink-900" />
              <span>{editingWidgetId ? "Edit Widget Configuration" : "Widget Configuration"}</span>
            </h2>
            {editingWidgetId && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 rounded font-semibold">
                Editing Existing
              </span>
            )}
          </div>

          <form onSubmit={handleSaveWidget} className="space-y-6">
            {/* Section 1: Core Identity & Cards */}
            <div className="border border-ink-900/10 rounded-2xl overflow-hidden bg-surface-light/40">
              <button
                type="button"
                onClick={() => setStarterOpen(!starterOpen)}
                className="w-full p-4 flex items-center justify-between font-mono font-bold text-xs uppercase tracking-wider text-ink-900 hover:bg-surface-light transition text-left cursor-pointer"
              >
                <span>1. Core Identity & Card Styles</span>
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

                  {/* Card Presentation Styles with 5 real options */}
                  <div>
                    <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1.5">
                      Card Presentation Style
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: "border", label: "Border", desc: "Solid filled card with border" },
                        { id: "minimal", label: "Minimal", desc: "Soft filled card, no border" },
                        { id: "glass", label: "Glass", desc: "Translucent backdrop blur" },
                        { id: "transparent", label: "Transparent", desc: "No fill, border, or shadow" },
                        { id: "outline", label: "Outline", desc: "Thin border, no fill or shadow" },
                      ].map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setCardStyle(style.id as any)}
                          title={style.desc}
                          className={`py-2 px-2 rounded-xl text-xs font-medium capitalize border transition flex flex-col items-center justify-center text-center cursor-pointer ${
                            cardStyle === style.id
                              ? "border-ink-900 bg-ink-900 text-surface-white font-semibold shadow-sm"
                              : "border-ink-900/10 text-ink-800/70 hover:bg-surface-light"
                          }`}
                        >
                          <span>{style.label}</span>
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

            {/* Section 2: Sizing, Theme & Presets */}
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
                            setPreviewTheme(t);
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

                  {/* Shadow Elevation */}
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

            {/* Section 3: Layout Variety & Motion */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-ink-900/10">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900 flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-ink-900" />
                  <span>3. Layout Variety & Motion</span>
                </div>
                <span className="text-[10px] font-mono font-medium uppercase px-2 py-0.5 bg-surface-light border border-ink-900/10 text-ink-800 rounded">
                  7 Layout Formats
                </span>
              </div>

              {/* Layout Format Variety with Stacked Deck & Orbit Avatars */}
              <div>
                <label className="block text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider mb-1.5">
                  Layout Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "grid", label: "Grid" },
                    { id: "carousel", label: "Carousel" },
                    { id: "rotator", label: "Rotator" },
                    { id: "marquee", label: "Marquee" },
                    { id: "spotlight", label: "Spotlight" },
                    { id: "stacked_deck", label: "Stacked Deck" },
                    { id: "orbit_avatars", label: "Orbit Avatars" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLayoutVariant(item.id as any)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-medium capitalize border transition flex items-center justify-center text-center cursor-pointer ${
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

              {/* Rotator, Spotlight & Stacked Deck specific settings */}
              {(layoutVariant === "rotator" || layoutVariant === "spotlight" || layoutVariant === "stacked_deck") && (
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

              {/* Marquee Speed Control with Presets + Fine-Tune Slider */}
              {layoutVariant === "marquee" && (
                <div className="p-3.5 bg-surface-light/60 rounded-xl border border-ink-900/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-semibold text-ink-900 flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-ink-800" />
                      <span>Marquee Scroll Speed</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-ink-900">
                      {marqueeSpeed}s cycle
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Slow", speed: 45 },
                      { label: "Medium", speed: 30 },
                      { label: "Fast", speed: 16 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setMarqueeSpeed(preset.speed)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold border transition cursor-pointer ${
                          marqueeSpeed === preset.speed
                            ? "bg-ink-900 text-surface-white border-ink-900 shadow-xs"
                            : "bg-surface-white border-ink-900/10 text-ink-800/80 hover:bg-surface-light"
                        }`}
                      >
                        {preset.label} ({preset.speed}s)
                      </button>
                    ))}
                  </div>

                  <div>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      step={2}
                      value={marqueeSpeed}
                      onChange={(e) => setMarqueeSpeed(Number(e.target.value))}
                      className="w-full h-1.5 bg-ink-900/10 rounded-lg appearance-none cursor-pointer accent-ink-900"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-ink-800/50 mt-1">
                      <span>Fast (10s)</span>
                      <span>Balanced (30s)</span>
                      <span>Slow (60s)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Text Reveal Blur Animation Toggle */}
              <div className="flex items-center justify-between p-3 bg-surface-light/60 rounded-xl border border-ink-900/10">
                <div>
                  <div className="text-xs font-mono font-semibold text-ink-900">
                    Quote Blur-to-Sharp Text Reveal
                  </div>
                  <div className="text-[11px] text-ink-800/60 mt-0.5">
                    Restrained per-word blur & fade-in when quote becomes active
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
            </div>

            {/* Section 4: Interactive Per-Element Style Editor & Scoped Custom CSS */}
            <div className="border border-ink-900/10 rounded-2xl overflow-hidden bg-surface-light/40 space-y-0">
              <button
                type="button"
                onClick={() => setStyleEditorOpen(!styleEditorOpen)}
                className="w-full p-4 flex items-center justify-between font-mono font-bold text-xs uppercase tracking-wider text-ink-900 hover:bg-surface-light transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-ink-900" />
                  <span>4. Interactive Per-Element Style Editor</span>
                </div>
                {styleEditorOpen ? <ChevronUp className="w-4 h-4 text-ink-800/60" /> : <ChevronDown className="w-4 h-4 text-ink-800/60" />}
              </button>

              {styleEditorOpen && (
                <div className="p-4 pt-0 space-y-4 border-t border-ink-900/5 bg-surface-white">
                  <p className="text-xs text-ink-800/70 pt-2 leading-relaxed">
                    Click any element below to customize its specific properties visually. Changes immediately write clean CSS rules and update the Live Preview.
                  </p>

                  {/* Element Accordion List */}
                  <div className="space-y-2">
                    {elementEditorList.map((elem) => {
                      const isOpen = activeElementEditor === elem.id;
                      const Icon = elem.icon;
                      const currentDecls = getDecls(elem.id);
                      const ruleCount = Object.keys(currentDecls).length;

                      return (
                        <div
                          key={elem.id}
                          className="border border-ink-900/10 rounded-xl overflow-hidden bg-surface-light/30 transition"
                        >
                          <button
                            type="button"
                            onClick={() => setActiveElementEditor(isOpen ? null : elem.id)}
                            className="w-full p-3 flex items-center justify-between hover:bg-surface-light/70 transition cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-surface-white border border-ink-900/10 flex items-center justify-center text-ink-900 shrink-0">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-ink-900 truncate">
                                    {elem.name}
                                  </span>
                                  <code className="text-[10px] font-mono bg-surface-white px-1.5 py-0.2 rounded border border-ink-900/10 text-ink-800/70">
                                    {elem.selector}
                                  </code>
                                </div>
                                <p className="text-[11px] text-ink-800/60 truncate mt-0.5">
                                  {elem.desc}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              {ruleCount > 0 && (
                                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 rounded-full font-semibold">
                                  {ruleCount} {ruleCount === 1 ? "rule" : "rules"}
                                </span>
                              )}
                              {isOpen ? (
                                <ChevronUp className="w-4 h-4 text-ink-800/60" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-ink-800/60" />
                              )}
                            </div>
                          </button>

                          {/* Specific Tailored Property Form for each element */}
                          {isOpen && (
                            <div className="p-3.5 pt-2 border-t border-ink-900/5 bg-surface-white space-y-3.5">
                              {/* 1. .clientecho-card Properties */}
                              {elem.id === ".clientecho-card" && (
                                <div className="space-y-2.5">
                                  <ThemeAwareColorField
                                    label="Card Background Fill"
                                    selector=".clientecho-card"
                                    property="background-color"
                                    defaultLight="#FFFFFF"
                                    defaultDark="#232326"
                                    customCss={customCss}
                                    onUpdate={(css) => setCustomCss(css)}
                                  />

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                                    <ThemeAwareColorField
                                      label="Border Outline Color"
                                      selector=".clientecho-card"
                                      property="border-color"
                                      defaultLight="#E5E7EB"
                                      defaultDark="rgba(255, 255, 255, 0.08)"
                                      customCss={customCss}
                                      onUpdate={(css) => {
                                        const currentCardDecls = getCssDeclarationsForSelector(css, ".clientecho-card");
                                        if (!currentCardDecls["border-style"]) {
                                          css = setCssDeclarationsForSelector(css, ".clientecho-card", {
                                            "border-style": "solid",
                                          });
                                        }
                                        setCustomCss(css);
                                      }}
                                    />

                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Border Width
                                      </label>
                                      <div className="grid grid-cols-4 gap-1">
                                        {["0px", "1px", "2px", "3px"].map((bw) => (
                                          <button
                                            key={bw}
                                            type="button"
                                            onClick={() => {
                                              const nextWidth = currentDecls["border-width"] === bw ? null : bw;
                                              updateDecls(".clientecho-card", {
                                                "border-width": nextWidth,
                                                ...(nextWidth && nextWidth !== "0px" ? { "border-style": "solid" } : {}),
                                              });
                                            }}
                                            className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                              currentDecls["border-width"] === bw
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {bw}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Corner Radius
                                      </label>
                                      <div className="grid grid-cols-4 gap-1">
                                        {["0px", "8px", "16px", "24px"].map((br) => (
                                          <button
                                            key={br}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-card", { "border-radius": currentDecls["border-radius"] === br ? null : br })}
                                            className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                              currentDecls["border-radius"] === br
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {br}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Box Shadow Depth
                                      </label>
                                      <div className="grid grid-cols-3 gap-1">
                                        {[
                                          { label: "None", val: "none" },
                                          { label: "Subtle", val: "0 4px 14px rgba(0,0,0,0.08)" },
                                          { label: "Deep", val: "0 12px 30px rgba(0,0,0,0.18)" },
                                        ].map((sh) => (
                                          <button
                                            key={sh.label}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-card", { "box-shadow": currentDecls["box-shadow"] === sh.val ? null : sh.val })}
                                            className={`py-1 rounded-md text-[11px] font-medium transition cursor-pointer border ${
                                              currentDecls["box-shadow"] === sh.val
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {sh.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 2. .clientecho-quote Properties */}
                              {elem.id === ".clientecho-quote" && (
                                <div className="space-y-2.5">
                                  {/* Row 1: Font Size & Weight */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Font Size
                                      </label>
                                      <div className="grid grid-cols-5 gap-1">
                                        {["12px", "14px", "16px", "18px", "20px"].map((fs) => (
                                          <button
                                            key={fs}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-quote", { "font-size": currentDecls["font-size"] === fs ? null : fs })}
                                            className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                              currentDecls["font-size"] === fs
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {fs}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Font Weight
                                      </label>
                                      <div className="grid grid-cols-4 gap-1">
                                        {[
                                          { label: "Regular", val: "400" },
                                          { label: "Medium", val: "500" },
                                          { label: "Semi", val: "600" },
                                          { label: "Bold", val: "700" },
                                        ].map((fw) => (
                                          <button
                                            key={fw.val}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-quote", { "font-weight": currentDecls["font-weight"] === fw.val ? null : fw.val })}
                                            className={`py-1 rounded-md text-[11px] font-medium transition cursor-pointer border ${
                                              currentDecls["font-weight"] === fw.val
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {fw.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Row 2: Font Style, Line Height & Alignment */}
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Style
                                      </label>
                                      <div className="grid grid-cols-2 gap-1">
                                        {[
                                          { label: "Normal", val: "normal" },
                                          { label: "Italic", val: "italic" },
                                        ].map((st) => (
                                          <button
                                            key={st.val}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-quote", { "font-style": currentDecls["font-style"] === st.val ? null : st.val })}
                                            className={`py-1 rounded-md text-[11px] font-medium transition cursor-pointer border ${
                                              currentDecls["font-style"] === st.val
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {st.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Line Height
                                      </label>
                                      <div className="grid grid-cols-3 gap-1">
                                        {["1.4", "1.6", "1.8"].map((lh) => (
                                          <button
                                            key={lh}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-quote", { "line-height": currentDecls["line-height"] === lh ? null : lh })}
                                            className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                              currentDecls["line-height"] === lh
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {lh}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Align
                                      </label>
                                      <div className="grid grid-cols-3 gap-1">
                                        {[
                                          { label: "Left", val: "left" },
                                          { label: "Center", val: "center" },
                                          { label: "Right", val: "right" },
                                        ].map((al) => (
                                          <button
                                            key={al.val}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-quote", { "text-align": currentDecls["text-align"] === al.val ? null : al.val })}
                                            className={`py-1 rounded-md text-[11px] font-medium transition cursor-pointer border ${
                                              currentDecls["text-align"] === al.val
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {al.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Row 3: Quote & Mark Colors */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                                    <ThemeAwareColorField
                                      label="Quote Text Color"
                                      selector=".clientecho-quote"
                                      property="color"
                                      defaultLight="#2D2D2D"
                                      defaultDark="#F3F3EF"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />

                                    <ThemeAwareColorField
                                      label="Quotation Mark Color"
                                      selector=".clientecho-quote-mark"
                                      property="color"
                                      defaultLight="#8cff2e"
                                      defaultDark="#8cff2e"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* 3. .clientecho-author-name Properties */}
                              {elem.id === ".clientecho-author-name" && (
                                <div className="space-y-2.5">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Font Size
                                      </label>
                                      <div className="grid grid-cols-5 gap-1">
                                        {["11px", "12px", "14px", "16px", "18px"].map((fs) => (
                                          <button
                                            key={fs}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-author-name", { "font-size": currentDecls["font-size"] === fs ? null : fs })}
                                            className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                              currentDecls["font-size"] === fs
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {fs}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Font Weight
                                      </label>
                                      <div className="grid grid-cols-4 gap-1">
                                        {[
                                          { label: "Regular", val: "400" },
                                          { label: "Medium", val: "500" },
                                          { label: "Semi", val: "600" },
                                          { label: "Bold", val: "700" },
                                        ].map((fw) => (
                                          <button
                                            key={fw.val}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-author-name", { "font-weight": currentDecls["font-weight"] === fw.val ? null : fw.val })}
                                            className={`py-1 rounded-md text-[11px] font-medium transition cursor-pointer border ${
                                              currentDecls["font-weight"] === fw.val
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {fw.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-0.5">
                                    <ThemeAwareColorField
                                      label="Author Name Color"
                                      selector=".clientecho-author-name"
                                      property="color"
                                      defaultLight="#2D2D2D"
                                      defaultDark="#F3F3EF"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* 4. .clientecho-author-title Properties */}
                              {elem.id === ".clientecho-author-title" && (
                                <div className="space-y-2.5">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Font Size
                                      </label>
                                      <div className="grid grid-cols-5 gap-1">
                                        {["10px", "11px", "12px", "13px", "14px"].map((fs) => (
                                          <button
                                            key={fs}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-author-title", { "font-size": currentDecls["font-size"] === fs ? null : fs })}
                                            className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                              currentDecls["font-size"] === fs
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {fs}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Font Weight
                                      </label>
                                      <div className="grid grid-cols-4 gap-1">
                                        {[
                                          { label: "Regular", val: "400" },
                                          { label: "Medium", val: "500" },
                                          { label: "Semi", val: "600" },
                                          { label: "Bold", val: "700" },
                                        ].map((fw) => (
                                          <button
                                            key={fw.val}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-author-title", { "font-weight": currentDecls["font-weight"] === fw.val ? null : fw.val })}
                                            className={`py-1 rounded-md text-[11px] font-medium transition cursor-pointer border ${
                                              currentDecls["font-weight"] === fw.val
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {fw.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-0.5">
                                    <ThemeAwareColorField
                                      label="Title Text Color"
                                      selector=".clientecho-author-title"
                                      property="color"
                                      defaultLight="#6B7280"
                                      defaultDark="rgba(243, 243, 239, 0.65)"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* 5. .clientecho-avatar Properties */}
                              {elem.id === ".clientecho-avatar" && (
                                <div className="space-y-2.5">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Dimensions
                                      </label>
                                      <div className="grid grid-cols-4 gap-1">
                                        {["24px", "32px", "40px", "48px"].map((sz) => (
                                          <button
                                            key={sz}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-avatar", {
                                              width: currentDecls["width"] === sz ? null : sz,
                                              height: currentDecls["height"] === sz ? null : sz,
                                            })}
                                            className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                              currentDecls["width"] === sz
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {sz}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Shape
                                      </label>
                                      <div className="grid grid-cols-3 gap-1">
                                        {[
                                          { label: "Circle", val: "9999px" },
                                          { label: "Rounded", val: "8px" },
                                          { label: "Square", val: "0px" },
                                        ].map((sh) => (
                                          <button
                                            key={sh.label}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-avatar", { "border-radius": currentDecls["border-radius"] === sh.val ? null : sh.val })}
                                            className={`py-1 rounded-md text-[11px] font-medium transition cursor-pointer border ${
                                              currentDecls["border-radius"] === sh.val
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {sh.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                                    <ThemeAwareColorField
                                      label="Avatar Fill"
                                      selector=".clientecho-avatar"
                                      property="background-color"
                                      defaultLight="#2D2D2D"
                                      defaultDark="#374151"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />

                                    <ThemeAwareColorField
                                      label="Avatar Text Color"
                                      selector=".clientecho-avatar"
                                      property="color"
                                      defaultLight="#FFFFFF"
                                      defaultDark="#FFFFFF"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />
                                  </div>

                                  <div className="pt-0.5">
                                    <ThemeAwareColorField
                                      label="Avatar Border Outline"
                                      selector=".clientecho-avatar"
                                      property="border-color"
                                      defaultLight="#2D2D2D"
                                      defaultDark="rgba(255, 255, 255, 0.2)"
                                      customCss={customCss}
                                      onUpdate={(css) => {
                                        const next = setCssDeclarationsForSelector(css, ".clientecho-avatar", {
                                          "border-width": currentDecls["border-width"] || "2px",
                                          "border-style": "solid",
                                        });
                                        setCustomCss(next);
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* 6. .clientecho-badge Properties (Per-Badge Styling for all 3 variants) */}
                              {elem.id === ".clientecho-badge" && (
                                <div className="space-y-2.5">
                                  {/* Badge Variant Target Selector */}
                                  <div>
                                    <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                      Badge Target Variant
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                                      {[
                                        { id: ".clientecho-badge", label: "All Badges" },
                                        { id: ".clientecho-badge-verified", label: "Verified" },
                                        { id: ".clientecho-badge-direct", label: "Direct" },
                                        { id: ".clientecho-badge-self", label: "Self-Reported" },
                                      ].map((target) => (
                                        <button
                                          key={target.id}
                                          type="button"
                                          onClick={() => setBadgeVariantTarget(target.id)}
                                          className={`py-1 px-1.5 rounded-md text-[11px] font-medium border transition cursor-pointer text-center ${
                                            badgeVariantTarget === target.id
                                              ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                              : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                          }`}
                                        >
                                          {target.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Variant Specific Styling Form */}
                                  {(() => {
                                    const targetDecls = getDecls(badgeVariantTarget);
                                    return (
                                      <div className="p-2.5 bg-surface-light/40 rounded-lg border border-ink-900/10 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-mono font-bold text-ink-900">
                                            Styling: <code className="text-ink-900 bg-surface-white px-1 py-0.2 rounded border">{badgeVariantTarget}</code>
                                          </span>
                                          {Object.keys(targetDecls).length > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => updateDecls(badgeVariantTarget, { "background-color": null, color: null, "border-color": null, "border-radius": null })}
                                              className="text-[10px] text-rose-600 hover:underline font-mono flex items-center gap-1 cursor-pointer"
                                            >
                                              <RotateCcw className="w-3 h-3" />
                                              <span>Reset Variant</span>
                                            </button>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          <ThemeAwareColorField
                                            label="Background Fill"
                                            selector={badgeVariantTarget}
                                            property="background-color"
                                            defaultLight="#10B981"
                                            defaultDark="#059669"
                                            customCss={customCss}
                                            onUpdate={(css) => setCustomCss(css)}
                                          />

                                          <ThemeAwareColorField
                                            label="Badge Text Color"
                                            selector={badgeVariantTarget}
                                            property="color"
                                            defaultLight="#FFFFFF"
                                            defaultDark="#FFFFFF"
                                            customCss={customCss}
                                            onUpdate={(css) => setCustomCss(css)}
                                          />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                                          <ThemeAwareColorField
                                            label="Border Outline"
                                            selector={badgeVariantTarget}
                                            property="border-color"
                                            defaultLight="#2D2D2D"
                                            defaultDark="rgba(255, 255, 255, 0.2)"
                                            customCss={customCss}
                                            onUpdate={(css) => setCustomCss(css)}
                                          />

                                          <div>
                                            <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                              Corner Roundness
                                            </label>
                                            <div className="grid grid-cols-3 gap-1">
                                              {["4px", "8px", "9999px"].map((rd) => (
                                                <button
                                                  key={rd}
                                                  type="button"
                                                  onClick={() => updateDecls(badgeVariantTarget, { "border-radius": targetDecls["border-radius"] === rd ? null : rd })}
                                                  className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                                    targetDecls["border-radius"] === rd
                                                      ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                      : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                                  }`}
                                                >
                                                  {rd === "9999px" ? "Pill" : rd}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* 7. .clientecho-stars Properties */}
                              {elem.id === ".clientecho-stars" && (
                                <div className="space-y-2.5">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <ThemeAwareColorField
                                      label="Rating Star Fill Color"
                                      selector=".clientecho-stars"
                                      property="color"
                                      defaultLight="#EAB308"
                                      defaultDark="#8cff2e"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />

                                    <ThemeAwareColorField
                                      label="Star Border Outline"
                                      selector=".clientecho-stars"
                                      property="stroke"
                                      defaultLight="currentColor"
                                      defaultDark="currentColor"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                      Star Spacing
                                    </label>
                                    <div className="grid grid-cols-4 gap-1">
                                      {["2px", "4px", "6px", "8px"].map((gp) => (
                                        <button
                                          key={gp}
                                          type="button"
                                          onClick={() => updateDecls(".clientecho-stars", { gap: currentDecls["gap"] === gp ? null : gp })}
                                          className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                            currentDecls["gap"] === gp
                                              ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                              : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                          }`}
                                        >
                                          {gp}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 8. .clientecho-orbit-row Properties (Orbit Avatars Layout) */}
                              {elem.id === ".clientecho-orbit-row" && (
                                <div className="space-y-2.5">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <ThemeAwareColorField
                                      label="Active Ring Outline"
                                      selector=".clientecho-orbit-btn.clientecho-orbit-active"
                                      property="outline-color"
                                      defaultLight="#8cff2e"
                                      defaultDark="#8cff2e"
                                      customCss={customCss}
                                      onUpdate={(css) => {
                                        const next = setCssDeclarationsForSelector(css, ".clientecho-orbit-btn.clientecho-orbit-active", {
                                          "outline-style": "solid",
                                          "outline-width": "2px",
                                          "outline-offset": "2px",
                                        });
                                        setCustomCss(next);
                                      }}
                                    />

                                    <ThemeAwareColorField
                                      label="Avatar Background Fill"
                                      selector=".clientecho-orbit-avatar"
                                      property="background-color"
                                      defaultLight="#2D2D2D"
                                      defaultDark="#2D2D2D"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Avatar Spacing
                                      </label>
                                      <div className="grid grid-cols-4 gap-1">
                                        {["8px", "12px", "16px", "20px"].map((gp) => (
                                          <button
                                            key={gp}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-orbit-row", { gap: currentDecls["gap"] === gp ? null : gp })}
                                            className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                              currentDecls["gap"] === gp
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {gp}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Inactive Opacity
                                      </label>
                                      <div className="grid grid-cols-4 gap-1">
                                        {["0.4", "0.6", "0.8", "1.0"].map((op) => {
                                          const inactDecls = getDecls(".clientecho-orbit-btn.clientecho-orbit-inactive");
                                          return (
                                            <button
                                              key={op}
                                              type="button"
                                              onClick={() => updateDecls(".clientecho-orbit-btn.clientecho-orbit-inactive", { opacity: inactDecls["opacity"] === op ? null : op })}
                                              className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                                inactDecls["opacity"] === op
                                                  ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                  : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                              }`}
                                            >
                                              {op}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 9. .clientecho-spotlight-chips Properties (Spotlight Layout) */}
                              {elem.id === ".clientecho-spotlight-chips" && (
                                <div className="space-y-2.5">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <ThemeAwareColorField
                                      label="Active Chip Background"
                                      selector=".clientecho-spotlight-chip.clientecho-chip-active"
                                      property="background-color"
                                      defaultLight="rgba(0, 0, 0, 0.06)"
                                      defaultDark="rgba(255, 255, 255, 0.12)"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />

                                    <ThemeAwareColorField
                                      label="Active Chip Border"
                                      selector=".clientecho-spotlight-chip.clientecho-chip-active"
                                      property="border-color"
                                      defaultLight="#8cff2e"
                                      defaultDark="#8cff2e"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />
                                  </div>

                                  <div className="pt-0.5">
                                    <ThemeAwareColorField
                                      label="Chip Text Color"
                                      selector=".clientecho-spotlight-chip"
                                      property="color"
                                      defaultLight="#2D2D2D"
                                      defaultDark="#F3F3EF"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Chip Corner Radius
                                      </label>
                                      <div className="grid grid-cols-4 gap-1">
                                        {["4px", "8px", "16px", "9999px"].map((rd) => {
                                          const chipDecls = getDecls(".clientecho-spotlight-chip");
                                          return (
                                            <button
                                              key={rd}
                                              type="button"
                                              onClick={() => updateDecls(".clientecho-spotlight-chip", { "border-radius": chipDecls["border-radius"] === rd ? null : rd })}
                                              className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                                chipDecls["border-radius"] === rd
                                                  ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                  : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                              }`}
                                            >
                                              {rd === "9999px" ? "Pill" : rd}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                        Chips Spacing
                                      </label>
                                      <div className="grid grid-cols-4 gap-1">
                                        {["6px", "8px", "12px", "16px"].map((gp) => (
                                          <button
                                            key={gp}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-spotlight-chips", { gap: currentDecls["gap"] === gp ? null : gp })}
                                            className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                              currentDecls["gap"] === gp
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {gp}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 10. .clientecho-carousel-nav Properties (Carousel Layout) */}
                              {elem.id === ".clientecho-carousel-nav" && (
                                <div className="space-y-2.5">
                                  <ThemeAwareColorField
                                    label="Button Background Color"
                                    selector=".clientecho-carousel-btn"
                                    property="background-color"
                                    defaultLight="rgba(0, 0, 0, 0.03)"
                                    defaultDark="rgba(255, 255, 255, 0.05)"
                                    customCss={customCss}
                                    onUpdate={(css) => setCustomCss(css)}
                                  />

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                                    <ThemeAwareColorField
                                      label="Icon / Arrow Color"
                                      selector=".clientecho-carousel-btn"
                                      property="color"
                                      defaultLight="#2D2D2D"
                                      defaultDark="#F3F3EF"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />

                                    <ThemeAwareColorField
                                      label="Button Border Color"
                                      selector=".clientecho-carousel-btn"
                                      property="border-color"
                                      defaultLight="#E5E7EB"
                                      defaultDark="rgba(255, 255, 255, 0.08)"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />
                                  </div>

                                  <div className="pt-0.5">
                                    <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                      Button Corner Radius
                                    </label>
                                    <div className="grid grid-cols-4 gap-1">
                                      {["6px", "12px", "16px", "9999px"].map((rd) => {
                                        const btnDecls = getDecls(".clientecho-carousel-btn");
                                        return (
                                          <button
                                            key={rd}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-carousel-btn", { "border-radius": btnDecls["border-radius"] === rd ? null : rd })}
                                            className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                              btnDecls["border-radius"] === rd
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {rd === "9999px" ? "Round" : rd}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 11. .clientecho-rotator-nav Properties (Rotator Layout) */}
                              {elem.id === ".clientecho-rotator-nav" && (
                                <div className="space-y-2.5">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <ThemeAwareColorField
                                      label="Counter Text Color"
                                      selector=".clientecho-rotator-counter"
                                      property="color"
                                      defaultLight="#6B7280"
                                      defaultDark="rgba(243, 243, 239, 0.65)"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />

                                    <ThemeAwareColorField
                                      label="Button Background"
                                      selector=".clientecho-rotator-btn"
                                      property="background-color"
                                      defaultLight="rgba(0, 0, 0, 0.03)"
                                      defaultDark="rgba(255, 255, 255, 0.05)"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                                    <ThemeAwareColorField
                                      label="Icon / Arrow Color"
                                      selector=".clientecho-rotator-btn"
                                      property="color"
                                      defaultLight="#2D2D2D"
                                      defaultDark="#F3F3EF"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />

                                    <ThemeAwareColorField
                                      label="Button Border Color"
                                      selector=".clientecho-rotator-btn"
                                      property="border-color"
                                      defaultLight="#E5E7EB"
                                      defaultDark="rgba(255, 255, 255, 0.08)"
                                      customCss={customCss}
                                      onUpdate={(css) => setCustomCss(css)}
                                    />
                                  </div>

                                  <div className="pt-0.5">
                                    <label className="block text-[10px] font-mono font-bold text-ink-800/80 uppercase tracking-wider mb-1">
                                      Button Corner Radius
                                    </label>
                                    <div className="grid grid-cols-4 gap-1">
                                      {["6px", "12px", "16px", "9999px"].map((rd) => {
                                        const btnDecls = getDecls(".clientecho-rotator-btn");
                                        return (
                                          <button
                                            key={rd}
                                            type="button"
                                            onClick={() => updateDecls(".clientecho-rotator-btn", { "border-radius": btnDecls["border-radius"] === rd ? null : rd })}
                                            className={`py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                                              btnDecls["border-radius"] === rd
                                                ? "bg-ink-900 text-surface-white border-ink-900 font-semibold shadow-xs"
                                                : "bg-surface-white border-ink-900/10 text-ink-800 hover:bg-surface-light"
                                            }`}
                                          >
                                            {rd === "9999px" ? "Round" : rd}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Scoped Custom CSS Raw Textarea for Power Users */}
                  <div className="space-y-2 pt-2 border-t border-ink-900/10">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-semibold text-ink-800/70 uppercase tracking-wider flex items-center gap-1">
                        <Code2 className="w-3.5 h-3.5 text-ink-800/60" />
                        <span>Generated Scoped Custom CSS</span>
                      </label>
                      <span className="text-[11px] font-mono text-ink-800/50">
                        Two-way synced
                      </span>
                    </div>

                    <textarea
                      rows={4}
                      value={customCss}
                      onChange={(e) => setCustomCss(e.target.value)}
                      placeholder=".clientecho-card { border-width: 2px; }&#10;.clientecho-quote { font-style: italic; }"
                      className="w-full px-3.5 py-2 border border-ink-900/20 rounded-xl text-xs font-mono focus:outline-none focus:border-ink-900 placeholder:text-ink-800/30 bg-surface-white"
                    />

                    {/* Fixed Width Responsiveness Guardrail Warning */}
                    {/(?:^|[\s;{])(?:(?:max-)?width|min-width)\s*:\s*\d{3,}px/i.test(customCss) && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 text-xs flex items-start gap-2 font-mono">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-semibold text-amber-950">Responsiveness Warning: Fixed pixel width detected</div>
                          <div className="text-[11px] text-amber-900/80 leading-relaxed">
                            Fixed widths (e.g. <code>width: 600px;</code>) may not adapt to smaller screens — consider using <code>max-width</code>, <code>%</code>, or leaving width unset so the widget stays responsive on mobile.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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

        {/* Live Side-by-Side Preview Pane (Sticky & Smooth Viewport Centered) */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:scrollbar-none">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-ink-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-ink-900" />
              <span>Live Instant Preview</span>
            </h2>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Responsive Device Viewport Switcher */}
              <div className="flex items-center bg-surface-light border border-ink-900/10 p-0.5 rounded-lg text-[10px] font-mono">
                {[
                  { id: "desktop", label: "Desktop", icon: Monitor },
                  { id: "tablet", label: "Tablet", icon: Tablet },
                  { id: "mobile", label: "Mobile", icon: Smartphone },
                ].map((d) => {
                  const Icon = d.icon;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setPreviewDevice(d.id as any)}
                      className={`px-1.5 py-1 rounded transition flex items-center gap-1 cursor-pointer ${
                        previewDevice === d.id
                          ? "bg-surface-white text-ink-900 font-semibold shadow-2xs"
                          : "text-ink-800/60 hover:text-ink-900"
                      }`}
                      title={`Preview ${d.label} (simulated width)`}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden sm:inline text-[9px]">{d.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Replay Animation Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setReplayCount((c) => c + 1);
                  showToast("Replaying animation...", "info");
                }}
                title="Trigger and replay active layout & text-reveal transitions"
                className="px-2 py-1 rounded-lg text-[10px] font-mono font-semibold bg-surface-white border border-ink-900/15 hover:bg-surface-light text-ink-900 shadow-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3 text-ink-900 fill-ink-900" />
                <span className="hidden sm:inline">Replay</span>
              </button>

              {/* Preview Light / Dark / Auto Mode Toggle with instant sync */}
              <div className="flex items-center bg-surface-light border border-ink-900/10 p-0.5 rounded-lg">
                {(["light", "dark", "auto"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPreviewTheme(mode)}
                    className={`px-1.5 py-1 rounded text-[10px] font-mono font-semibold transition flex items-center gap-1 cursor-pointer capitalize ${
                      previewTheme === mode
                        ? mode === "dark"
                          ? "bg-ink-900 text-surface-white shadow-xs"
                          : "bg-surface-white text-ink-900 shadow-xs"
                        : "text-ink-800/60 hover:text-ink-900"
                    }`}
                  >
                    {mode === "light" && <Sun className="w-3 h-3" />}
                    {mode === "dark" && <Moon className="w-3 h-3" />}
                    {mode === "auto" && <Layers className="w-3 h-3" />}
                    <span>{mode}</span>
                  </button>
                ))}
              </div>

              <span className="text-[9px] font-mono uppercase bg-surface-light border border-ink-800/20 text-ink-800 px-1.5 py-1 rounded font-semibold">
                {layoutVariant.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Rendered Live Preview with simulated device frame and seeded samples */}
          <div
            className={`p-4 sm:p-6 rounded-2xl border transition-all duration-300 min-h-[340px] flex flex-col justify-center items-center overflow-hidden relative ${
              previewTheme === "dark"
                ? "bg-[#121214] border-white/10"
                : "bg-surface-light/60 border-ink-900/10"
            }`}
          >
            <div
              className={`w-full mx-auto transition-all duration-300 ${
                previewDevice === "mobile"
                  ? "max-w-[340px] px-2 py-4 border border-ink-900/10 rounded-3xl bg-surface-white/5 shadow-lg"
                  : previewDevice === "tablet"
                  ? "max-w-[500px] px-2 py-4 border border-ink-900/10 rounded-2xl bg-surface-white/5 shadow-md"
                  : "max-w-full"
              }`}
            >
              <WidgetDisplayClient
                widget={previewWidgetConfig}
                testimonials={sampleTestimonials}
                initialTheme={previewTheme}
                replayKey={replayCount}
              />
            </div>
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
