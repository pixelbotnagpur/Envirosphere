"use client";

import { useScroll, type MotionValue } from "motion/react";
import { useRef, type ReactNode } from "react";
import { usePinned } from "@/hooks/use-pinned";

export interface ScrollStoryProps {
  /** Number of steps; sets the scroll distance (100vh per step). */
  steps: number;
  /** Plain layout used on mobile, with reduced motion and before hydration. */
  renderStacked: () => ReactNode;
  /** Pinned layout; receives scroll progress from 0 to 1 across the whole story. */
  renderPinned: (progress: MotionValue<number>) => ReactNode;
  className?: string;
}

function PinnedStory({ steps, renderPinned, className }: Omit<ScrollStoryProps, "renderStacked">) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <div ref={ref} className={className} style={{ height: `${steps * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">{renderPinned(scrollYProgress)}</div>
    </div>
  );
}

/** Scroll-pinned storytelling with a readable stacked fallback. */
export function ScrollStory({ steps, renderStacked, renderPinned, className }: ScrollStoryProps) {
  const pinned = usePinned();
  if (!pinned) return <div className={className}>{renderStacked()}</div>;
  return <PinnedStory steps={steps} renderPinned={renderPinned} className={className} />;
}
