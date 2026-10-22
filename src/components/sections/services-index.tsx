import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { Cta } from "./types";

export interface ServicesIndexProps {
  index?: string;
  label: string;
  heading: string;
  intro: string;
  cta: Cta;
  services: { slug: string; title: string; summary: string }[];
}

export function ServicesIndex({ index, label, heading, intro, cta, services }: ServicesIndexProps) {
  return (
    <section className="bg-surface py-section">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <SectionLabel index={index}>{label}</SectionLabel>
            <h2 className="mt-8 text-h2">
              <SplitText text={heading} />
            </h2>
            <p className="mt-6 max-w-sm text-lead font-light text-muted-foreground">{intro}</p>
            <Button asChild variant="outline" className="mt-10">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          </div>
        </div>
      </Container>
      <ol className="mt-16 border-b border-border">
        {services.map((service, position) => (
          <li key={service.slug} className="border-t border-border">
            <Reveal>
              <Link
                href={`/services/${service.slug}/`}
                className="group block transition-colors duration-(--duration-base) ease-out-expo hover:bg-primary hover:text-primary-foreground"
              >
                <Container className="grid grid-cols-[3rem_1fr_auto] items-baseline gap-x-6 py-8 lg:grid-cols-[6rem_1.2fr_1fr_auto]">
                  <span className="text-label uppercase tracking-label tabular-nums text-muted-foreground transition-colors group-hover:text-secondary">
                    {String(position + 1).padStart(3, "0")}
                  </span>
                  <span className="font-heading text-h3">{service.title}</span>
                  <span className="hidden text-muted-foreground transition-colors group-hover:text-primary-foreground/80 lg:block">
                    {service.summary}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-6 transition-transform duration-(--duration-base) ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </Container>
              </Link>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
