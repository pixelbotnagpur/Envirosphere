import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "./types";

export interface MediaFeatureProps {
  image: ImageAsset;
  eyebrow: string;
  title: string;
  text: string;
  className?: string;
}

/** Wide picture on the left, eyebrow, h3 and short text on the right. */
export function MediaFeature({ image, eyebrow, title, text, className }: MediaFeatureProps) {
  return (
    <Reveal className={cn(className)}>
      <div className="overflow-hidden rounded-card border border-border bg-background shadow-card">
        <div className="grid lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-surface">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="lg:col-span-5 p-8 sm:p-10 space-y-4">
            <span className="text-label text-primary uppercase tracking-label font-normal">{eyebrow}</span>
            <h3 className="text-h3 tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">{text}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
