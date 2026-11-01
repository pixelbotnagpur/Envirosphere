"use client";

import { animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { duration, ease } from "@/lib/motion";
import { CURVE_VIEWBOX, curvePathD, curvePoint } from "./route-leaf-path";

/** Leaf head stays this far inside the edges so it never sits half-clipped at the end of the line. */
const EDGE_INSET = 0.035;
const PATH_D = curvePathD();

interface Box {
  width: number;
  height: number;
}

/** Maps trip progress to a point on the curve in px, plus the tangent angle. */
function pointFor(p: number, box: Box, lag = 0) {
  const t = Math.min(1, Math.max(0, p - lag));
  const along = EDGE_INSET + (1 - EDGE_INSET * 2) * t;
  const aspect = box.height > 0 ? box.width / box.height : 1;
  const pt = curvePoint(along, aspect);
  return { x: pt.x * box.width, y: pt.y * box.height, angle: pt.angle };
}

/** Rides the curve behind the leaf, `lag` of the trip late, so it reads as a trail. */
function Follower({
  progress,
  box,
  lag,
  peak,
  className,
  children,
}: {
  progress: MotionValue<number>;
  box: { current: Box };
  lag: number;
  peak: number;
  className: string;
  children?: ReactNode;
}) {
  const x = useTransform(progress, (p) => pointFor(p, box.current, lag).x);
  const y = useTransform(progress, (p) => pointFor(p, box.current, lag).y);
  const opacity = useTransform(progress, (p) => (p <= lag ? 0 : Math.min(peak, (p - lag) * 12 * peak)));
  return (
    <motion.span aria-hidden="true" style={{ x, y, opacity }} className={className}>
      {children}
    </motion.span>
  );
}

/**
 * Decorative curtain artwork: a hairline river-like line that draws left to right while a leaf
 * rides its head, with two small droplets trailing behind. Everything is driven by one progress value
 * and animated with transform, opacity and clip-path only. Carries no text.
 */
export function RouteLeaf() {
  const progress = useMotionValue(0);
  const pulse = useMotionValue(1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const box = useRef<Box>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      box.current = { width: r.width, height: r.height };
      progress.set(progress.get());
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [progress]);

  useEffect(() => {
    let idle: ReturnType<typeof animate> | null = null;
    const trip = animate(progress, 1, { duration: duration.travel, ease: ease.inOutQuart });
    trip.then(() => {
      // Waiting for a slow route: the leaf breathes gently instead of freezing.
      idle = animate(pulse, [1, 0.65, 1], {
        duration: duration.slow,
        ease: ease.inOutQuart,
        repeat: Infinity,
      });
    });
    return () => {
      trip.stop();
      idle?.stop();
    };
  }, [progress, pulse]);

  const x = useTransform(progress, (p) => pointFor(p, box.current).x);
  const y = useTransform(progress, (p) => pointFor(p, box.current).y);
  // The line is revealed with a clip, not a dash offset: with a stretched non-scaling stroke the dash
  // length would not match the leaf's position, whereas the curve's x is linear in progress.
  const drawn = useTransform(progress, (p) => {
    const head = EDGE_INSET + (1 - EDGE_INSET * 2) * p;
    return `inset(-50% ${((1 - head) * 100).toFixed(2)}% -50% 0%)`;
  });
  const rotate = useTransform(progress, (p) => pointFor(p, box.current).angle + 9 * Math.sin(p * 11));

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      data-transition-art
      className="pointer-events-none absolute inset-x-0 top-1/2 h-40 -translate-y-1/2 text-primary-foreground/30"
    >
      <motion.svg
        viewBox={`0 0 ${CURVE_VIEWBOX.width} ${CURVE_VIEWBOX.height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
        fill="none"
        style={{ clipPath: drawn }}
      >
        <path
          d={PATH_D}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </motion.svg>
      <div className="absolute left-0 top-1/2">
        <Follower progress={progress} box={box} lag={0.12} peak={0.35} className="absolute -ml-1 -mt-1 size-2 rounded-pill bg-accent" />
        <Follower progress={progress} box={box} lag={0.06} peak={0.6} className="absolute -ml-0.75 -mt-0.75 size-1.5 rounded-pill bg-accent" />
        <motion.div
          data-transition-leaf
          style={{ x, y, rotate, opacity: pulse }}
          className="absolute -ml-5 -mt-3 h-6 w-10 text-accent"
        >
          <svg viewBox="0 0 24 14" className="size-full overflow-visible" aria-hidden="true">
            <path d="M0.5 7 C4 0.5 15 -0.5 23.5 7 C15 13.5 5 14.5 0.5 7 Z" fill="currentColor" />
            <path d="M0.5 7 L19 7" className="stroke-primary" strokeWidth={0.7} strokeLinecap="round" fill="none" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
