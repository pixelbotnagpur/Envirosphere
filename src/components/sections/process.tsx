"use client";

import { motion, useMotionValueEvent, type MotionValue } from "motion/react";
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

/** Clip-path mask: closed shows nothing, open shows everything. A picture opens upward from its bottom edge. */
const OPEN = "inset(0% 0% 0% 0%)";
const CLOSED = "inset(100% 0% 0% 0%)";
const reveal = { duration: duration.slow, ease: ease.inOutQuart } as const;

function StepPicture({ image }: { image?: ImageAsset }) {
  if (!image) return <ImagePlaceholder className="h-full w-full" />;
  return (
    <Image
      src={image.src}
      alt=""
      width={image.width}
      height={image.height}
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
            {steps.map((step, position) => {
              const open = position <= active;
              return (
                <motion.div
                  key={step.title}
                  data-process-image=""
                  data-open={open}
                  initial={false}
                  animate={{ clipPath: open ? OPEN : CLOSED }}
                  transition={reveal}
                  style={{ zIndex: position }}
                  className="absolute inset-0"
                >
                  <StepPicture image={step.image} />
                </motion.div>
              );
            })}
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
            {/* The outer box is what scrolls into view; the inner one is masked, because a fully masked
                element is never reported as "in view". */}
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
                variants={{ closed: { clipPath: CLOSED }, open: { clipPath: OPEN, transition: reveal } }}
                className="static-when-reduced h-full w-full"
              >
                <StepPicture image={step.image} />
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
