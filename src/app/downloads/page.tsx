import { Download, FileText, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { getImage, loadDownloads, loadSite } from "@/lib/content";

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: "Downloads & Accreditations | Official Documentation",
    description: `Download official QCI NABET accreditation certificates, corporate profile, and compliance brochures from ${site.name}.`,
  };
}

export default function DownloadsPage() {
  const downloads = loadDownloads();

  return (
    <div>
      {/* Page Hero */}
      <section className="hero-atmosphere relative w-full bg-primary pt-28 pb-16 text-primary-foreground sm:pt-36 sm:pb-20">
        <Container>
          <SectionLabel tone="inverse" index="001">Resources & Verification</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-display max-w-4xl tracking-tight text-primary-foreground lg:col-span-8">
              Official publications & accreditation certificates.
            </h1>
            <p className="text-lead text-primary-foreground/85 font-light lg:col-span-4">
              Access verifiable documentation, corporate brochures, and environmental compliance policies for institutional review.
            </p>
          </div>
        </Container>
      </section>

      {/* Downloads Grid */}
      <section className="border-t border-border bg-surface py-section">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {downloads.map((item, idx) => {
              const mediaItem = getImage(item.fileKey);
              return (
                <Reveal key={item.id} delay={idx * 0.08} className="flex">
                  <div className="h-full w-full rounded-card border border-border bg-background p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-pill border border-border bg-surface px-3 py-1 text-label uppercase tracking-label font-normal text-muted-foreground">
                          {item.category}
                        </span>
                        <span className="text-sm text-muted-foreground tabular-nums ">
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

          {/* Credential Verification Notice */}
          <div className="mt-16 rounded-card border border-border bg-background p-8 flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-secondary text-secondary-foreground">
              <ShieldCheck aria-hidden="true" className="size-6" />
            </div>
            <div>
              <h3 className="text-h4">Accreditation Verification Assistance</h3>
              <p className="mt-1 text-sm text-muted-foreground font-light">
                Need official certificate verification numbers for public tenders or SEAC submission portals? Reach out directly to our compliance office.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
