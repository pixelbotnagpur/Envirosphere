"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { duration, ease } from "@/lib/motion";

type Controlled =
  | "initial"
  | "animate"
  | "whileInView"
  | "whileHover"
  | "whileTap"
  | "whileFocus"
  | "whileDrag"
  | "exit"
  | "variants"
  | "viewport"
  | "transition"
  | "style"
  | "layout";

export interface RevealProps extends Omit<HTMLMotionProps<"div">, Controlled> {
  /** Seconds to wait before the reveal starts (for staggering siblings). */
  delay?: number;
  /** Starting vertical offset in px. */
  y?: number;
}

/**
 * Below-the-fold entrance. Above-the-fold content uses the CSS `rise` utility instead, so it is
 * never served hidden. Reduced motion is handled globally by <MotionConfig reducedMotion="user">.
 */
export function Reveal({ delay = 0, y = 24, children, ...props }: RevealProps) {
  return (
    <motion.div
      data-reveal=""
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: duration.slow, delay, ease: ease.outExpo }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
