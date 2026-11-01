import Image from "next/image";
import Link from "next/link";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { ScrollWords } from "@/components/motion/scroll-words";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { Cta, ImageAsset } from "./types";

export interface AboutProps {
  index?: string;
  label: string;
  heading: string;
  paragraphs: string[];
  image: ImageAsset;
  cta: Cta;
  /** Accreditation pills shown under the text (from site.yaml). */
  accreditations?: string[];
  /** One real figure shown on the photo (from the home stats). */
  highlight?: { value: string; label: string };
}

export function About({ index, label, heading, paragraphs, image, cta, accreditations = [], highlight }: AboutProps) {
  return (
    <section className="py-section">
      <Container className="grid items-center gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionLabel index={index}>{label}</SectionLabel>
          <h2 className="mt-8 text-h2">
            <ScrollWords text={heading} />
          </h2>
          <div className="mt-12 flex max-w-3xl flex-col gap-6 text-lead font-light">
            {paragraphs.map((paragraph) => (
              <Reveal key={paragraph}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>

          {accreditations.length > 0 ? (
            <Reveal>
              <div className="mt-10 flex flex-wrap gap-3">
                {accreditations.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-pill border border-border bg-surface px-4 py-1.5 text-label uppercase tracking-label text-muted-foreground"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </Reveal>
          ) : null}

          <Reveal>
            <Button asChild variant="outline" className="mt-10">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          </Reveal>
        </div>
        <div className="lg:col-span-5">
          <div className="relative">
            <Parallax className="aspect-[4/5] overflow-hidden rounded-card border border-border bg-surface shadow-card">
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className="h-full w-full object-cover transition-transform duration-(--duration-slow) ease-out-expo hover:scale-105"
              />
            </Parallax>
            {highlight ? (
              <div className="absolute -bottom-6 -left-6 hidden max-w-xs rounded-card border border-border/80 bg-background/95 p-6 shadow-card backdrop-blur-md sm:block">
                <p className="font-heading text-h3">{highlight.value}</p>
                <p className="mt-1 text-label uppercase tracking-label text-muted-foreground">
                  {highlight.label}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
