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
    <section className="flex min-h-[calc(100svh-var(--spacing-header))] flex-col justify-end bg-primary pt-section pb-12 text-primary-foreground">
      <Container>
        <SectionLabel tone="inverse" className="rise">
          {eyebrow}
        </SectionLabel>
        <h1 className="rise rise-1 mt-8 max-w-6xl break-words text-display">{title}</h1>
        <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <p className="rise rise-2 max-w-2xl text-lead font-light text-primary-foreground/80">{subtitle}</p>
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
        <p className="rise rise-3 mt-16 flex items-center gap-3 text-label uppercase tracking-label text-primary-foreground/70">
          <ArrowDown aria-hidden="true" className="size-4" />
          {scrollLabel}
        </p>
      </Container>
    </section>
  );
}
