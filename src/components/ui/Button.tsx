"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "surface";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  icon,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  // Base styles: active:scale-[0.98] provides immediate tactile press response
  const baseStyles =
    "inline-flex items-center justify-center font-display font-semibold transition-all duration-150 active:scale-[0.98] focus:outline-none disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary: "bg-ink-900 hover:bg-ink-800 text-surface-white shadow-sm",
    secondary: "bg-surface-white hover:bg-surface-light text-ink-900 shadow-sm border border-ink-900/10",
    outline: "bg-transparent border border-surface-white/20 text-surface-white hover:bg-surface-white/10",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm",
    ghost: "bg-transparent hover:bg-surface-light text-ink-800/80 hover:text-ink-900",
    surface: "bg-ink-800 hover:bg-ink-900 text-surface-white border border-surface-white/10",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-5 py-2.5 text-xs rounded-xl gap-2",
    lg: "px-6 py-3.5 text-sm rounded-2xl gap-2.5",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}

export default Button;
