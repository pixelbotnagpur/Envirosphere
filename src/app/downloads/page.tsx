import { Download, FileText } from "lucide-react";
import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { staggerDelay } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { getImage, loadDownloads, loadSite } from "@/lib/content";
import { pageSeo } from "@/lib/page-seo";

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: "Downloads",
    ...pageSeo("/downloads/"),
    description: `Documents to download from ${site.name}.`,
    // An empty page should not be indexed; it also is left out of the sitemap.
    ...(loadDownloads().length === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default function DownloadsPage() {
  const downloads = loadDownloads();

  return (
    <div>
      {/* Page Hero */}
      <section className="hero-atmosphere relative w-full bg-primary pt-28 pb-16 text-primary-foreground sm:pt-36 sm:pb-20">
        <Container>
          <SectionLabel tone="inverse" index="001">Downloads</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-display max-w-4xl tracking-tight text-primary-foreground lg:col-span-8">
              Downloads.
            </h1>
          </div>
        </Container>
      </section>

      {/* Downloads Grid */}
      <section className="border-t border-border bg-surface py-section">
        <Container>
          {downloads.length === 0 ? (
            <p className="mx-auto max-w-2xl rounded-card border border-border bg-background p-12 text-center text-sm font-light text-muted-foreground">
              There are no documents to download yet.
            </p>
          ) : null}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {downloads.map((item, idx) => {
              const mediaItem = getImage(item.fileKey);
              return (
                <Reveal key={item.id} delay={staggerDelay(idx, 0.08)} className="flex">
                  <div className="h-full w-full rounded-card border border-border bg-background p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-pill border border-border bg-surface px-3 py-1 text-label uppercase tracking-label font-normal text-muted-foreground">
                          {item.category}
                        </span>
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {item.format} {item.size ? `• ${item.size}` : ""}
                        </span>
                      </div>

                      <div className="mt-6 flex size-11 items-center justify-center rounded-pill bg-primary/10 text-primary">
                        <FileText aria-hidden="true" className="size-5" />
                      </div>

                      <h2 className="mt-4 text-h4 tracking-tight">
                        {item.title}
                      </h2>
                      <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-border">
                      <Button asChild variant="outline" className="w-full">
                        <a href={mediaItem.src} download>
                          <Download aria-hidden="true" className="size-4 mr-2" />
                          Download Document
                        </a>
                      </Button>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>
    </div>
  );
}
