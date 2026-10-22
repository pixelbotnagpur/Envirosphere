import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import type { ImageAsset } from "./types";

export interface VisualBreakProps {
  image: ImageAsset;
  quote?: string;
  tag?: string;
  location?: string;
}

export function VisualBreak({
  image,
  quote = "Engineering at the confluence of ecological preservation and industrial progress.",
  tag = "PAN-INDIA ENVIRONMENTAL CONSULTING",
  location = "PUNE • MUMBAI • DELHI",
}: VisualBreakProps) {
  return (
    <section className="bg-background py-8 sm:py-12">
      <Container>
        <Reveal>
          <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-card border border-border bg-muted shadow-2xl sm:aspect-[2/1] lg:aspect-[2.4/1]">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="h-full w-full object-cover transition-transform duration-(--duration-slow) ease-out-expo group-hover:scale-105"
            />
            {/* Ambient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/30 to-transparent" />

            {/* Top pill badge */}
            <div className="absolute top-6 left-6 flex items-center gap-3">
              <span className="flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary/70 px-4 py-1.5 text-label uppercase tracking-label text-primary-foreground backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-accent" />
                <span>{tag}</span>
              </span>
            </div>

            {/* Bottom editorial quote and location */}
            <div className="absolute right-6 bottom-6 left-6 flex flex-col justify-between gap-4 border-t border-primary-foreground/20 pt-4 sm:flex-row sm:items-end">
              <p className="max-w-2xl font-heading text-h3 text-primary-foreground/95">
                {quote}
              </p>
              <span className="shrink-0 text-label uppercase tracking-label text-secondary">
                {location}
              </span>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
