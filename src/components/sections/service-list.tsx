"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { duration, ease } from "@/lib/motion";
import type { ImageAsset } from "./types";

export interface ServiceRow {
  slug: string;
  title: string;
  summary: string;
  /** The small picture in the row. A placeholder box is shown when it is missing. */
  image?: ImageAsset;
}

type RowState = "rest" | "hover" | "dim";

const MotionLink = motion.create(Link);

const settle = { duration: duration.slow, ease: ease.outExpo } as const;
const quick = { duration: duration.base, ease: ease.outExpo } as const;
const spring = { type: "spring", stiffness: 240, damping: 22, mass: 0.7 } as const;

// Everything below moves with transform, opacity or filter only (rule 34); the row itself never changes size.
const rowVariants: Variants = {
  rest: { opacity: 1, transition: quick },
  hover: { opacity: 1, transition: quick },
  dim: { opacity: 0.4, transition: quick },
};
/** Forest floods the row from the bottom edge. */
const fillVariants: Variants = {
  rest: { scaleY: 0, transition: quick },
  hover: { scaleY: 1, transition: settle },
  dim: { scaleY: 0, transition: quick },
};
const titleVariants: Variants = {
  rest: { x: 0, transition: spring },
  hover: { x: "0.75rem", transition: spring },
  dim: { x: 0, transition: spring },
};
/** The picture is revealed left to right while its row is hovered, and settles from slightly zoomed in. */
const revealVariants = (reduced: boolean | null): Variants => {
  const into = reduced ? { duration: 0 } : settle;
  const out = reduced ? { duration: 0 } : quick;
  return {
    rest: { clipPath: "inset(0 100% 0 0)", transition: out },
    hover: { clipPath: "inset(0 0% 0 0)", transition: into },
    dim: { clipPath: "inset(0 100% 0 0)", transition: out },
  };
};
const zoomVariants = (reduced: boolean | null): Variants => ({
  rest: { scale: 1.25, transition: reduced ? { duration: 0 } : quick },
  hover: { scale: 1, transition: reduced ? { duration: 0 } : settle },
  dim: { scale: 1.25, transition: reduced ? { duration: 0 } : quick },
});
const arrowFillVariants: Variants = {
  rest: { scale: 0, transition: quick },
  hover: { scale: 1, transition: spring },
  dim: { scale: 0, transition: quick },
};
const arrowVariants: Variants = {
  rest: { rotate: 0, transition: spring },
  hover: { rotate: 45, transition: spring },
  dim: { rotate: 0, transition: spring },
};

interface RowProps {
  service: ServiceRow;
  position: number;
  state: RowState;
  onActivate: (position: number) => void;
}

function Row({ service, position, state, onActivate }: RowProps) {
  const reduced = useReducedMotion();
  return (
    <li className="border-t border-border">
      <Reveal>
        <MotionLink
          href={`/services/${service.slug}/`}
          data-state={state}
          initial={false}
          animate={state}
          variants={rowVariants}
          className="group relative isolate block overflow-hidden transition-colors duration-(--duration-base) ease-out-expo data-[state=hover]:text-primary-foreground"
          onPointerEnter={(event) => {
            if (event.pointerType !== "touch") onActivate(position);
          }}
          onFocus={() => onActivate(position)}
        >
          <motion.span
            aria-hidden="true"
            data-row-fill=""
            variants={fillVariants}
            style={{ originY: 1 }}
            className="absolute inset-0 -z-10 bg-primary"
          />
          <Container className="grid grid-cols-[2.25rem_1fr_1.5rem] items-center gap-x-4 py-5 md:grid-cols-[4rem_1fr_8rem_2.25rem] md:gap-x-6 lg:grid-cols-[5rem_1.1fr_10rem_1fr_2.5rem] lg:py-4">
            <span
              data-col="number"
              className="text-label uppercase tracking-label tabular-nums text-muted-foreground transition-colors duration-(--duration-base) group-data-[state=hover]:text-secondary"
            >
              {String(position + 1).padStart(3, "0")}
            </span>
            <motion.span data-col="title" variants={titleVariants} className="font-heading text-h4 md:text-h3">
              {service.title}
            </motion.span>
            <motion.span
              data-col="image"
              aria-hidden="true"
              variants={revealVariants(reduced)}
              className="show-on-touch relative z-10 hidden h-20 w-full overflow-hidden bg-secondary md:block lg:h-24"
            >
              <motion.span variants={zoomVariants(reduced)} className="block h-full w-full">
                {service.image ? (
                  <Image
                    src={service.image.src}
                    alt=""
                    width={service.image.width}
                    height={service.image.height}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlaceholder className="h-full w-full" />
                )}
              </motion.span>
            </motion.span>
            <span
              data-col="description"
              className="hidden text-muted-foreground transition-colors duration-(--duration-base) group-data-[state=hover]:text-primary-foreground/80 lg:block"
            >
              {service.summary}
            </span>
            <span
              data-col="arrow"
              aria-hidden="true"
              className="relative grid size-6 place-items-center overflow-hidden rounded-pill border border-border transition-colors duration-(--duration-base) group-data-[state=hover]:border-accent md:size-9 lg:size-10"
            >
              <motion.span variants={arrowFillVariants} className="absolute inset-0 rounded-pill bg-accent" />
              <motion.span
                variants={arrowVariants}
                className="relative text-foreground transition-colors duration-(--duration-base) group-data-[state=hover]:text-accent-foreground"
              >
                <ArrowUpRight className="size-3 md:size-4" />
              </motion.span>
            </span>
          </Container>
        </MotionLink>
      </Reveal>
    </li>
  );
}

/**
 * The numbered service rows: number, title, picture, description, arrow. The row under the pointer
 * (or keyboard focus) fills with Forest, reveals its picture and the others fade back. Touch screens have
 * no hover, so there the picture is simply always shown (tablet and up).
 */
export function ServiceList({ items }: { items: ServiceRow[] }) {
  const [active, setActive] = useState<number | null>(null);
  const stateOf = (position: number): RowState => (active === null ? "rest" : active === position ? "hover" : "dim");

  return (
    <ol
      className="mt-16 border-b border-border"
      onPointerLeave={() => setActive(null)}
      onBlur={() => setActive(null)}
    >
      {items.map((service, position) => (
        <Row key={service.slug} service={service} position={position} state={stateOf(position)} onActivate={setActive} />
      ))}
    </ol>
  );
}
