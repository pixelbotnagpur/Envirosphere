"use client";

import { cubicBezier, motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { ScrollStory } from "@/components/motion/scroll-story";
import { Container } from "@/components/ui/container";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { SectionLabel } from "@/components/ui/section-label";
import { duration, ease } from "@/lib/motion";
import type { ImageAsset } from "./types";

export interface ProcessStep {
  title: string;
  body: string;
  /** The picture for this step. A placeholder box is shown when it is missing. */
  image?: ImageAsset;
}

export interface ProcessProps {
  index?: string;
  label: string;
  heading: string;
  steps: ProcessStep[];
}

const pad = (value: number, size: number) => String(value).padStart(size, "0");

/**
 * Mask reveal with transforms only (smooth, runs on the graphics card): a box with `overflow: hidden`
 * slides up from below while the picture inside slides down by the same amount, so the picture stays
 * still and the window opens upward. Animating `clip-path` instead repaints the big photo on every frame.
 */
const mask = cubicBezier(...ease.inOutQuart);
const reveal = { duration: duration.slow, ease: ease.inOutQuart } as const;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Photos are loaded up front at low priority. Lazy loading never starts for a picture that is still
 * hidden inside its mask, so it would only begin to load once revealed and flash empty.
 */
function StepPicture({ image }: { image?: ImageAsset }) {
  if (!image) return <ImagePlaceholder className="h-full w-full" />;
  return (
    <Image
      src={image.src}
      alt=""
      width={image.width}
      height={image.height}
      loading="eager"
      fetchPriority="low"
      decoding="async"
      className="h-full w-full object-cover"
    />
  );
}

function StepCopy({ position, step }: { position: number; step: ProcessStep }) {
  return (
    <>
      <span className="text-label uppercase tracking-label tabular-nums text-secondary transition-colors duration-(--duration-base) group-data-[active=true]:text-accent">
        {pad(position + 1, 3)}
      </span>
      <div>
        <h3 className="text-h4">{step.title}</h3>
        <p className="mt-2 max-w-md text-sm font-light text-primary-foreground/80">{step.body}</p>
      </div>
    </>
  );
}

/** One picture of the pinned stage. Its reveal is tied to the scroll, so it never lags behind or restarts. */
function PinnedLayer({
  progress,
  position,
  total,
  open,
  image,
}: {
  progress: MotionValue<number>;
  position: number;
  total: number;
  open: boolean;
  image?: ImageAsset;
}) {
  // The first picture is always there. Each later one starts opening half a step before its card lights up
  // and is fully open exactly when it does.
  const revealed = useTransform(progress, (value) =>
    position === 0 ? 1 : clamp01((value * total - (position - 0.5)) / 0.5),
  );
  const boxY = useTransform(revealed, [0, 1], ["100%", "0%"], { ease: mask });
  const pictureY = useTransform(revealed, [0, 1], ["-100%", "0%"], { ease: mask });
  return (
    <motion.div
      data-process-image=""
      data-open={open}
      style={{ y: boxY, zIndex: position }}
      className="absolute inset-0 overflow-hidden will-change-transform"
    >
      <motion.div style={{ y: pictureY }} className="h-full w-full will-change-transform">
        <StepPicture image={image} />
      </motion.div>
    </motion.div>
  );
}

interface PinnedProps extends Omit<ProcessProps, "steps"> {
  steps: ProcessStep[];
  progress: MotionValue<number>;
}

/** Desktop: the picture on the left is revealed as the scroll reaches each step, and that step's card is lit. */
function PinnedProcess({ index, label, heading, steps, progress }: PinnedProps) {
  const [active, setActive] = useState(0);
  useMotionValueEvent(progress, "change", (value) => {
    setActive(Math.min(steps.length - 1, Math.max(0, Math.floor(value * steps.length))));
  });

  return (
    <div className="flex h-full items-center">
      <Container className="grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div
            data-process-stage=""
            aria-hidden="true"
            className="relative h-[70vh] max-h-[44rem] w-full overflow-hidden rounded-card bg-primary-foreground/10"
          >
            {steps.map((step, position) => (
              <PinnedLayer
                key={step.title}
                progress={progress}
                position={position}
                total={steps.length}
                open={position <= active}
                image={step.image}
              />
            ))}
            <span className="absolute bottom-4 left-4 z-20 rounded-pill border border-primary-foreground/25 bg-primary/80 px-3 py-1 text-micro uppercase tracking-label tabular-nums text-primary-foreground backdrop-blur-xs">
              {pad(active + 1, 2)} / {pad(steps.length, 2)}
            </span>
          </div>
        </div>

        <div className="lg:col-span-7">
          <SectionLabel tone="inverse" index={index}>
            {label}
          </SectionLabel>
          <h2 className="mt-6 text-h2">{heading}</h2>
          <ol className="mt-10 flex flex-col gap-3">
            {steps.map((step, position) => (
              <motion.li
                key={step.title}
                data-process-step=""
                data-active={position === active}
                initial={false}
                animate={{ opacity: position === active ? 1 : 0.45 }}
                transition={{ duration: duration.base, ease: ease.outExpo }}
                className="group grid grid-cols-[3.5rem_1fr] gap-4 rounded-card border border-primary-foreground/15 px-6 py-5 transition-colors duration-(--duration-base) data-[active=true]:border-accent data-[active=true]:bg-primary-foreground/10"
              >
                <StepCopy position={position} step={step} />
              </motion.li>
            ))}
          </ol>
        </div>
      </Container>
    </div>
  );
}

/** Phones, short screens and reduced motion: a plain list, each picture revealed as it scrolls into view. */
function StackedProcess({ index, label, heading, steps }: ProcessProps) {
  return (
    <Container className="py-section">
      <SectionLabel tone="inverse" index={index}>
        {label}
      </SectionLabel>
      <h2 className="mt-8 max-w-3xl text-h2">{heading}</h2>
      <ol className="mt-12 flex flex-col gap-10">
        {steps.map((step, position) => (
          <li key={step.title} className="group">
            {/* Same transform mask as the pinned stage: the box slides up while the picture slides down. */}
            <motion.div
              aria-hidden="true"
              initial="closed"
              whileInView="open"
              viewport={{ once: true, amount: "some" }}
              variants={{ closed: {}, open: {} }}
              className="aspect-[16/10] overflow-hidden rounded-card bg-primary-foreground/10"
            >
              <motion.div
                data-process-image=""
                variants={{ closed: { y: "100%" }, open: { y: "0%", transition: reveal } }}
                className="static-when-reduced h-full w-full overflow-hidden will-change-transform"
              >
                <motion.div
                  variants={{ closed: { y: "-100%" }, open: { y: "0%", transition: reveal } }}
                  className="static-when-reduced h-full w-full will-change-transform"
                >
                  <StepPicture image={step.image} />
                </motion.div>
              </motion.div>
            </motion.div>
            <div className="mt-5 grid grid-cols-[3.5rem_1fr] gap-4 border-t border-primary-foreground/35 pt-5">
              <StepCopy position={position} step={step} />
            </div>
          </li>
        ))}
      </ol>
    </Container>
  );
}

export function Process({ index, label, heading, steps }: ProcessProps) {
  return (
    <section className="bg-primary text-primary-foreground">
      <ScrollStory
        steps={steps.length}
        renderStacked={() => <StackedProcess index={index} label={label} heading={heading} steps={steps} />}
        renderPinned={(progress) => (
          <PinnedProcess index={index} label={label} heading={heading} steps={steps} progress={progress} />
        )}
      />
    </section>
  );
}
