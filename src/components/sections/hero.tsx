import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { Cta } from "./types";

export interface HeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: Cta;
  secondaryCta?: Cta;
  scrollLabel: string;
}

/** Entrance is CSS-only (`rise`) so the hero is readable immediately, without JavaScript. */
export function Hero({ eyebrow, title, subtitle, primaryCta, secondaryCta, scrollLabel }: HeroProps) {
  return (
    <section className="hero-atmosphere relative flex min-h-screen min-h-dvh w-full flex-col justify-between overflow-hidden bg-primary pt-28 pb-8 text-primary-foreground sm:pt-32 sm:pb-10">
      <Container className="flex flex-1 flex-col justify-between">
        <div>
          <SectionLabel tone="inverse" className="rise">
            {eyebrow}
          </SectionLabel>
          <h1 className="rise rise-1 mt-6 max-w-5xl break-words text-display font-normal tracking-tight">
            {title}
          </h1>
          <div className="mt-8 flex flex-col gap-8 lg:mt-12 lg:flex-row lg:items-end lg:justify-between">
            <p className="rise rise-2 max-w-xl text-lead font-light text-primary-foreground/85 leading-relaxed">
              {subtitle}
            </p>
            <div className="rise rise-3 flex flex-wrap gap-4">
              <Button asChild variant="accent" size="lg">
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              {secondaryCta ? (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rise rise-3 mt-12 flex items-center justify-between border-t border-primary-foreground/15 pt-6 text-label uppercase tracking-label text-primary-foreground/70">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-full border border-primary-foreground/25">
              <ArrowDown aria-hidden="true" className="size-3.5 animate-bounce" />
            </span>
            <span>{scrollLabel}</span>
          </div>
          <span className="hidden text-primary-foreground/40 sm:inline">
            Environment &bull; Engineering &bull; Compliance
          </span>
        </div>
      </Container>
    </section>
  );
}
