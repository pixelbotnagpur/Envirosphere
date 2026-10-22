"use client";

import { motion, useReducedMotion, useScroll, useTransform, type HTMLMotionProps } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export interface ParallaxProps extends Omit<HTMLMotionProps<"div">, "style" | "ref"> {
  /** Travel in percent of the element's height, each direction. */
  range?: number;
}

/** Clips its child and moves it slower than the page. The child is scaled up just enough to never show a gap. */
export function Parallax({ range = 8, className, children, ...props }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${range}%`, `${-range}%`]);
  const scale = 1 + (range * 2) / 100;

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div className="h-full w-full" style={reduced ? undefined : { y, scale }} {...props}>
        {children}
      </motion.div>
    </div>
  );
}
