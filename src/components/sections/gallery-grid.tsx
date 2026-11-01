import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { staggerDelay } from "@/lib/motion";
import type { ImageAsset } from "./types";

export interface GalleryGridItem {
  id: string;
  title: string;
  category: string;
  caption?: string;
  image: ImageAsset;
}

export interface GalleryGridProps {
  items: GalleryGridItem[];
}

/** Photo cards with a category badge, title and optional caption. */
export function GalleryGrid({ items }: GalleryGridProps) {
  return (
    <section className="border-t border-border bg-surface py-section">
      <Container>
        <div data-card-grid="" className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.id} delay={staggerDelay(index, 0.08)} data-card="" className="flex">
              <figure className="group flex w-full flex-col rounded-card border border-border bg-background overflow-hidden shadow-card">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    width={item.image.width}
                    height={item.image.height}
                    className="h-full w-full object-cover transition-transform duration-(--duration-base) ease-out-expo group-hover:scale-105"
                  />
                  <span className="absolute top-4 left-4 rounded-pill bg-background/90 backdrop-blur-sm border border-border px-3 py-1 text-micro uppercase tracking-label font-normal text-foreground">
                    {item.category}
                  </span>
                </div>

                <figcaption className="flex-1 p-6">
                  <h2 className="text-h4 tracking-tight">{item.title}</h2>
                  {item.caption ? (
                    <p className="mt-2 text-sm text-muted-foreground font-light leading-relaxed">
                      {item.caption}
                    </p>
                  ) : null}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
