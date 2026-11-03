"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { Container } from "@/components/ui/container";
import type { ImageAsset } from "./types";

export interface VisualBreakProps {
  image: ImageAsset;
  /** Big word centered on the photo, revealed while it is pinned. Decorative: the section below carries the real heading. */
  title?: string;
  quote?: string;
  tag?: string;
  location?: string;
  /** The section that slides up over the pinned photo, like a window. */
  children?: ReactNode;
}

/**
 * A full-screen photo that sticks to the top of the screen. While it is pinned (one extra screen of
 * scrolling) the title is revealed through a clip-path mask; then the next section scrolls up over the
 * photo. People who prefer reduced motion get a plain photo band with the title already shown.
 */
export function VisualBreak({ image, title, quote, tag, location, children }: VisualBreakProps) {
  const runway = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // 0 when the photo reaches the top of the screen, 1 after one more screen of scrolling.
  const { scrollYProgress } = useScroll({ target: runway, offset: ["start end", "start start"] });

  const mask = useTransform(scrollYProgress, [0.05, 0.7], ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"]);
  const rise = useTransform(scrollYProgress, [0.05, 0.7], ["30%", "0%"]);
  const tint = useTransform(scrollYProgress, [0, 0.75], [0, 0.6]);
  const zoom = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <div className="relative">
      <div data-stage="" className="sticky top-0 z-0 h-dvh overflow-hidden bg-primary motion-reduce:static motion-reduce:h-[70dvh]">
        <motion.div style={reduced ? undefined : { scale: zoom }} className="static-when-reduced absolute inset-0">
          <Image src={image.src} alt={image.alt} fill sizes="100vw" className="object-cover" />
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/30 to-transparent" />
        <motion.div
          aria-hidden="true"
          data-tint=""
          style={{ opacity: reduced ? 0.35 : tint }}
          className="pointer-events-none absolute inset-0 bg-primary"
        />

        {tag ? (
          <div className="absolute top-24 left-6 flex items-center gap-3 sm:left-10">
            <span className="flex items-center gap-2 rounded-pill border border-primary-foreground/25 bg-primary/80 px-4 py-1.5 text-micro uppercase tracking-label text-primary-foreground backdrop-blur-md">
              <span className="size-1.5 rounded-pill bg-accent" />
              <span>{tag}</span>
            </span>
          </div>
        ) : null}

        {title ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Container className="text-center">
              <motion.p
                data-reveal-title=""
                style={reduced ? undefined : { clipPath: mask }}
                className="static-when-reduced text-balance py-4 font-heading text-mega text-primary-foreground"
              >
                <motion.span style={reduced ? undefined : { y: rise }} className="static-when-reduced block">
                  {title}
                </motion.span>
              </motion.p>
            </Container>
          </div>
        ) : null}

        {quote || location ? (
          <div className="absolute right-6 bottom-8 left-6 flex flex-col justify-between gap-4 border-t border-primary-foreground/20 pt-4 sm:right-10 sm:left-10 sm:flex-row sm:items-end">
            {quote ? <p className="max-w-2xl font-heading text-h3 text-primary-foreground/95">{quote}</p> : null}
            {location ? (
              <span className="shrink-0 text-label uppercase tracking-label text-secondary">{location}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* One extra screen of scrolling while the photo stays pinned and the title is revealed. */}
      <div ref={runway} aria-hidden="true" data-runway="" className="h-dvh motion-reduce:hidden" />

      {/* The window: this section is painted over the pinned photo. */}
      <div data-window="" className="relative z-10 overflow-hidden rounded-t-card">
        {children}
      </div>
    </div>
  );
}
