import { useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";

/** Scroll distance (px) from the top before the header may hide. */
export const HIDE_AFTER = 80;
/** Minimum scroll movement (px) that counts as a direction change; smaller moves are ignored to avoid jitter. */
export const MIN_DELTA = 8;

export interface ScrollDirectionState {
  hidden: boolean;
  lastY: number;
}

export interface ScrollDirectionOptions {
  threshold?: number;
  delta?: number;
}

/** Pure transition: hide on a downward move past the threshold, show on an upward move or near the top. */
export function nextScrollState(
  prev: ScrollDirectionState,
  y: number,
  { threshold = HIDE_AFTER, delta = MIN_DELTA }: ScrollDirectionOptions = {},
): ScrollDirectionState {
  if (y < threshold) return { hidden: false, lastY: y };
  const diff = y - prev.lastY;
  if (Math.abs(diff) < delta) return prev;
  return { hidden: diff > 0, lastY: y };
}

/**
 * True while the user is scrolling down past the threshold. Reads Motion's scroll value, which follows
 * Lenis because Lenis drives the real window scroll. `enabled: false` keeps it false (reduced motion, open menu).
 */
export function useScrollHidden(enabled = true, options: ScrollDirectionOptions = {}): boolean {
  const { scrollY } = useScroll();
  const [state, setState] = useState<ScrollDirectionState>({ hidden: false, lastY: 0 });

  useMotionValueEvent(scrollY, "change", (y) => {
    setState((prev) => {
      const next = nextScrollState(prev, y, options);
      return next.hidden === prev.hidden && next.lastY === prev.lastY ? prev : next;
    });
  });

  return enabled && state.hidden;
}
