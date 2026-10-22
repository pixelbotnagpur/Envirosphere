"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { ScrollStory } from "@/components/motion/scroll-story";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";

export interface ProcessProps {
  index?: string;
  label: string;
  heading: string;
  steps: { title: string; body: string }[];
}

const pad = (value: number, size: number) => String(value).padStart(size, "0");

function PinnedStep({
  position,
  total,
  progress,
  title,
  body,
}: {
  position: number;
  total: number;
  progress: MotionValue<number>;
  title: string;
  body: string;
}) {
  // The step nearest the scroll position is fully lit; the others fade to a quiet floor.
  const opacity = useTransform(progress, (value) =>
    Math.min(1, Math.max(0.2, 1 - Math.abs(value * total - (position + 0.5)) * 1.4)),
  );
  return (
    <motion.li
      style={{ opacity }}
      className="grid grid-cols-[4rem_1fr] gap-4 border-t border-primary-foreground/20 py-6"
    >
      <span className="text-label uppercase tracking-label tabular-nums text-secondary">{pad(position + 1, 3)}</span>
      <div>
        <h3 className="text-h3">{title}</h3>
        <p className="mt-3 max-w-md text-primary-foreground/80">{body}</p>
      </div>
    </motion.li>
  );
}

function PinnedCounter({ progress, total }: { progress: MotionValue<number>; total: number }) {
  const current = useTransform(progress, (value) => pad(Math.min(total, Math.floor(value * total) + 1), 2));
  return (
    <p className="font-heading text-display tabular-nums">
      <motion.span>{current}</motion.span>
      <span className="text-primary-foreground/40"> / {pad(total, 2)}</span>
    </p>
  );
}

export function Process({ index, label, heading, steps }: ProcessProps) {
  return (
    <section className="bg-primary text-primary-foreground">
      <ScrollStory
        steps={steps.length}
        renderStacked={() => (
          <Container className="py-section">
            <SectionLabel tone="inverse" index={index}>
              {label}
            </SectionLabel>
            <h2 className="mt-8 max-w-3xl text-h2">{heading}</h2>
            <ol className="mt-16 flex flex-col">
              {steps.map((step, position) => (
                <li
                  key={step.title}
                  className="grid grid-cols-[4rem_1fr] gap-4 border-t border-primary-foreground/20 py-6"
                >
                  <span className="text-label uppercase tracking-label tabular-nums text-secondary">
                    {pad(position + 1, 3)}
                  </span>
                  <div>
                    <h3 className="text-h3">{step.title}</h3>
                    <p className="mt-3 max-w-md text-primary-foreground/80">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        )}
        renderPinned={(progress) => (
          <div className="flex h-full flex-col justify-center">
            <Container className="grid items-center gap-16 lg:grid-cols-2">
              <div>
                <SectionLabel tone="inverse" index={index}>
                  {label}
                </SectionLabel>
                <h2 className="mt-8 text-h2">{heading}</h2>
                <div className="mt-12 flex items-center gap-6">
                  <div className="h-24 w-px bg-primary-foreground/20">
                    <motion.div style={{ scaleY: progress }} className="h-full w-px origin-top bg-accent" />
                  </div>
                  <PinnedCounter progress={progress} total={steps.length} />
                </div>
              </div>
              <ol className="flex flex-col">
                {steps.map((step, position) => (
                  <PinnedStep
                    key={step.title}
                    position={position}
                    total={steps.length}
                    progress={progress}
                    title={step.title}
                    body={step.body}
                  />
                ))}
              </ol>
            </Container>
          </div>
        )}
      />
    </section>
  );
}
