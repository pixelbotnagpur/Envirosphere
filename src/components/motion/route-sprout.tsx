"use client";

import { motion } from "motion/react";
import { ease } from "@/lib/motion";

const LEAF_PATH = "M0.5 7 C4 0.5 15 -0.5 23.5 7 C15 13.5 5 14.5 0.5 7 Z";

/** Seconds. The whole drawing is finished well inside `duration.travel`, the least time the curtain stays up. */
const at = {
  ring: { delay: 0.08, duration: 0.25 },
  drop: { delay: 0.12, duration: 0.22 },
  stem: { delay: 0.22, duration: 0.2 },
  leaves: { delay: 0.32, duration: 0.25 },
  ripple: { delay: 0.6, duration: 0.9 },
} as const;

function Leaf({ side }: { side: "left" | "right" }) {
  const left = side === "left";
  return (
    <motion.span
      data-transition-leaf=""
      initial={{ scale: 0, rotate: 0 }}
      animate={{ scale: 1, rotate: left ? 32 : -32 }}
      transition={{ ...at.leaves, ease: ease.outExpo }}
      className={`absolute top-9 h-4 w-7 ${left ? "left-7 origin-right" : "left-14 origin-left"}`}
    >
      <svg viewBox="0 0 24 14" className="size-full overflow-visible" aria-hidden="true">
        <path d={LEAF_PATH} fill="currentColor" />
      </svg>
    </motion.span>
  );
}

/**
 * Decorative curtain artwork, centered on the screen: a droplet falls onto a stem, which grows two leaves
 * inside a thin ring (a ripple keeps going if the next page is slow). It is drawn in about half a second
 * with transform and opacity only, and carries no text.
 */
export function RouteSprout() {
  return (
    <div
      aria-hidden="true"
      data-transition-art=""
      className="pointer-events-none absolute inset-0 grid place-items-center text-accent"
    >
      <div data-transition-sprout="" className="relative size-28 scale-150">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...at.ring, ease: ease.outExpo }}
          className="absolute inset-0 rounded-pill border border-primary-foreground/30"
        />
        <motion.span
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: 1.25, opacity: [0, 0.35, 0] }}
          transition={{ ...at.ripple, ease: ease.outExpo, repeat: Infinity }}
          className="absolute inset-0 rounded-pill border border-accent"
        />
        <motion.span
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 28, opacity: [0, 1, 0] }}
          transition={{ ...at.drop, ease: ease.inOutQuart, times: [0, 0.3, 1] }}
          className="absolute top-3 left-14 -ml-1 size-2 rounded-pill bg-primary-foreground"
        />
        <motion.span
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ ...at.stem, ease: ease.outExpo }}
          className="absolute top-11 left-14 -ml-px h-10 w-0.5 origin-bottom rounded-pill bg-accent"
        />
        <Leaf side="left" />
        <Leaf side="right" />
      </div>
    </div>
  );
}
