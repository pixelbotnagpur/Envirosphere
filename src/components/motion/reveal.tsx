"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { duration, ease } from "@/lib/motion";

export interface RevealProps
  extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "whileInView" | "viewport" | "transition"> {
  /** Seconds to wait before the reveal starts (for staggering siblings). */
  delay?: number;
  /** Starting vertical offset in px. */
  y?: number;
}

export function Reveal({ delay = 0, y = 24, children, ...props }: RevealProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      data-reveal=""
      initial={{ opacity: 0, y: reduced ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{
        duration: reduced ? duration.fast : duration.slow,
        delay: reduced ? 0 : delay,
        ease: ease.outExpo,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
