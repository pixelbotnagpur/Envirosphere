import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { getImageAsset, loadGallery, loadSite } from "@/lib/content";

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: "Project & Field Gallery | Environmental Operations in Action",
    description: `View field monitoring, wastewater treatment plant engineering, and site due diligence projects by ${site.name}.`,
  };
}

export default function GalleryPage() {
  const gallery = loadGallery();

  return (
    <div className="py-section">
      {/* Header */}
      <section className="pb-16 sm:pb-20">
        <Container>
          <SectionLabel index="001">Field Documentation</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-display max-w-4xl tracking-tight lg:col-span-8">
              Environmental engineering & field monitoring in action.
            </h1>
            <p className="text-lead text-muted-foreground font-light lg:col-span-4">
              A visual record of our accredited field surveys, stack emission assessments, on-site effluent treatment engineering, and public hearings.
            </p>
          </div>
        </Container>
      </section>

      {/* Gallery Grid */}
      <section className="border-t border-border bg-surface py-section">
        <Container>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item, idx) => {
              const imageAsset = getImageAsset(item.image);
              return (
                <Reveal key={item.id} delay={idx * 0.08}>
                  <figure className="group rounded-card border border-border bg-background overflow-hidden shadow-card">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
                      <Image
                        src={imageAsset.src}
                        alt={imageAsset.alt}
                        width={imageAsset.width}
                        height={imageAsset.height}
                        className="h-full w-full object-cover transition-transform duration-(--duration-base) ease-out-expo group-hover:scale-105"
                      />
                      <span className="absolute top-4 left-4 rounded-pill bg-background/90 backdrop-blur-sm border border-border px-3 py-1 text-xs uppercase tracking-label font-normal text-foreground">
                        {item.category}
                      </span>
                    </div>

                    <figcaption className="p-6">
                      <h2 className="text-h4 tracking-tight">{item.title}</h2>
                      {item.caption ? (
                        <p className="mt-2 text-sm text-muted-foreground font-light leading-relaxed">
                          {item.caption}
                        </p>
                      ) : null}
                    </figcaption>
                  </figure>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>
    </div>
  );
}
