"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, type PanInfo, type Variants } from "motion/react";
import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { duration, ease } from "@/lib/motion";

export interface TestimonialsProps {
  index?: string;
  label: string;
  heading: string;
  items: { quote: string; name: string; role?: string }[];
  /** Words for the controls; `position` holds {current} and {total}, e.g. "Testimonial {current} of {total}". */
  controls: { previous: string; next: string; position: string };
}

type SlideState = "active" | "before" | "after";

const pad = (value: number) => String(value).padStart(2, "0");
const fill = (template: string, current: number, total: number) =>
  template.replace("{current}", String(current)).replace("{total}", String(total));
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

// Slides wait on the left or right of the active one (the nearest way round the loop), so moving on
// always slides the old quote out one side while the new one arrives from the other.
// The old quote leaves quickly, then the new one arrives, so the two are never both readable.
const leave = { duration: duration.base, ease: ease.outExpo } as const;
const arrive = { duration: duration.slow, delay: 0.15, ease: ease.outExpo } as const;
const slideVariants: Variants = {
  active: { opacity: 1, x: 0, filter: "blur(0px)", transition: arrive },
  before: { opacity: 0, x: "-4rem", filter: "blur(6px)", transition: leave },
  after: { opacity: 0, x: "4rem", filter: "blur(6px)", transition: leave },
};

const SWIPE = 60;

/**
 * One testimonial at a time. Slide with the arrow buttons, the bars, the keyboard (left and right arrows)
 * or by dragging. All slides sit in one grid cell so the section never changes height.
 */
export function Testimonials({ index, label, heading, items, controls }: TestimonialsProps) {
  const [active, setActive] = useState(0);
  const total = items.length;
  const go = (target: number) => setActive(((target % total) + total) % total);

  const stateOf = (position: number): SlideState => {
    const ahead = (position - active + total) % total;
    if (ahead === 0) return "active";
    return ahead <= total / 2 ? "after" : "before";
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") go(active + 1);
    if (event.key === "ArrowLeft") go(active - 1);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE) go(active + 1);
    else if (info.offset.x > SWIPE) go(active - 1);
  };

  return (
    <section className="bg-background py-section">
      <Container>
        <SectionLabel index={index}>{label}</SectionLabel>
        <h2 className="mt-6 max-w-3xl text-h2">{heading}</h2>

        <div
          role="group"
          aria-roledescription="carousel"
          aria-label={heading}
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="relative mt-14"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 left-0 font-heading text-mega leading-none text-secondary select-none"
          >
            &ldquo;
          </span>

          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            dragSnapToOrigin
            onDragEnd={onDragEnd}
            aria-live="polite"
            // Parked slides wait to the side of the active one; clip them so they never widen the page.
            className="grid cursor-grab touch-pan-y overflow-x-clip active:cursor-grabbing"
          >
            {items.map((item, position) => {
              const state = stateOf(position);
              return (
                <motion.figure
                  key={item.name}
                  data-slide=""
                  data-active={state === "active"}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={fill(controls.position, position + 1, total)}
                  aria-hidden={state !== "active"}
                  inert={state !== "active"}
                  variants={slideVariants}
                  initial={false}
                  animate={state}
                  className="col-start-1 row-start-1 flex flex-col justify-between gap-12 pt-12 select-none"
                >
                  <blockquote className="max-w-4xl font-heading text-h2">{item.quote}</blockquote>
                  <figcaption className="flex items-center gap-4">
                    <span
                      aria-hidden="true"
                      className="grid size-12 shrink-0 place-items-center rounded-pill bg-primary text-label tracking-label text-primary-foreground"
                    >
                      {initials(item.name)}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-lead text-foreground">{item.name}</span>
                      {item.role ? <span className="text-sm text-muted-foreground">{item.role}</span> : null}
                    </span>
                  </figcaption>
                </motion.figure>
              );
            })}
          </motion.div>

          <div className="mt-14 flex items-center gap-6 border-t border-border pt-6">
            <p className="shrink-0 text-label uppercase tracking-label tabular-nums text-muted-foreground">
              {pad(active + 1)} / {pad(total)}
            </p>
            <div className="flex flex-1 items-center gap-2">
              {items.map((item, position) => (
                <button
                  key={item.name}
                  type="button"
                  aria-label={fill(controls.position, position + 1, total)}
                  aria-current={position === active}
                  onClick={() => go(position)}
                  className="group flex h-8 flex-1 items-center"
                >
                  <span className="relative block h-0.5 w-full overflow-hidden bg-border">
                    <motion.span
                      data-bar=""
                      initial={false}
                      animate={{ scaleX: position === active ? 1 : 0 }}
                      transition={{ duration: duration.slow, ease: ease.outExpo }}
                      style={{ originX: 0 }}
                      className="absolute inset-0 bg-primary"
                    />
                  </span>
                </button>
              ))}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                aria-label={controls.previous}
                onClick={() => go(active - 1)}
                className="size-12 p-0"
              >
                <ArrowLeft aria-hidden="true" className="size-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-label={controls.next}
                onClick={() => go(active + 1)}
                className="size-12 p-0"
              >
                <ArrowRight aria-hidden="true" className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
