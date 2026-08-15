import React from "react";

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-surface-light rounded-xl ${className}`}
      style={{
        background: "linear-gradient(90deg, var(--surface-light) 25%, #e4e7eb 37%, var(--surface-light) 63%)",
        backgroundSize: "400% 100%",
        animation: "shimmer 1.4s ease infinite",
      }}
    />
  );
}
