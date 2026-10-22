import Image from "next/image";
import { Marquee } from "@/components/motion/marquee";
import { SplitText } from "@/components/motion/split-text";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { ImageAsset } from "./types";

export interface ClientsProps {
  index?: string;
  label: string;
  heading: string;
  logos: ImageAsset[];
}

function LogoRow({ logos, speed, reverse }: { logos: ImageAsset[]; speed: number; reverse?: boolean }) {
  return (
    <Marquee speed={speed} reverse={reverse}>
      {logos.map((logo) => (
        <Image
          key={logo.src}
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          className="h-12 w-auto max-w-none opacity-70 grayscale transition-[opacity,filter] duration-(--duration-base) hover:opacity-100 hover:grayscale-0"
        />
      ))}
    </Marquee>
  );
}

export function Clients({ index, label, heading, logos }: ClientsProps) {
  const half = Math.ceil(logos.length / 2);
  return (
    <section className="py-section">
      <Container>
        <SectionLabel index={index}>{label}</SectionLabel>
        <h2 className="mt-8 max-w-4xl text-h2">
          <SplitText text={heading} />
        </h2>
      </Container>
      <div className="mt-16 flex flex-col gap-12">
        <LogoRow logos={logos.slice(0, half)} speed={70} />
        <LogoRow logos={logos.slice(half)} speed={85} reverse />
      </div>
    </section>
  );
}
