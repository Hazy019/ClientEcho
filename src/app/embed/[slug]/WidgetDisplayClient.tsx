"use client";

import { useEffect, useRef } from "react";
import { Star, ShieldCheck } from "lucide-react";

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
}: {
  widget: Widget;
  testimonials: Testimonial[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = (widget.themeConfig as Record<string, any>) || {};

  const primaryColor = theme.primaryColor || "#2D2D2D";
  const backgroundColor = theme.backgroundColor || "#FFFFFF";
  const textColor = theme.textColor || "#2D2D2D";
  const cardStyle = theme.cardStyle || "border"; // "minimal", "border", "glass"

  useEffect(() => {
    const sendHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.getBoundingClientRect().height + 24;
        window.parent.postMessage(
          { type: "clientecho-resize", height },
          "*"
        );
      }
    };

    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [testimonials]);

  return (
    <div
      ref={containerRef}
      style={{ backgroundColor, color: textColor }}
      className="p-4 font-sans antialiased text-sm leading-relaxed"
    >
      {testimonials.length === 0 ? (
        <div className="text-center py-8 text-ink-800/50 italic">
          No testimonials to display yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl transition-all duration-200 ${
                cardStyle === "glass"
                  ? "bg-surface-white/70 backdrop-blur-md shadow-sm border border-surface-white"
                  : cardStyle === "border"
                  ? "border border-ink-900/10 bg-surface-white shadow-sm"
                  : "bg-surface-light"
              }`}
            >
              {/* Rating Stars */}
              {item.rating && (
                <div className="flex items-center gap-1 mb-2.5">
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

              {/* Content */}
              <p className="mb-4 whitespace-pre-line text-ink-900 leading-relaxed font-sans">
                "{item.content}"
              </p>

              {/* Video Embed */}
              {item.videoUrl && (
                <div className="mb-3 rounded-xl overflow-hidden border border-ink-900/10">
                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2.5 bg-ink-900 hover:bg-ink-800 text-surface-white text-xs font-semibold text-center transition"
                  >
                    ▶ Watch Video Testimonial
                  </a>
                </div>
              )}

              {/* Author Info & Standardized Trust Badges */}
              <div className="flex items-center justify-between pt-3 border-t border-ink-900/5">
                <div className="flex items-center gap-2.5">
                  {item.authorAvatarUrl ? (
                    <img
                      src={item.authorAvatarUrl}
                      alt={item.authorName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-surface-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {item.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-display font-bold text-ink-900 text-xs">
                      {item.authorName}
                    </div>
                    {item.authorTitle && (
                      <div className="text-[11px] text-ink-800/60 mt-0.5">
                        {item.authorTitle}
                      </div>
                    )}
                  </div>
                </div>

                {/* Standardized Trust Badges */}
                {item.isImportedSelfReported || item.source === "manual_import" ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-light border border-ink-800/20 text-ink-800">
                    [Self-Reported / Imported]
                  </span>
                ) : item.source === "magic_link" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-ink-900 text-surface-white">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified & Approved</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border border-ink-800 text-ink-900">
                    Verified Direct Submission
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

