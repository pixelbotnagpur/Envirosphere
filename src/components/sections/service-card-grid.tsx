import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { staggerDelay } from "@/lib/motion";
import type { ImageAsset } from "./types";

export interface ServiceCardItem {
  slug: string;
  order: number;
  title: string;
  summary: string;
  image?: ImageAsset;
}

export interface ServiceCardGridProps {
  items: ServiceCardItem[];
  /** Read aloud by screen readers for the whole list. */
  listLabel: string;
  /** Text at the bottom of every card. */
  viewLabel: string;
}

/**
 * Numbered, linked service cards for the Services page: a big picture with the number and an arrow on it,
 * and a text block that fills with Forest from the bottom on hover. Every card in a row is the same height.
 */
export function ServiceCardGrid({ items, listLabel, viewLabel }: ServiceCardGridProps) {
  return (
    <section aria-label={listLabel} className="border-t border-border bg-surface py-section">
      <Container>
        <ol data-card-grid="" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((service, index) => (
            <li key={service.slug} data-card="" className="flex">
              <Reveal delay={staggerDelay(index, 0.04)} className="flex w-full">
                <Link
                  href={`/services/${service.slug}/`}
                  className="group relative flex w-full flex-col overflow-hidden rounded-card border border-border bg-background transition-[transform,box-shadow] duration-(--duration-base) ease-out-expo hover:-translate-y-1 hover:shadow-card"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                    {service.image ? (
                      <Image
                        src={service.image.src}
                        alt={service.image.alt}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
                        className="object-cover transition-transform duration-(--duration-slow) ease-out-expo group-hover:scale-105"
                      />
                    ) : (
                      <ImagePlaceholder className="h-full w-full" />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 rounded-pill border border-primary-foreground/25 bg-primary/75 px-3 py-1 text-micro uppercase tracking-label text-primary-foreground tabular-nums backdrop-blur-xs">
                      {String(service.order).padStart(3, "0")}
                    </span>
                    <span
                      aria-hidden="true"
                      className="absolute top-4 right-4 grid size-10 place-items-center rounded-pill bg-accent text-accent-foreground transition-transform duration-(--duration-base) ease-out-expo group-hover:rotate-45"
                    >
                      <ArrowUpRight className="size-5" />
                    </span>
                  </div>

                  <div className="relative isolate flex flex-1 flex-col p-6 text-foreground transition-colors duration-(--duration-base) ease-out-expo group-hover:text-primary-foreground">
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-primary transition-transform duration-(--duration-slow) ease-out-expo group-hover:scale-y-100"
                    />
                    <h2 className="text-h3 tracking-tight">{service.title}</h2>
                    <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground transition-colors duration-(--duration-base) ease-out-expo group-hover:text-primary-foreground/80">
                      {service.summary}
                    </p>
                    <span className="mt-auto flex items-center gap-3 pt-6 text-label uppercase tracking-label">
                      {viewLabel}
                      <span
                        aria-hidden="true"
                        className="h-px w-8 bg-current transition-transform duration-(--duration-base) ease-out-expo origin-left group-hover:scale-x-150"
                      />
                    </span>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
