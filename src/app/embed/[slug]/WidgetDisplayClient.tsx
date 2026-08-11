"use client";

import { useEffect, useRef } from "react";
import { Star } from "lucide-react";

interface Testimonial {
  id: string;
  authorName: string;
  authorTitle?: string | null;
  authorAvatarUrl?: string | null;
  content: string;
  rating?: number | null;
  videoUrl?: string | null;
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

  const primaryColor = theme.primaryColor || "#4f46e5";
  const backgroundColor = theme.backgroundColor || "#ffffff";
  const textColor = theme.textColor || "#111827";
  const cardStyle = theme.cardStyle || "border"; // "minimal", "border", "glass"

  useEffect(() => {
    const sendHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.getBoundingClientRect().height + 24;
        window.parent.postMessage(
          { type: "clientecho-resize", height },
          "*" // Parent origin check is enforced on receiving parent script side
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
        <div className="text-center py-8 text-gray-500 italic">
          No testimonials to display yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl transition-all duration-200 ${
                cardStyle === "glass"
                  ? "bg-white/70 backdrop-blur-md shadow-sm border border-white/20"
                  : cardStyle === "border"
                  ? "border border-gray-200 bg-white shadow-sm"
                  : "bg-gray-50"
              }`}
            >
              {/* Rating Stars */}
              {item.rating && (
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (item.rating || 0)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Content */}
              <p className="mb-3 whitespace-pre-line text-gray-800">{item.content}</p>

              {/* Video Embed */}
              {item.videoUrl && (
                <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium text-center transition"
                  >
                    ▶ Watch Video Testimonial
                  </a>
                </div>
              )}

              {/* Author Info & Hardcoded Trust Badge */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {item.authorAvatarUrl ? (
                    <img
                      src={item.authorAvatarUrl}
                      alt={item.authorName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {item.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 leading-none">
                      {item.authorName}
                    </div>
                    {item.authorTitle && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.authorTitle}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hardcoded Trust Badge for Imported Testimonials */}
                {item.isImportedSelfReported && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    [Self-Reported / Imported]
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
