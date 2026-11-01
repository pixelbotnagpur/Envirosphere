import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { ImageAsset } from "./types";

export interface FieldItem {
  image: ImageAsset;
  caption: string;
  tag: string;
}

export interface FieldArchiveProps {
  index?: string;
  label?: string;
  heading?: string;
  body?: string;
  items: FieldItem[];
}

export function FieldArchive({
  index = "005",
  label = "FIELD WORK",
  heading = "Photographs from the field.",
  body = "A selection of photographs from our field work and office.",
  items,
}: FieldArchiveProps) {
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
              <Link href="/gallery/">Field Archive</Link>
            </Button>
          </div>
        </div>

        <div data-card-grid="" className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <Reveal key={item.caption} data-card="" className="flex">
              <div className="group relative flex w-full flex-col overflow-hidden rounded-card border border-border bg-background transition-shadow duration-(--duration-base) hover:shadow-card">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    width={item.image.width}
                    height={item.image.height}
                    className="h-full w-full object-cover transition-transform duration-(--duration-slow) ease-out-expo group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 rounded-pill border border-primary-foreground/25 bg-primary/75 px-3 py-1 text-micro uppercase tracking-label text-primary-foreground backdrop-blur-xs">
                    {item.tag}
                  </div>
                </div>
                <div className="flex-1 p-5">
                  <p className="text-sm font-light text-foreground leading-snug">
                    {item.caption}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button asChild variant="outline">
            <Link href="/gallery/" className="flex items-center gap-2">
              <span>View Photographic Gallery</span>
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
