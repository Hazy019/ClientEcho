"use client";

import React, { useMemo } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  animateBy?: "words" | "letters";
  replayKey?: number | string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export default function BlurText({
  text,
  delay = 20,
  className = "",
  style = {},
  animateBy = "words",
  replayKey,
  prefix,
  suffix,
}: BlurTextProps) {
  const prefersReducedMotion = useReducedMotion();

  const elements = useMemo(() => {
    if (animateBy === "words") {
      return text.split(/(\s+)/);
    }
    return text.split("");
  }, [text, animateBy]);

  if (prefersReducedMotion) {
    return (
      <span className={className} style={style}>
        {prefix}
        {text}
        {suffix}
      </span>
    );
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay / 1000,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      filter: "blur(8px)",
      opacity: 0,
      y: 6,
    },
    visible: {
      filter: "blur(0px)",
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.28,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.span
      key={replayKey}
      className={`inline ${className}`}
      style={style}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {prefix && (
        <motion.span variants={itemVariants} className="inline-block">
          {prefix}
        </motion.span>
      )}
      {elements.map((el, i) => (
        <motion.span
          key={i}
          variants={itemVariants}
          className="inline-block"
        >
          {el === " " ? "\u00A0" : el}
        </motion.span>
      ))}
      {suffix && (
        <motion.span variants={itemVariants} className="inline-block">
          {suffix}
        </motion.span>
      )}
    </motion.span>
  );
}
