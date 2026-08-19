"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Star, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
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

  // Primary & Accent Colors
  const primaryColor = theme.primaryColor || "#2D2D2D";
  const accentColor = theme.accentColor || primaryColor;
  const cardStyle = theme.cardStyle || "border"; // "minimal", "border", "glass"
  const fontPairing = theme.fontPairing || "Manrope"; // "Syne", "Manrope", "Inter", "Roboto", "Outfit"
  const layoutVariant = theme.layoutVariant || "grid"; // "grid", "carousel", "rotator", "marquee", "spotlight"
  const customCss = theme.customCss || "";

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
  const currentBg = isDark ? "#1A1A1D" : (theme.backgroundColor || "#FFFFFF");
  const currentTextColor = isDark ? "#F3F3EF" : (theme.textColor || "#2D2D2D");
  const currentTextSecondary = isDark ? "rgba(243, 243, 239, 0.65)" : "rgba(45, 45, 45, 0.65)";
  const currentBorder = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(45, 45, 45, 0.1)";

  const currentCardBg = useMemo(() => {
    if (isDark) {
      return cardStyle === "glass"
        ? "rgba(35, 35, 38, 0.75)"
        : cardStyle === "border"
        ? "#232326"
        : "#2A2A2E";
    }
    return cardStyle === "glass"
      ? "rgba(255, 255, 255, 0.7)"
      : cardStyle === "border"
      ? "#FFFFFF"
      : "#F9FAFB";
  }, [isDark, cardStyle]);

  const currentShadow = useMemo(() => {
    if (shadowIntensity === "none") return "none";
    if (isDark) {
      return shadowIntensity === "pronounced"
        ? "0 12px 30px rgba(0, 0, 0, 0.6)"
        : "0 4px 20px rgba(0, 0, 0, 0.4)";
    }
    return shadowIntensity === "pronounced"
      ? "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
      : "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)";
  }, [shadowIntensity, isDark]);

  // Rotator / Spotlight active index state
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-advance rotator / spotlight interval with pause-on-hover
  useEffect(() => {
    if (
      (layoutVariant !== "rotator" && layoutVariant !== "spotlight") ||
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

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Carousel navigation handlers
  const handleScrollCarousel = (dir: "left" | "right") => {
    if (carouselTrackRef.current) {
      const scrollAmount = isCompact ? 240 : 320;
      carouselTrackRef.current.scrollBy({
        left: dir === "right" ? scrollAmount : -scrollAmount,
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
    Syne: "var(--font-syne), sans-serif",
    Manrope: "var(--font-manrope), sans-serif",
    Inter: "var(--font-inter), sans-serif",
    Roboto: "var(--font-roboto), sans-serif",
    Outfit: "var(--font-outfit), sans-serif",
  };
  const activeFontFamily = fontMap[fontPairing] || "var(--font-manrope), sans-serif";

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
      style={{
        backgroundColor: currentBg,
        color: currentTextColor,
        fontFamily: activeFontFamily,
        maxWidth: currentMaxWidth,
        width: "100%",
        margin: "0 auto",
      }}
      className={`clientecho-widget clientecho-theme-${effectiveTheme} p-4 antialiased text-sm leading-relaxed relative min-h-[120px] transition-colors duration-200`}
    >
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
                animation: clientecho-marquee-scroll ${Math.max(16, testimonials.length * 7)}s linear infinite;
              }
              .clientecho-marquee-container:hover .clientecho-marquee-track {
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
          {/* Rotator Top Navigation Bar */}
          {layoutVariant === "rotator" && testimonials.length > 1 && (
            <div
              className="clientecho-rotator-nav flex items-center justify-between pb-2 border-b transition-colors"
              style={{ borderColor: currentBorder }}
            >
              <span className="text-xs font-mono font-semibold" style={{ color: currentTextSecondary }}>
                Testimonial {activeIndex + 1} of {testimonials.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg border transition hover:opacity-80 active:scale-95 cursor-pointer"
                  style={{
                    color: currentTextColor,
                    borderColor: currentBorder,
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                  }}
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded-lg border transition hover:opacity-80 active:scale-95 cursor-pointer"
                  style={{
                    color: currentTextColor,
                    borderColor: currentBorder,
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                  }}
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Carousel Top Navigation Bar */}
          {layoutVariant === "carousel" && testimonials.length > 2 && (
            <div className="clientecho-carousel-nav flex items-center justify-end gap-1.5 pb-1">
              <button
                type="button"
                onClick={() => handleScrollCarousel("left")}
                className="p-1.5 rounded-lg border transition hover:opacity-80 active:scale-95 cursor-pointer"
                style={{
                  color: currentTextColor,
                  borderColor: currentBorder,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                }}
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleScrollCarousel("right")}
                className="p-1.5 rounded-lg border transition hover:opacity-80 active:scale-95 cursor-pointer"
                style={{
                  color: currentTextColor,
                  borderColor: currentBorder,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                }}
                aria-label="Scroll right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
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
                  style={{
                    borderRadius,
                    padding: cardPadding,
                    backgroundColor: currentCardBg,
                    borderColor: currentBorder,
                    boxShadow: currentShadow,
                  }}
                  className={`clientecho-card transition-all duration-200 ${
                    cardStyle === "glass"
                      ? "backdrop-blur-md border"
                      : cardStyle === "border"
                      ? "border"
                      : ""
                  }`}
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
                  style={{
                    borderRadius,
                    padding: cardPadding,
                    backgroundColor: currentCardBg,
                    borderColor: currentBorder,
                    boxShadow: currentShadow,
                  }}
                  className={`clientecho-card transition-all duration-200 ${
                    cardStyle === "glass"
                      ? "backdrop-blur-md border"
                      : cardStyle === "border"
                      ? "border"
                      : ""
                  }`}
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

              {/* Reviewer Selection Chips */}
              {testimonials.length > 1 && (
                <div className="clientecho-spotlight-chips flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition shrink-0 cursor-pointer ${
                          isSelected
                            ? "shadow-sm scale-102"
                            : "opacity-60 hover:opacity-90"
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? isDark
                              ? "rgba(255, 255, 255, 0.12)"
                              : "rgba(0, 0, 0, 0.06)"
                            : "transparent",
                          borderColor: isSelected ? accentColor : currentBorder,
                          color: currentTextColor,
                        }}
                      >
                        {t.authorAvatarUrl ? (
                          <img
                            src={t.authorAvatarUrl}
                            alt={t.authorName}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className="w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold text-white"
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

          {/* 3. Marquee Layout (Continuous Auto-Scrolling Ticker) */}
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
                      borderRadius,
                      padding: cardPadding,
                      backgroundColor: currentCardBg,
                      borderColor: currentBorder,
                      boxShadow: currentShadow,
                      width: isCompact ? "240px" : "320px",
                      flexShrink: 0,
                    }}
                    className={`clientecho-card transition-all duration-200 ${
                      cardStyle === "glass"
                        ? "backdrop-blur-md border"
                        : cardStyle === "border"
                        ? "border"
                        : ""
                    }`}
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

          {/* 4. Grid & Carousel Layouts */}
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
                  ? "clientecho-carousel-track flex overflow-x-auto gap-4 pb-3 scrollbar-none snap-x snap-mandatory scroll-smooth"
                  : isCompact
                  ? "clientecho-grid-track grid grid-cols-1 gap-3"
                  : "clientecho-grid-track grid grid-cols-1 md:grid-cols-2 gap-4"
              }
            >
              {testimonials.map((item) => (
                <div
                  key={item.id}
                  style={{
                    borderRadius,
                    padding: cardPadding,
                    backgroundColor: currentCardBg,
                    borderColor: currentBorder,
                    boxShadow: currentShadow,
                    minWidth: layoutVariant === "carousel" ? (isCompact ? "240px" : "290px") : undefined,
                    maxWidth: layoutVariant === "carousel" ? (isCompact ? "280px" : "360px") : undefined,
                    scrollSnapAlign: layoutVariant === "carousel" ? "start" : undefined,
                  }}
                  className={`clientecho-card transition-all duration-200 ${
                    layoutVariant === "carousel" ? "snap-start flex-shrink-0" : ""
                  } ${
                    cardStyle === "glass"
                      ? "backdrop-blur-md border"
                      : cardStyle === "border"
                      ? "border"
                      : ""
                  }`}
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

// Sub-component for individual card content with stable classes
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
      {/* Rating Stars */}
      {item.rating && (
        <div className={`clientecho-stars flex items-center gap-1 ${isCompact ? "mb-1.5" : "mb-2.5"}`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"}
              style={{
                fill: i < (item.rating || 0) ? accentColor : "transparent",
                color:
                  i < (item.rating || 0)
                    ? accentColor
                    : isDark
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(45, 45, 45, 0.2)",
              }}
            />
          ))}
        </div>
      )}

      {/* Quote Content (with React Bits BlurText reveal option) */}
      {textReveal ? (
        <div
          className={`clientecho-quote mb-4 whitespace-pre-line leading-relaxed font-normal ${
            isCompact ? "text-xs mb-2.5" : isLarge ? "text-base" : "text-sm"
          }`}
          style={{ color: currentTextColor }}
        >
          <BlurText
            text={`"${item.content}"`}
            delay={18}
            replayKey={`${item.id}-${replayKey || 0}`}
          />
        </div>
      ) : (
        <p
          className={`clientecho-quote mb-4 whitespace-pre-line leading-relaxed font-normal ${
            isCompact ? "text-xs mb-2.5" : isLarge ? "text-base" : "text-sm"
          }`}
          style={{ color: currentTextColor }}
        >
          "{item.content}"
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
            className="clientecho-video-btn block p-2.5 text-xs font-semibold text-center transition hover:opacity-90"
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
        <div className="flex items-center gap-2.5">
          {item.authorAvatarUrl ? (
            <img
              src={item.authorAvatarUrl}
              alt={item.authorName}
              className={`clientecho-avatar rounded-full object-cover ${
                isCompact ? "w-6 h-6" : isLarge ? "w-9 h-9" : "w-8 h-8"
              }`}
            />
          ) : (
            <div
              className={`clientecho-avatar rounded-full flex items-center justify-center font-bold text-xs ${
                isCompact ? "w-6 h-6 text-[10px]" : isLarge ? "w-9 h-9 text-sm" : "w-8 h-8"
              }`}
              style={{ backgroundColor: primaryColor, color: "#FFFFFF" }}
            >
              {item.authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div
              className={`clientecho-author-name font-bold ${
                isCompact ? "text-[11px]" : "text-xs"
              }`}
              style={{ color: currentTextColor }}
            >
              {item.authorName}
            </div>
            {item.authorTitle && (
              <div
                className="clientecho-author-title text-[10px] mt-0.5 opacity-80"
                style={{ color: currentTextSecondary }}
              >
                {item.authorTitle}
              </div>
            )}
          </div>
        </div>

        {/* Standardized Clickable Trust Verification Badges */}
        {item.isImportedSelfReported || item.source === "manual_import" ? (
          <a
            href={`/verify/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View public verification record"
            className="clientecho-badge inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition cursor-pointer border hover:opacity-80 shrink-0"
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
              borderColor: currentBorder,
              color: currentTextColor,
            }}
          >
            [Self-Reported]
          </a>
        ) : item.source === "magic_link" ? (
          <a
            href={`/verify/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View public cryptographic verification record"
            className="clientecho-badge inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold hover:opacity-90 hover:scale-105 transition transform cursor-pointer shadow-xs shrink-0"
            style={{ backgroundColor: accentColor, color: "#FFFFFF" }}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Verified</span>
          </a>
        ) : (
          <a
            href={`/verify/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View public verification record"
            className="clientecho-badge inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition cursor-pointer border hover:opacity-80 shrink-0"
            style={{
              borderColor: currentBorder,
              color: currentTextColor,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "transparent",
            }}
          >
            Direct Verified
          </a>
        )}
      </div>
    </>
  );
}
