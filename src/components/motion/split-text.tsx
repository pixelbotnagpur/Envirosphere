"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface SplitTextProps extends React.ComponentProps<"span"> {
  text: string;
  /** Seconds before the first word starts. */
  delay?: number;
  /** Seconds between words. */
  stagger?: number;
}

/** Word-by-word masked rise. Put it inside a heading: <h2><SplitText text="…" /></h2>. */
export function SplitText({ text, delay = 0, stagger = 0.06, className, ...props }: SplitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: "some" });
  const words = text.split(" ");

  return (
    <span ref={ref} className={cn("inline", className)} {...props}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <span key={`${word}-${index}`}>
            <span className="inline-block overflow-hidden py-[0.08em] align-bottom -my-[0.08em]">
              <motion.span
                data-reveal=""
                className="inline-block"
                initial={{ y: "110%", opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : { y: "110%", opacity: 0 }}
                transition={{ duration: duration.slow, delay: delay + index * stagger, ease: ease.outExpo }}
              >
                {word}
              </motion.span>
            </span>
            {index < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </span>
  );
}
