import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
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

/** Numbered, linked service cards for the Services page. */
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
                  className="group relative flex w-full flex-col justify-between rounded-card border border-border bg-background p-8 transition-colors duration-(--duration-base) ease-out-expo hover:border-primary/40 hover:shadow-card"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-label text-muted-foreground uppercase tracking-label tabular-nums">
                        {String(service.order).padStart(3, "0")}
                      </span>
                      <div className="flex size-9 items-center justify-center rounded-pill border border-border text-foreground transition-colors duration-(--duration-base) ease-out-expo group-hover:bg-primary group-hover:text-primary-foreground">
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-4 transition-transform duration-(--duration-base) ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </div>
                    </div>

                    {service.image ? (
                      <div className="mt-5 aspect-[16/10] w-full overflow-hidden rounded-control border border-border bg-surface">
                        <Image
                          src={service.image.src}
                          alt={service.image.alt}
                          width={service.image.width}
                          height={service.image.height}
                          className="h-full w-full object-cover transition-transform duration-(--duration-base) ease-out-expo group-hover:scale-105"
                        />
                      </div>
                    ) : null}

                    <h2 className="mt-5 text-h3 tracking-tight">{service.title}</h2>
                    <p className="mt-4 text-sm text-muted-foreground font-light leading-relaxed">
                      {service.summary}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-label uppercase tracking-label text-muted-foreground transition-colors group-hover:text-foreground">
                    <span>{viewLabel}</span>
                    <span aria-hidden="true">&rarr;</span>
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
