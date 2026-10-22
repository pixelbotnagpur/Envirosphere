"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

export interface ScrollWordsProps extends React.ComponentProps<"span"> {
  text: string;
}

function Word({
  word,
  progress,
  range,
  active,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
  active: boolean;
}) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return (
    <motion.span data-word="" style={active ? { opacity } : undefined}>
      {word}
    </motion.span>
  );
}

/**
 * Words brighten one after another as the text scrolls through the viewport.
 * Fully opaque on the server, without JS and with reduced motion; the effect only starts after hydration.
 */
export function ScrollWords({ text, className, ...props }: ScrollWordsProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.4"] });
  const words = text.split(" ");

  return (
    <span ref={ref} className={cn("inline", className)} {...props}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`}>
          <Word
            word={word}
            progress={scrollYProgress}
            range={[index / words.length, (index + 1) / words.length]}
            active={hydrated && !reduced}
          />
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
