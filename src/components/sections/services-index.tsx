import Link from "next/link";
import { SplitText } from "@/components/motion/split-text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { ServiceList, type ServiceRow } from "./service-list";
import type { Cta } from "./types";

export interface ServicesIndexProps {
  index?: string;
  /** Small bracketed label above the heading. Left out on Home, where the big title above carries the name. */
  label?: string;
  heading: string;
  intro: string;
  cta: Cta;
  services: ServiceRow[];
}

export function ServicesIndex({ index, label, heading, intro, cta, services }: ServicesIndexProps) {
  return (
    <section className="bg-surface py-section">
      <Container className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          {label ? <SectionLabel index={index}>{label}</SectionLabel> : null}
          <h2 className={label ? "mt-6 text-h2" : "text-h2"}>
            <SplitText text={heading} />
          </h2>
        </div>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <p className="max-w-md text-lead font-light text-muted-foreground">{intro}</p>
          <Button asChild variant="outline" className="self-start sm:self-auto">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        </div>
      </Container>

      <ServiceList items={services} />
    </section>
  );
}
