"use client";

import React from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";

interface RotatingTextProps {
  children: React.ReactNode;
  itemKey: string | number;
  direction?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function RotatingText({
  children,
  itemKey,
  direction = 1,
  className = "",
  style = {},
}: RotatingTextProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants: Variants = {
    enter: (dir: number) => ({
      rotateX: prefersReducedMotion ? 0 : dir > 0 ? 45 : -45,
      y: prefersReducedMotion ? 0 : dir > 0 ? 24 : -24,
      opacity: prefersReducedMotion ? 1 : 0,
      scale: prefersReducedMotion ? 1 : 0.98,
    }),
    center: {
      rotateX: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.32,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
    exit: (dir: number) => ({
      rotateX: prefersReducedMotion ? 0 : dir > 0 ? -45 : 45,
      y: prefersReducedMotion ? 0 : dir > 0 ? -24 : 24,
      opacity: prefersReducedMotion ? 1 : 0,
      scale: prefersReducedMotion ? 1 : 0.98,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.24,
        ease: [0.25, 0.1, 0.25, 1],
      },
    }),
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ perspective: "1200px", ...style }}
    >
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          key={itemKey}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          style={{ transformStyle: "preserve-3d" }}
          className="w-full h-full flex flex-col"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
