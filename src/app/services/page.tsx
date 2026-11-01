import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { staggerDelay } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { getImageAsset, loadServices, loadSite } from "@/lib/content";
import { pageSeo } from "@/lib/page-seo";

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: "Environmental Consultancy & Engineering Services",
    ...pageSeo("/services/"),
    description: `Explore all 13 specialized statutory clearance, monitoring, audit, and engineering services offered by ${site.name}.`,
  };
}

export default function ServicesPage() {
  const services = loadServices();

  return (
    <div>
      {/* Page Hero */}
      <section className="hero-atmosphere relative w-full bg-primary pt-28 pb-16 text-primary-foreground sm:pt-36 sm:pb-20">
        <Container>
          <SectionLabel tone="inverse" index="001">Services Directory</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-display max-w-4xl tracking-tight text-primary-foreground lg:col-span-8">
              Thirteen environmental services. One accountable team.
            </h1>
            <p className="text-lead text-primary-foreground/85 font-light lg:col-span-4">
              From statutory impact assessments and consent management to turnkey wastewater engineering, we provide comprehensive environmental support for infrastructure and industrial leaders.
            </p>
          </div>
        </Container>
      </section>

      {/* Services Grid */}
      <section aria-label="Services List" className="border-t border-border bg-surface py-section">
        <Container>
          <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, idx) => {
              const imageAsset = service.image ? getImageAsset(service.image) : null;
              return (
                <li key={service.slug} className="flex">
                  <Reveal delay={staggerDelay(idx, 0.04)} className="flex w-full">
                    <Link
                      href={`/services/${service.slug}/`}
                      className="group relative flex w-full flex-col justify-between rounded-card border border-border bg-background p-8 transition-colors duration-(--duration-base) ease-out-expo hover:border-primary/40 hover:shadow-card"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-label text-muted-foreground uppercase tracking-label tabular-nums">
                            {String(service.order).padStart(3, "0")}
                          </span>
                          <div className="flex size-9 items-center justify-center rounded-pill border border-border text-foreground transition-colors duration-(--duration-base) ease-out-expo group-hover:bg-primary group-hover:text-primary-foreground">
                            <ArrowUpRight
                              aria-hidden="true"
                              className="size-4 transition-transform duration-(--duration-base) ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                          </div>
                        </div>

                        {imageAsset ? (
                          <div className="mt-5 aspect-[16/10] w-full overflow-hidden rounded-control border border-border bg-surface">
                            <Image
                              src={imageAsset.src}
                              alt={imageAsset.alt}
                              width={imageAsset.width ?? 600}
                              height={imageAsset.height ?? 375}
                              className="h-full w-full object-cover transition-transform duration-(--duration-base) ease-out-expo group-hover:scale-105"
                            />
                          </div>
                        ) : null}

                        <h2 className="mt-5 text-h3 tracking-tight">
                          {service.title}
                        </h2>
                      <p className="mt-4 text-sm text-muted-foreground font-light leading-relaxed">
                        {service.summary}
                      </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-label uppercase tracking-label text-muted-foreground transition-colors group-hover:text-foreground">
                      <span>View Specifications</span>
                      <span aria-hidden="true">&rarr;</span>
                    </div>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ol>
        </Container>
      </section>

      {/* Bottom Consultation CTA */}
      <section className="mt-section">
        <Container>
          <div className="rounded-card bg-secondary p-8 sm:p-12 text-secondary-foreground">
            <div className="max-w-3xl">
              <SectionLabel className="text-secondary-foreground" index="002">
                Consultation
              </SectionLabel>
              <h2 className="mt-6 text-h2 tracking-tight">
                Not sure which clearances or studies your project requires?
              </h2>
              <p className="mt-4 text-lead font-light">
                Our senior environmental coordinators and accredited NABET specialists review your project specifications and guide you through the regulatory framework.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild size="lg">
                  <Link href="/contact/">Discuss Your Project</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/about/">About Our Accreditations</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
