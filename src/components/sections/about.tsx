import Image from "next/image";
import Link from "next/link";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { ScrollWords } from "@/components/motion/scroll-words";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { Cta, ImageAsset } from "./types";

export interface AboutProps {
  index?: string;
  label: string;
  heading: string;
  paragraphs: string[];
  image: ImageAsset;
  cta: Cta;
}

export function About({ index, label, heading, paragraphs, image, cta }: AboutProps) {
  return (
    <section className="py-section">
      <Container className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionLabel index={index}>{label}</SectionLabel>
          <h2 className="mt-8 text-h2">
            <ScrollWords text={heading} />
          </h2>
          <div className="mt-12 flex max-w-2xl flex-col gap-6 text-lead font-light">
            {paragraphs.map((paragraph) => (
              <Reveal key={paragraph}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <Button asChild variant="outline" className="mt-12">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          </Reveal>
        </div>
        <div className="lg:col-span-5">
          <Parallax className="aspect-[4/5] rounded-card">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="h-full w-full object-cover"
            />
          </Parallax>
        </div>
      </Container>
    </section>
  );
}
