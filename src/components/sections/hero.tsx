import Image from "next/image";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { Cta, ImageAsset } from "./types";

export interface HeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: Cta;
  secondaryCta?: Cta;
  scrollLabel: string;
  backgroundImage?: ImageAsset;
  featuredImage?: ImageAsset;
  /** Short facts shown under the CTAs, e.g. "250+ Clients" (from the home stats). */
  highlights?: string[];
  /** Office cities shown at the right of the facts bar (from site.yaml). */
  locations?: string[];
  /** Short words at the bottom right, joined by dots (from home.yaml). */
  keywords?: string[];
}

/** Entrance is CSS-only (`rise`) so the hero is readable immediately, without JavaScript. */
export function Hero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  scrollLabel,
  backgroundImage,
  featuredImage,
  highlights = [],
  locations = [],
  keywords = [],
}: HeroProps) {
  const bg = backgroundImage ?? featuredImage;

  return (
    <section className="relative flex min-h-dvh w-full flex-col justify-between bg-primary pt-28 pb-6 text-primary-foreground sm:pt-36 sm:pb-8">
      {/* 100vh Cinematic Background Image with balanced lighting */}
      {bg ? (
        <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
          <Image
            src={bg.src}
            alt={bg.alt}
            fill
            priority
            className="h-full w-full object-cover object-center scale-105"
          />
          {/* Subtle cinematic overlays for text contrast without drowning out the photograph */}
          <div className="absolute inset-0 bg-primary/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/55 to-primary/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-primary/50" />
        </div>
      ) : (
        <div className="hero-atmosphere absolute inset-0 z-0" />
      )}

      <Container className="relative z-10 flex flex-1 flex-col justify-between">
        <div>
          <SectionLabel tone="inverse" className="rise">
            {eyebrow}
          </SectionLabel>

          <h1 className="rise rise-1 mt-6 max-w-5xl break-words text-display font-normal tracking-tight">
            {title}
          </h1>

          <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-12 lg:items-end">
            <p className="rise rise-2 max-w-2xl text-lead font-light text-primary-foreground/90 leading-relaxed lg:col-span-7">
              {subtitle}
            </p>
            <div className="rise rise-3 flex flex-wrap items-center gap-4 lg:col-span-5 lg:justify-end">
              <Button asChild variant="accent" size="lg">
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              {secondaryCta ? (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rise rise-3 mt-8">
          {/* Facts and office cities, both from content */}
          <div className="flex flex-wrap items-center justify-between gap-6 border-t border-primary-foreground/20 pt-6">
            <div className="flex flex-wrap items-center gap-6 text-label uppercase tracking-label text-primary-foreground/80">
              {highlights.map((item, i) => (
                <div key={item} className="flex items-center gap-2">
                  <span className={i % 2 === 0 ? "size-2 rounded-pill bg-accent" : "size-2 rounded-pill bg-secondary"} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {locations.length > 0 ? (
              <div className="hidden rounded-pill border border-primary-foreground/25 bg-primary/60 px-4 py-1.5 text-label uppercase tracking-label text-secondary backdrop-blur-md sm:block">
                [ {locations.join(" • ")} ]
              </div>
            ) : null}
          </div>

          {/* Bottom Scroll Indicator Bar */}
          <div className="mt-6 flex items-center justify-between border-t border-primary-foreground/20 pt-4 text-label uppercase tracking-label text-primary-foreground/80">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-pill border border-primary-foreground/40">
                <ArrowDown aria-hidden="true" className="size-3.5 animate-bounce" />
              </span>
              <span>{scrollLabel}</span>
            </div>
            {keywords.length > 0 ? (
              <span className="hidden text-primary-foreground/50 sm:inline">
                {keywords.join(" • ")}
              </span>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
