"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Star, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import BlurText from "@/components/react-bits/BlurText";
import RotatingText from "@/components/react-bits/RotatingText";

interface Testimonial {
  id: string;
  authorName: string;
  authorTitle?: string | null;
  authorAvatarUrl?: string | null;
  content: string;
  rating?: number | null;
  videoUrl?: string | null;
  source?: "magic_link" | "public_form" | "manual_import";
  isImportedSelfReported: boolean;
}

interface Widget {
  id: string;
  slug: string;
  name: string;
  themeConfig: Record<string, any> | unknown;
}

export default function WidgetDisplayClient({
  widget,
  testimonials,
  initialTheme,
  replayKey,
}: {
  widget: Widget;
  testimonials: Testimonial[];
  initialTheme?: string;
  replayKey?: number | string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselTrackRef = useRef<HTMLDivElement>(null);
  const theme = (widget.themeConfig as Record<string, any>) || {};

  // Theme settings
  const configuredDefaultTheme = theme.defaultTheme || "light";
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "auto">(() => {
    if (initialTheme === "dark" || initialTheme === "light" || initialTheme === "auto") {
      return initialTheme;
    }
    return configuredDefaultTheme;
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(false);
  const prefersReducedMotion = useReducedMotion();

  // Synchronize themeMode whenever initialTheme or configuredDefaultTheme changes
  useEffect(() => {
    if (initialTheme === "dark" || initialTheme === "light" || initialTheme === "auto") {
      setThemeMode(initialTheme);
    } else if (configuredDefaultTheme) {
      setThemeMode(configuredDefaultTheme);
    }
  }, [initialTheme, configuredDefaultTheme]);

  // Primary & Accent Colors
  const primaryColor = theme.primaryColor || "#2D2D2D";
  const accentColor = theme.accentColor || primaryColor;
  const cardStyle = theme.cardStyle || "border"; // "border", "minimal", "glass", "transparent", "outline"
  const fontPairing = theme.fontPairing || "Manrope"; // "Syne", "Manrope", "Inter", "Roboto", "Outfit"
  const layoutVariant = theme.layoutVariant || "grid"; // "grid", "carousel", "rotator", "marquee", "spotlight", "stacked_deck", "orbit_avatars"
  const customCss = theme.customCss || "";
  const marqueeSpeed = Math.max(8, Number(theme.marqueeSpeed) || 35);

  // Sizing Presets & Max-Width
  const sizePreset = theme.sizePreset || "standard";
  const customMaxWidth = theme.customMaxWidth;
  const presetWidthMap: Record<string, string> = {
    compact: "320px",
    standard: "480px",
    large: "640px",
    full: "100%",
  };
  const currentMaxWidth = customMaxWidth
    ? typeof customMaxWidth === "number"
      ? `${customMaxWidth}px`
      : customMaxWidth
    : presetWidthMap[sizePreset] || "100%";

  const isCompact = sizePreset === "compact";
  const isLarge = sizePreset === "large";

  // No-code styling adjustments
  const borderRadius =
    theme.borderRadius !== undefined
      ? typeof theme.borderRadius === "number"
        ? `${theme.borderRadius}px`
        : theme.borderRadius
      : "16px";

  const paddingDensity = theme.paddingDensity || "comfortable"; // "compact", "comfortable", "spacious"
  const paddingMap = {
    compact: isCompact ? "10px" : "14px",
    comfortable: isCompact ? "14px" : isLarge ? "24px" : "20px",
    spacious: isCompact ? "18px" : isLarge ? "32px" : "28px",
  };
  const cardPadding = paddingMap[paddingDensity as keyof typeof paddingMap] || "20px";

  const shadowIntensity = theme.shadowIntensity || "subtle"; // "none", "subtle", "pronounced"
  const textReveal = Boolean(theme.textReveal);
  const autoRotateInterval = Math.max(2, Number(theme.autoRotateInterval) || 6);

  // Detect OS dark mode preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemIsDark(mq.matches);

    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Listen for host page live theme sync via postMessage
  useEffect(() => {
    const handleThemeMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "clientecho-set-theme") {
        const reqTheme = event.data.theme;
        if (reqTheme === "light" || reqTheme === "dark" || reqTheme === "auto") {
          setThemeMode(reqTheme);
        }
      }
    };

    window.addEventListener("message", handleThemeMessage);
    return () => window.removeEventListener("message", handleThemeMessage);
  }, []);

  // Compute effective theme (light or dark)
  const effectiveTheme: "light" | "dark" =
    themeMode === "auto" ? (systemIsDark ? "dark" : "light") : themeMode;

  // Dark & Light theme token sets
  const isDark = effectiveTheme === "dark";
  const currentBg = theme.backgroundColor || "transparent";
  const currentTextColor = isDark ? "#F3F3EF" : (theme.textColor || "#2D2D2D");
  const currentTextSecondary = isDark ? "rgba(243, 243, 239, 0.65)" : "rgba(45, 45, 45, 0.65)";
  const currentBorder = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(45, 45, 45, 0.1)";

  const currentCardBg = useMemo(() => {
    if (cardStyle === "transparent" || cardStyle === "outline") {
      return "transparent";
    }
    if (isDark) {
      return cardStyle === "glass"
        ? "rgba(35, 35, 38, 0.75)"
        : cardStyle === "border"
        ? "#232326"
        : "#2A2A2E"; // minimal
    }
    return cardStyle === "glass"
      ? "rgba(255, 255, 255, 0.7)"
      : cardStyle === "border"
      ? "#FFFFFF"
      : "#F9FAFB"; // minimal
  }, [isDark, cardStyle]);

  const computedBorder = useMemo(() => {
    if (cardStyle === "transparent" || cardStyle === "minimal") {
      return "transparent";
    }
    return currentBorder;
  }, [cardStyle, currentBorder]);

  const computedShadow = useMemo(() => {
    if (shadowIntensity === "none" || cardStyle === "transparent" || cardStyle === "outline") {
      return "none";
    }
    if (isDark) {
      return shadowIntensity === "pronounced"
        ? "0 12px 30px rgba(0, 0, 0, 0.6)"
        : "0 4px 20px rgba(0, 0, 0, 0.4)";
    }
    return shadowIntensity === "pronounced"
      ? "0 12px 30px rgba(0, 0, 0, 0.12)"
      : "0 4px 20px rgba(0, 0, 0, 0.05)";
  }, [isDark, cardStyle, shadowIntensity]);

  const cardStyleClasses = useMemo(() => {
    switch (cardStyle) {
      case "glass":
        return "backdrop-blur-md";
      case "minimal":
        return "";
      case "transparent":
        return "bg-transparent";
      case "outline":
        return "bg-transparent";
      case "border":
      default:
        return "";
    }
  }, [cardStyle]);

  // Rotator / Spotlight / Stacked Deck / Orbit active index state
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<number>(1);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-advance rotator / spotlight / stacked deck interval with pause-on-hover
  useEffect(() => {
    if (
      (layoutVariant !== "rotator" && layoutVariant !== "spotlight" && layoutVariant !== "stacked_deck") ||
      testimonials.length <= 1 ||
      isHovered
    )
      return;
    const intervalMs = autoRotateInterval * 1000;
    const timer = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [layoutVariant, testimonials.length, isHovered, autoRotateInterval]);

  const handlePrev = useCallback(() => {
    if (testimonials.length <= 1) return;
    setDirection(-1);
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  }, [testimonials.length]);

  const handleNext = useCallback(() => {
    if (testimonials.length <= 1) return;
    setDirection(1);
    setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  }, [testimonials.length]);

  // Carousel navigation handlers
  const handleScrollCarousel = (dir: "left" | "right") => {
    if (carouselTrackRef.current) {
      const scrollAmount = 320;
      carouselTrackRef.current.scrollBy({
        left: dir === "left" ? -scrollAmount : scrollAmount,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  };

  // Send dynamic height to parent window
  useEffect(() => {
    const sendHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.getBoundingClientRect().height + 24;
        window.parent.postMessage({ type: "clientecho-resize", height }, "*");
      }
    };

    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [testimonials, activeIndex, layoutVariant, cardStyle, paddingDensity, themeMode, effectiveTheme, sizePreset]);

  const fontMap: Record<string, string> = {
    Syne: "var(--font-syne), 'Syne', sans-serif",
    Manrope: "var(--font-manrope), 'Manrope', sans-serif",
    Inter: "var(--font-inter), 'Inter', sans-serif",
    Roboto: "var(--font-roboto), 'Roboto', sans-serif",
    Outfit: "var(--font-outfit), 'Outfit', sans-serif",
  };
  const activeFontFamily = fontMap[fontPairing] || "var(--font-manrope), 'Manrope', sans-serif";

  // Duplicate testimonials for continuous marquee scrolling
  const marqueeItems = useMemo(() => {
    if (testimonials.length === 0) return [];
    if (testimonials.length === 1) return [...testimonials, ...testimonials, ...testimonials, ...testimonials];
    if (testimonials.length < 4) return [...testimonials, ...testimonials, ...testimonials];
    return [...testimonials, ...testimonials];
  }, [testimonials]);

  return (
    <div
      ref={containerRef}
      id="clientecho-widget"
      data-theme={effectiveTheme}
      style={{
        backgroundColor: currentBg,
        color: currentTextColor,
        fontFamily: activeFontFamily,
        maxWidth: currentMaxWidth,
        width: "100%",
        margin: "0 auto",
        ["--ce-primary" as any]: primaryColor,
        ["--ce-accent" as any]: accentColor,
        ["--ce-bg" as any]: currentBg,
        ["--ce-text" as any]: currentTextColor,
        ["--ce-text-secondary" as any]: currentTextSecondary,
        ["--ce-border" as any]: computedBorder,
        ["--ce-card-bg" as any]: currentCardBg,
        ["--ce-card-border" as any]: computedBorder,
        ["--ce-card-radius" as any]: borderRadius,
        ["--ce-card-padding" as any]: cardPadding,
        ["--ce-card-shadow" as any]: computedShadow,
        ["--ce-star-color" as any]: accentColor,
        ["--ce-badge-bg" as any]: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
        ["--ce-badge-border" as any]: currentBorder,
        ["--ce-badge-text" as any]: currentTextColor,
        ["--ce-badge-verified-bg" as any]: accentColor,
        ["--ce-badge-verified-text" as any]: "#FFFFFF",
        ["--ce-badge-direct-bg" as any]: isDark ? "rgba(255, 255, 255, 0.05)" : "transparent",
        ["--ce-badge-direct-border" as any]: currentBorder,
        ["--ce-badge-direct-text" as any]: currentTextColor,
        ["--ce-badge-self-bg" as any]: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
        ["--ce-badge-self-border" as any]: currentBorder,
        ["--ce-badge-self-text" as any]: currentTextColor,
        ["--ce-avatar-bg" as any]: primaryColor,
        ["--ce-avatar-text" as any]: "#FFFFFF",
        ["--ce-avatar-border" as any]: "transparent",
        ["--ce-avatar-size" as any]: isCompact ? "24px" : isLarge ? "36px" : "32px",
        ["--ce-star-stroke" as any]: "currentColor",
        ["--ce-quote-font-size" as any]: isCompact ? "13px" : isLarge ? "16px" : "14px",
        ["--ce-author-name-font-size" as any]: isCompact ? "12px" : "13px",
        ["--ce-author-title-font-size" as any]: "10px",
      }}
      className={`clientecho-widget clientecho-theme-${effectiveTheme} antialiased text-sm leading-relaxed relative min-h-[120px] transition-colors duration-200`}
    >
      {/* Baseline Scoped CSS allowing custom CSS overrides without inline specificity collisions */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            #clientecho-widget,
            #clientecho-widget * {
              font-family: inherit;
            }
            .clientecho-card {
              background-color: var(--ce-card-bg);
              border-color: var(--ce-card-border);
              border-style: solid;
              border-width: 1px;
              border-radius: var(--ce-card-radius);
              padding: var(--ce-card-padding);
              box-shadow: var(--ce-card-shadow);
            }
            .clientecho-stars {
              color: var(--ce-star-color);
              stroke: var(--ce-star-stroke, currentColor);
            }
            .clientecho-star {
              transition: color 0.15s ease, fill 0.15s ease, stroke 0.15s ease;
              stroke: inherit;
            }
            .clientecho-quote {
              font-family: inherit;
              color: var(--ce-text);
              font-size: var(--ce-quote-font-size, 14px);
              font-style: normal;
              line-height: 1.6;
            }
            .clientecho-quote-mark {
              color: var(--ce-quote-mark-color, inherit);
              font-family: Georgia, Cambria, "Times New Roman", Times, serif;
              font-style: normal;
              font-weight: 700;
              line-height: 1;
              display: inline;
            }
            .clientecho-author-name {
              font-family: inherit;
              color: var(--ce-text);
              font-size: var(--ce-author-name-font-size, 13px);
              font-weight: 700;
            }
            .clientecho-author-title {
              font-family: inherit;
              color: var(--ce-text-secondary);
              font-size: var(--ce-author-title-font-size, 10px);
              font-weight: 400;
            }
            .clientecho-badge {
              background-color: var(--ce-badge-bg);
              border-color: var(--ce-badge-border);
              color: var(--ce-badge-text);
            }
            .clientecho-badge-verified {
              background-color: var(--ce-badge-verified-bg);
              color: var(--ce-badge-verified-text);
            }
            .clientecho-badge-direct {
              background-color: var(--ce-badge-direct-bg);
              border-color: var(--ce-badge-direct-border);
              color: var(--ce-badge-direct-text);
            }
            .clientecho-badge-self {
              background-color: var(--ce-badge-self-bg);
              border-color: var(--ce-badge-self-border);
              color: var(--ce-badge-self-text);
            }
            .clientecho-avatar {
              background-color: var(--ce-avatar-bg, var(--ce-primary));
              color: var(--ce-avatar-text, #FFFFFF);
              border-color: var(--ce-avatar-border, transparent);
              border-style: solid;
              border-width: 0px;
              border-radius: 9999px;
              width: var(--ce-avatar-size, 32px);
              height: var(--ce-avatar-size, 32px);
            }
            .clientecho-rotator-nav {
              border-color: var(--ce-border);
            }
            .clientecho-rotator-counter {
              color: var(--ce-text-secondary);
            }
            .clientecho-rotator-btn, .clientecho-carousel-btn {
              background-color: var(--ce-nav-btn-bg, ${isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"});
              border-color: var(--ce-nav-btn-border, var(--ce-border));
              color: var(--ce-nav-btn-color, var(--ce-text));
              border-radius: 12px;
            }
            .clientecho-spotlight-chips {
              gap: 8px;
            }
            .clientecho-spotlight-chip {
              background-color: transparent;
              border-color: var(--ce-border);
              color: var(--ce-text);
              border-radius: 9999px;
            }
            .clientecho-spotlight-chip.clientecho-chip-active {
              background-color: var(--ce-chip-active-bg, ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)"});
              border-color: var(--ce-chip-active-border, var(--ce-accent));
            }
            .clientecho-orbit-row {
              gap: 12px;
            }
            .clientecho-orbit-btn {
              border-radius: 9999px;
            }
            .clientecho-orbit-btn.clientecho-orbit-active {
              outline: 2px solid var(--ce-orbit-active-outline, var(--ce-accent));
              outline-offset: 2px;
            }
          `,
        }}
      />

      {/* Scoped Custom CSS Injection */}
      {customCss && (
        <style dangerouslySetInnerHTML={{ __html: customCss.replace(/<[^>]*>?/gm, "") }} />
      )}

      {/* Marquee Animation CSS Keyframe */}
      {layoutVariant === "marquee" && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes clientecho-marquee-scroll {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              .clientecho-marquee-track {
                display: flex;
                width: max-content;
                animation: clientecho-marquee-scroll ${marqueeSpeed}s linear infinite;
              }
              .clientecho-marquee-track:hover {
                animation-play-state: paused;
              }
            `,
          }}
        />
      )}

      {testimonials.length === 0 ? (
        <div className="clientecho-empty text-center py-8 opacity-60 italic" style={{ color: currentTextColor }}>
          No testimonials to display yet.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Rotator Top Navigation Bar with 44px touch targets */}
          {layoutVariant === "rotator" && testimonials.length > 1 && (
            <div
              className="clientecho-rotator-nav flex items-center justify-between pb-2 border-b transition-colors"
              style={{ borderColor: currentBorder }}
            >
              <span className="clientecho-rotator-counter text-xs font-mono font-semibold">
                Testimonial {activeIndex + 1} of {testimonials.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="clientecho-rotator-btn min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl border transition hover:opacity-80 active:scale-95 cursor-pointer touch-manipulation"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="clientecho-rotator-btn min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl border transition hover:opacity-80 active:scale-95 cursor-pointer touch-manipulation"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Carousel Top Navigation Bar with 44px touch targets */}
          {layoutVariant === "carousel" && testimonials.length > 2 && (
            <div className="clientecho-carousel-nav flex items-center justify-end gap-1.5 pb-1">
              <button
                type="button"
                onClick={() => handleScrollCarousel("left")}
                className="clientecho-carousel-btn min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl border transition hover:opacity-80 active:scale-95 cursor-pointer touch-manipulation"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScrollCarousel("right")}
                className="clientecho-carousel-btn min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl border transition hover:opacity-80 active:scale-95 cursor-pointer touch-manipulation"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 1. Rotator Layout with React Bits 3D RotatingText */}
          {layoutVariant === "rotator" && (
            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative"
            >
              <RotatingText
                itemKey={`${testimonials[activeIndex % testimonials.length]?.id}-${replayKey || 0}`}
                direction={direction}
              >
                <div
                  className={`clientecho-card transition-all duration-200 ${cardStyleClasses}`}
                >
                  <CardContent
                    item={testimonials[activeIndex % testimonials.length]}
                    accentColor={accentColor}
                    primaryColor={primaryColor}
                    currentTextColor={currentTextColor}
                    currentTextSecondary={currentTextSecondary}
                    currentBorder={currentBorder}
                    isDark={isDark}
                    isCompact={isCompact}
                    isLarge={isLarge}
                    textReveal={textReveal}
                    replayKey={replayKey}
                  />
                </div>
              </RotatingText>
            </div>
          )}

          {/* 2. Spotlight Layout (Featured Large Card + Interactive Reviewer Chips) */}
          {layoutVariant === "spotlight" && (
            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="space-y-3"
            >
              <RotatingText
                itemKey={`${testimonials[activeIndex % testimonials.length]?.id}-${replayKey || 0}`}
                direction={direction}
              >
                <div
                  className={`clientecho-card transition-all duration-200 ${cardStyleClasses}`}
                >
                  <CardContent
                    item={testimonials[activeIndex % testimonials.length]}
                    accentColor={accentColor}
                    primaryColor={primaryColor}
                    currentTextColor={currentTextColor}
                    currentTextSecondary={currentTextSecondary}
                    currentBorder={currentBorder}
                    isDark={isDark}
                    isCompact={isCompact}
                    isLarge={isLarge}
                    textReveal={textReveal}
                    replayKey={replayKey}
                  />
                </div>
              </RotatingText>

              {/* Reviewer Selection Chips with 44px min touch target */}
              {testimonials.length > 1 && (
                <div className="clientecho-spotlight-chips flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full touch-pan-x">
                  {testimonials.map((t, idx) => {
                    const isSelected = idx === activeIndex % testimonials.length;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setDirection(idx > activeIndex ? 1 : -1);
                          setActiveIndex(idx);
                        }}
                        className={`clientecho-spotlight-chip flex items-center gap-2 px-3 py-2 min-h-[44px] border text-xs font-semibold transition shrink-0 cursor-pointer touch-manipulation ${
                          isSelected
                            ? "clientecho-chip-active shadow-sm scale-102"
                            : "clientecho-chip-inactive opacity-60 hover:opacity-90"
                        }`}
                      >
                        {t.authorAvatarUrl ? (
                          <img
                            src={t.authorAvatarUrl}
                            alt={t.authorName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {t.authorName.charAt(0)}
                          </span>
                        )}
                        <span className="truncate max-w-[120px]">{t.authorName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Stacked Deck Layout (Overlapping Cards with Touch Swipe & Click Transition) */}
          {layoutVariant === "stacked_deck" && (
            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative pt-2 pb-6 min-h-[220px]"
            >
              <div className="relative w-full">
                {/* 3rd Card in Deck (if >= 3) */}
                {testimonials.length > 2 && (
                  <div
                    style={{
                      transform: "scale(0.90) translateY(20px)",
                      opacity: 0.6,
                      zIndex: 10,
                    }}
                    className={`clientecho-card absolute inset-0 transition-all duration-300 pointer-events-none ${cardStyleClasses}`}
                  >
                    <CardContent
                      item={testimonials[(activeIndex + 2) % testimonials.length]}
                      accentColor={accentColor}
                      primaryColor={primaryColor}
                      currentTextColor={currentTextColor}
                      currentTextSecondary={currentTextSecondary}
                      currentBorder={currentBorder}
                      isDark={isDark}
                      isCompact={isCompact}
                      isLarge={isLarge}
                      textReveal={false}
                    />
                  </div>
                )}

                {/* 2nd Card in Deck (if >= 2) */}
                {testimonials.length > 1 && (
                  <div
                    style={{
                      transform: "scale(0.95) translateY(10px)",
                      opacity: 0.85,
                      zIndex: 20,
                    }}
                    className={`clientecho-card absolute inset-0 transition-all duration-300 pointer-events-none ${cardStyleClasses}`}
                  >
                    <CardContent
                      item={testimonials[(activeIndex + 1) % testimonials.length]}
                      accentColor={accentColor}
                      primaryColor={primaryColor}
                      currentTextColor={currentTextColor}
                      currentTextSecondary={currentTextSecondary}
                      currentBorder={currentBorder}
                      isDark={isDark}
                      isCompact={isCompact}
                      isLarge={isLarge}
                      textReveal={false}
                    />
                  </div>
                )}

                {/* Top Interactive Card with Touch/Swipe Gestures & Click Next */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${testimonials[activeIndex % testimonials.length]?.id}-${replayKey || 0}`}
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: direction * 40, rotateZ: direction * 3 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    drag={testimonials.length > 1 ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragSnapToOrigin={true}
                    dragElastic={0.35}
                    onDragEnd={(_e, info) => {
                      if (testimonials.length <= 1) return;
                      if (info.offset.x < -40 || info.velocity.x < -250) {
                        handleNext();
                      } else if (info.offset.x > 40 || info.velocity.x > 250) {
                        handlePrev();
                      }
                    }}
                    style={{
                      zIndex: 30,
                      touchAction: "pan-y",
                    }}
                    className={`clientecho-card relative transition-colors duration-200 cursor-grab active:cursor-grabbing select-none ${cardStyleClasses}`}
                    onClick={testimonials.length > 1 ? handleNext : undefined}
                    title={testimonials.length > 1 ? "Click or swipe card horizontally" : undefined}
                  >
                    <CardContent
                      item={testimonials[activeIndex % testimonials.length]}
                      accentColor={accentColor}
                      primaryColor={primaryColor}
                      currentTextColor={currentTextColor}
                      currentTextSecondary={currentTextSecondary}
                      currentBorder={currentBorder}
                      isDark={isDark}
                      isCompact={isCompact}
                      isLarge={isLarge}
                      textReveal={textReveal}
                      replayKey={replayKey}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* 4. Orbit Avatars Layout (Faces Row + Animated Active Card) */}
          {layoutVariant === "orbit_avatars" && (
            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="space-y-4"
            >
              {/* Prominent Circular Avatar Row with 44px min touch target & smooth mobile scrolling */}
              <div className="clientecho-orbit-row flex items-center justify-start sm:justify-center gap-3 overflow-x-auto py-2 px-2 scrollbar-none max-w-full touch-pan-x">
                {testimonials.map((t, idx) => {
                  const isSelected = idx === activeIndex % testimonials.length;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onMouseEnter={() => {
                        setDirection(idx > activeIndex ? 1 : -1);
                        setActiveIndex(idx);
                      }}
                      onClick={() => {
                        setDirection(idx > activeIndex ? 1 : -1);
                        setActiveIndex(idx);
                      }}
                      className={`clientecho-orbit-btn relative p-1 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all duration-200 cursor-pointer touch-manipulation ${
                        isSelected
                          ? "clientecho-orbit-active scale-115 shadow-md"
                          : "clientecho-orbit-inactive opacity-60 hover:opacity-100 hover:scale-105"
                      }`}
                      title={`${t.authorName}${t.authorTitle ? ` — ${t.authorTitle}` : ""}`}
                    >
                      {t.authorAvatarUrl ? (
                        <img
                          src={t.authorAvatarUrl}
                          alt={t.authorName}
                          className="clientecho-orbit-avatar w-10 h-10 rounded-full object-cover border border-white/20"
                        />
                      ) : (
                        <div
                          className="clientecho-orbit-avatar w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white"
                          style={{ backgroundColor: isSelected ? accentColor : primaryColor }}
                        >
                          {t.authorName.charAt(0)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Testimonial Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${testimonials[activeIndex % testimonials.length]?.id}-${replayKey || 0}`}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className={`clientecho-card transition-colors duration-200 ${cardStyleClasses}`}
                >
                  <CardContent
                    item={testimonials[activeIndex % testimonials.length]}
                    accentColor={accentColor}
                    primaryColor={primaryColor}
                    currentTextColor={currentTextColor}
                    currentTextSecondary={currentTextSecondary}
                    currentBorder={currentBorder}
                    isDark={isDark}
                    isCompact={isCompact}
                    isLarge={isLarge}
                    textReveal={textReveal}
                    replayKey={replayKey}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* 5. Marquee Layout (Continuous Auto-Scrolling Ticker with Responsive Card Widths) */}
          {layoutVariant === "marquee" && (
            <div
              className="clientecho-marquee-container overflow-hidden relative py-1"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="clientecho-marquee-track gap-4">
                {marqueeItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    style={{
                      width: isCompact ? "min(240px, calc(100vw - 48px))" : "min(320px, calc(100vw - 48px))",
                      flexShrink: 0,
                    }}
                    className={`clientecho-card transition-all duration-200 ${cardStyleClasses}`}
                  >
                    <CardContent
                      item={item}
                      accentColor={accentColor}
                      primaryColor={primaryColor}
                      currentTextColor={currentTextColor}
                      currentTextSecondary={currentTextSecondary}
                      currentBorder={currentBorder}
                      isDark={isDark}
                      isCompact={isCompact}
                      isLarge={isLarge}
                      textReveal={false}
                      replayKey={replayKey}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Grid & Carousel Layouts with Mobile Responsive Breakpoints */}
          {(layoutVariant === "grid" || layoutVariant === "carousel") && (
            <div
              ref={carouselTrackRef}
              style={
                layoutVariant === "carousel"
                  ? {
                      scrollSnapType: "x mandatory",
                    }
                  : undefined
              }
              className={
                layoutVariant === "carousel"
                  ? "clientecho-carousel-track flex overflow-x-auto gap-4 pb-3 scrollbar-none snap-x snap-mandatory scroll-smooth touch-pan-x"
                  : isCompact
                  ? "clientecho-grid-track grid grid-cols-1 gap-3"
                  : "clientecho-grid-track grid grid-cols-1 md:grid-cols-2 gap-4"
              }
            >
              {testimonials.map((item) => (
                <div
                  key={item.id}
                  style={{
                    minWidth: layoutVariant === "carousel" ? (isCompact ? "min(240px, calc(100% - 24px))" : "min(290px, calc(100% - 24px))") : undefined,
                    maxWidth: layoutVariant === "carousel" ? (isCompact ? "280px" : "min(360px, calc(100% - 24px))") : undefined,
                    scrollSnapAlign: layoutVariant === "carousel" ? "start" : undefined,
                  }}
                  className={`clientecho-card transition-all duration-200 ${
                    layoutVariant === "carousel" ? "snap-start flex-shrink-0" : ""
                  } ${cardStyleClasses}`}
                >
                  <CardContent
                    item={item}
                    accentColor={accentColor}
                    primaryColor={primaryColor}
                    currentTextColor={currentTextColor}
                    currentTextSecondary={currentTextSecondary}
                    currentBorder={currentBorder}
                    isDark={isDark}
                    isCompact={isCompact}
                    isLarge={isLarge}
                    textReveal={textReveal}
                    replayKey={replayKey}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-component for individual card content with non-blocking CSS variable styling
function CardContent({
  item,
  accentColor,
  primaryColor,
  currentTextColor,
  currentTextSecondary,
  currentBorder,
  isDark,
  isCompact,
  isLarge,
  textReveal,
  replayKey,
}: {
  item: Testimonial;
  accentColor: string;
  primaryColor: string;
  currentTextColor: string;
  currentTextSecondary: string;
  currentBorder: string;
  isDark: boolean;
  isCompact?: boolean;
  isLarge?: boolean;
  textReveal: boolean;
  replayKey?: number | string;
}) {
  return (
    <>
      {/* Rating Stars with inherit / currentColor support for custom CSS overrides */}
      {item.rating && (
        <div className={`clientecho-stars flex items-center gap-1 ${isCompact ? "mb-1.5" : "mb-2.5"}`}>
          {Array.from({ length: 5 }).map((_, i) => {
            const isActive = i < (item.rating || 0);
            return (
              <Star
                key={i}
                className={`clientecho-star ${isCompact ? "w-3.5 h-3.5" : "w-4 h-4"}`}
                style={{
                  fill: isActive ? "currentColor" : "transparent",
                  color: isActive
                    ? "inherit"
                    : isDark
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(45, 45, 45, 0.2)",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Quote Content with baseline CSS typography & elegant curly quotation marks */}
      {textReveal ? (
        <div
          className={`clientecho-quote mb-4 whitespace-pre-line leading-relaxed break-words ${
            isCompact ? "mb-2.5" : "mb-4"
          }`}
        >
          <span className="clientecho-quote-mark select-none">“</span>
          <BlurText
            text={item.content}
            delay={18}
            replayKey={`${item.id}-${replayKey || 0}`}
          />
          <span className="clientecho-quote-mark select-none">”</span>
        </div>
      ) : (
        <p
          className={`clientecho-quote mb-4 whitespace-pre-line leading-relaxed break-words ${
            isCompact ? "mb-2.5" : "mb-4"
          }`}
        >
          <span className="clientecho-quote-mark select-none">“</span>
          {item.content}
          <span className="clientecho-quote-mark select-none">”</span>
        </p>
      )}

      {/* Video Embed */}
      {item.videoUrl && (
        <div
          className="clientecho-video-container mb-3 rounded-xl overflow-hidden border"
          style={{ borderColor: currentBorder }}
        >
          <a
            href={item.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="clientecho-video-btn block p-2.5 min-h-[44px] flex items-center justify-center text-xs font-semibold text-center transition hover:opacity-90 touch-manipulation"
            style={{ backgroundColor: primaryColor, color: "#FFFFFF" }}
          >
            ▶ Watch Video Testimonial
          </a>
        </div>
      )}

      {/* Author Info & Standardized Trust Badges */}
      <div
        className={`clientecho-author flex items-center justify-between border-t transition-colors ${
          isCompact ? "pt-2 gap-2" : "pt-3"
        }`}
        style={{ borderColor: currentBorder }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {item.authorAvatarUrl ? (
            <img
              src={item.authorAvatarUrl}
              alt={item.authorName}
              className="clientecho-avatar object-cover shrink-0"
            />
          ) : (
            <div
              className="clientecho-avatar flex items-center justify-center font-bold text-xs shrink-0"
            >
              {item.authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="clientecho-author-name truncate">
              {item.authorName}
            </div>
            {item.authorTitle && (
              <div
                className="clientecho-author-title mt-0.5 opacity-80 truncate max-w-[180px]"
              >
                {item.authorTitle}
              </div>
            )}
          </div>
        </div>

        {/* Standardized Clickable Trust Verification Badges with non-blocking baseline CSS */}
        {item.isImportedSelfReported || item.source === "manual_import" ? (
          <a
            href={`/verify/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View public verification record"
            className="clientecho-badge clientecho-badge-self inline-flex items-center px-2 py-1 rounded text-[10px] font-mono font-semibold transition cursor-pointer border hover:opacity-80 shrink-0 min-h-[28px] touch-manipulation"
          >
            [Self-Reported]
          </a>
        ) : item.source === "magic_link" ? (
          <a
            href={`/verify/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View public cryptographic verification record"
            className="clientecho-badge clientecho-badge-verified inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-semibold hover:opacity-90 hover:scale-105 transition transform cursor-pointer shadow-xs shrink-0 min-h-[28px] touch-manipulation"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified</span>
          </a>
        ) : (
          <a
            href={`/verify/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View public verification record"
            className="clientecho-badge clientecho-badge-direct inline-flex items-center px-2 py-1 rounded text-[10px] font-mono font-semibold transition cursor-pointer border hover:opacity-80 shrink-0 min-h-[28px] touch-manipulation"
          >
            Direct Verified
          </a>
        )}
      </div>
    </>
  );
}
