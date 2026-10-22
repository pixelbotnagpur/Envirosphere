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
  featuredImage?: ImageAsset;
}

/** Entrance is CSS-only (`rise`) so the hero is readable immediately, without JavaScript. */
export function Hero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  scrollLabel,
  featuredImage,
}: HeroProps) {
  return (
    <section className="hero-atmosphere relative flex min-h-screen min-h-dvh w-full flex-col justify-between overflow-hidden bg-primary pt-28 pb-8 text-primary-foreground sm:pt-32 sm:pb-10">
      <Container className="flex flex-1 flex-col justify-between">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <SectionLabel tone="inverse" className="rise">
              {eyebrow}
            </SectionLabel>
            <h1 className="rise rise-1 mt-6 max-w-4xl break-words text-display font-normal tracking-tight">
              {title}
            </h1>
            <p className="rise rise-2 mt-6 max-w-2xl text-lead font-light text-primary-foreground/85 leading-relaxed">
              {subtitle}
            </p>
            <div className="rise rise-3 mt-8 flex flex-wrap items-center gap-4">
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

            <div className="rise rise-3 mt-10 flex flex-wrap items-center gap-6 border-t border-primary-foreground/20 pt-6 text-label uppercase tracking-label text-primary-foreground/80">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent" />
                <span>250+ Clearances</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-secondary" />
                <span>Category A Accredited</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent" />
                <span>Zero Compliance Violations</span>
              </div>
            </div>
          </div>

          {featuredImage ? (
            <div className="rise rise-2 lg:col-span-5">
              <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-card border border-primary-foreground/15 bg-primary/40 shadow-2xl sm:aspect-[16/10] lg:aspect-[4/5]">
                <Image
                  src={featuredImage.src}
                  alt={featuredImage.alt}
                  width={featuredImage.width}
                  height={featuredImage.height}
                  priority
                  className="h-full w-full object-cover transition-transform duration-(--duration-slow) ease-out-expo group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary/70 px-4 py-1.5 backdrop-blur-md">
                  <span className="size-2 animate-pulse rounded-full bg-accent" />
                  <span className="text-label uppercase tracking-label text-primary-foreground">
                    [ 01 / ECO-ENGINEERING ]
                  </span>
                </div>
                <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between border-t border-primary-foreground/20 pt-3 text-label text-primary-foreground/90">
                  <span className="font-light">Environmental Clearances & Architecture</span>
                  <span className="tabular-nums text-secondary">PUNE &bull; INDIA</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rise rise-3 mt-12 flex items-center justify-between border-t border-primary-foreground/30 pt-6 text-label uppercase tracking-label text-primary-foreground/80">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-full border border-primary-foreground/40">
              <ArrowDown aria-hidden="true" className="size-3.5 animate-bounce" />
            </span>
            <span>{scrollLabel}</span>
          </div>
          <span className="hidden text-primary-foreground/40 sm:inline">
            Environment &bull; Engineering &bull; Statutory Compliance
          </span>
        </div>
      </Container>
    </section>
  );
}
