import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { Cta, ImageAsset } from "./types";

export interface FieldItem {
  image: ImageAsset;
  caption: string;
  tag: string;
}

export interface FieldArchiveProps {
  index?: string;
  label: string;
  heading: string;
  body: string;
  /** Outline button at the right of the heading. */
  topCta: Cta;
  /** The last tile of the bento: a small card inside the grid that links to the full gallery. */
  bottomCta: Cta;
  /** Exactly four photographs: the bento is drawn for four photos and the gallery card. */
  items: FieldItem[];
}

/**
 * Bento layout for four photographs and the gallery card, with no extra row: every tile sits inside the
 * same block, and every edge lines up.
 *
 * Large screens (12 columns, four rows of 10rem):
 *   A  columns 1-5,  rows 1-4   big photo
 *   B  columns 6-9,  rows 1-2   photo        C  columns 6-9,  rows 3-4   photo
 *   D  columns 10-12, rows 1-3  tall photo   G  columns 10-12, row 4     gallery card
 * Tablets (2 columns, rows of 9rem): a tall photo beside two photos, then a photo beside the gallery card.
 * Phones: one column. The photographs are portrait, so the tiles favour tall shapes.
 */
const TILE_PLACEMENT = [
  "md:row-span-4 lg:col-span-5 lg:col-start-1 lg:row-span-4 lg:row-start-1",
  "md:row-span-2 lg:col-span-4 lg:col-start-6 lg:row-span-2 lg:row-start-1",
  "md:row-span-2 lg:col-span-4 lg:col-start-6 lg:row-span-2 lg:row-start-3",
  "md:row-span-2 lg:col-span-3 lg:col-start-10 lg:row-span-3 lg:row-start-1",
] as const;
const CTA_PLACEMENT = "md:row-span-2 lg:col-span-3 lg:col-start-10 lg:row-span-1 lg:row-start-4";

export function FieldArchive({ index, label, heading, body, topCta, bottomCta, items }: FieldArchiveProps) {
  return (
    <section className="bg-surface py-section">
      <Container>
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <SectionLabel index={index}>{label}</SectionLabel>
            <h2 className="mt-6 text-h2">{heading}</h2>
          </div>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <p className="max-w-md text-lead font-light text-muted-foreground">{body}</p>
            <Button asChild variant="outline" className="self-start sm:self-auto">
              <Link href={topCta.href}>{topCta.label}</Link>
            </Button>
          </div>
        </div>

        {/* A bento grid: the tiles are deliberately different sizes, so it is not a data-card-grid. */}
        <div
          data-bento=""
          className="mt-14 grid grid-cols-1 gap-4 md:auto-rows-[9rem] md:grid-cols-2 lg:auto-rows-[10rem] lg:grid-cols-12"
        >
          {items.slice(0, TILE_PLACEMENT.length).map((item, position) => (
            <Reveal
              key={item.caption}
              data-tile=""
              className={`group relative isolate aspect-[4/5] overflow-hidden rounded-card bg-background md:aspect-auto ${TILE_PLACEMENT[position]}`}
            >
              <Image
                src={item.image.src}
                alt={item.image.alt}
                fill
                sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-(--duration-slow) ease-out-expo group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/15 to-transparent" />
              <div className="absolute top-4 left-4 rounded-pill border border-primary-foreground/25 bg-primary/75 px-3 py-1 text-micro uppercase tracking-label text-primary-foreground backdrop-blur-xs">
                {item.tag}
              </div>
              <p className="absolute right-5 bottom-5 left-5 max-w-sm text-sm font-light leading-snug text-primary-foreground">
                {item.caption}
              </p>
            </Reveal>
          ))}

          <Reveal data-tile="" data-cta-tile="" className={`min-h-36 md:min-h-0 ${CTA_PLACEMENT}`}>
            <Link
              href={bottomCta.href}
              className="group flex h-full w-full flex-col justify-between gap-4 rounded-card bg-primary p-5 text-primary-foreground transition-colors duration-(--duration-base) ease-out-expo hover:bg-primary/90"
            >
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center self-end rounded-pill bg-accent text-accent-foreground transition-transform duration-(--duration-base) ease-out-expo group-hover:rotate-45"
              >
                <ArrowUpRight className="size-5" />
              </span>
              <span className="font-heading text-h4">{bottomCta.label}</span>
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
