import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { Cta } from "./types";

export interface CtaBandProps {
  /** "primary" is the Forest panel, "secondary" the Sage one. */
  tone?: "primary" | "secondary";
  index?: string;
  label: string;
  heading: string;
  lead?: string;
  primaryCta: Cta;
  secondaryCta?: Cta;
}

/** Closing call-to-action panel with one or two buttons. */
export function CtaBand({
  tone = "primary",
  index,
  label,
  heading,
  lead,
  primaryCta,
  secondaryCta,
}: CtaBandProps) {
  const primary = tone === "primary";
  return (
    <section className={primary ? "py-section" : "mt-section"}>
      <Container>
        <div
          className={
            primary
              ? "rounded-card bg-primary p-8 sm:p-14 text-primary-foreground"
              : "rounded-card bg-secondary p-8 sm:p-12 text-secondary-foreground"
          }
        >
          <div className="max-w-3xl">
            {primary ? (
              <span className="text-label uppercase tracking-label text-secondary">{label}</span>
            ) : (
              <SectionLabel className="text-secondary-foreground" index={index}>
                {label}
              </SectionLabel>
            )}
            <h2 className="mt-6 text-h2 tracking-tight">{heading}</h2>
            {lead ? <p className="mt-4 text-lead font-light">{lead}</p> : null}
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild variant={primary ? "accent" : "default"} size="lg">
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              {secondaryCta ? (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className={primary ? "text-primary-foreground hover:bg-primary-foreground/10" : undefined}
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
