import Image from "next/image";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import type { ImageAsset } from "./types";

export interface TextSplitProps {
  heading: string;
  paragraphs: string[];
  image: ImageAsset;
}

/** Heading and paragraphs on the left, a tall picture with parallax on the right. */
export function TextSplit({ heading, paragraphs, image }: TextSplitProps) {
  return (
    <section className="border-t border-border bg-surface py-section">
      <Container className="grid gap-16 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7 space-y-6 text-lead font-light text-foreground/90 leading-relaxed">
          <Reveal>
            <h2 className="text-h2 tracking-tight text-foreground">{heading}</h2>
          </Reveal>
          {paragraphs.map((paragraph, index) => (
            <Reveal key={paragraph} delay={0.1 + index * 0.05}>
              <p>{paragraph}</p>
            </Reveal>
          ))}
        </div>

        <div className="lg:col-span-5">
          <Parallax className="aspect-[4/5] rounded-card overflow-hidden shadow-card border border-border">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="h-full w-full object-cover"
              priority
            />
          </Parallax>
        </div>
      </Container>
    </section>
  );
}
