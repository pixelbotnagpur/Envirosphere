import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { Cta, ImageAsset } from "./types";

export interface FeaturedService {
  title: string;
  tag: string;
  summary: string;
  href: string;
  image: ImageAsset;
}

export interface ServicesIndexProps {
  index?: string;
  label: string;
  heading: string;
  intro: string;
  cta: Cta;
  services: { slug: string; title: string; summary: string }[];
  featured?: FeaturedService[];
}

export function ServicesIndex({
  index,
  label,
  heading,
  intro,
  cta,
  services,
  featured,
}: ServicesIndexProps) {
  return (
    <section className="bg-surface py-section">
      <Container className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <SectionLabel index={index}>{label}</SectionLabel>
          <h2 className="mt-6 text-h2">
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

      {/* Featured Visual Cards Showcase (Neiden Architecture Style) */}
      {featured && featured.length > 0 ? (
        <Container className="mt-14">
          <div data-card-grid="" className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <Reveal key={item.title} data-card="" className="flex">
                <Link
                  href={item.href}
                  className="group flex w-full flex-col overflow-hidden rounded-card border border-border bg-background transition-shadow duration-(--duration-base) ease-out-expo hover:shadow-card"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface">
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      width={item.image.width}
                      height={item.image.height}
                      className="h-full w-full object-cover transition-transform duration-(--duration-slow) ease-out-expo group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 rounded-pill border border-primary-foreground/20 bg-primary/75 px-3 py-1 text-micro uppercase tracking-label text-primary-foreground backdrop-blur-xs">
                      {item.tag}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <h3 className="font-heading text-h3 transition-colors group-hover:text-primary">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm font-light text-muted-foreground leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-label uppercase tracking-label text-primary">
                      <span>View Specifications</span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-4 transition-transform duration-(--duration-base) group-hover:translate-x-1 group-hover:-translate-y-1"
                      />
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      ) : null}

      {/* Complete Numbered 13-Service Directory */}
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
