"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface CounterProps extends Omit<React.ComponentProps<"span">, "children"> {
  value: number;
  /** BCP 47 locale from site.yaml; required so server and browser format identically. */
  locale: string;
}

/** Shows the final number immediately, then counts up from 0 once when it scrolls into view. */
export function Counter({ value, locale, className, ...props }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, {
      duration: duration.slow * 2,
      ease: ease.outExpo,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, reduced, value]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)} {...props}>
      {new Intl.NumberFormat(locale).format(display)}
    </span>
  );
}
