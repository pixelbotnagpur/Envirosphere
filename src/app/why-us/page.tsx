import { Factory, FileCheck2, Layers, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { staggerDelay } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Stats } from "@/components/sections/stats";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { getImageAsset, loadHome, loadSite } from "@/lib/content";
import { pageSeo } from "@/lib/page-seo";

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: "Why Us",
    ...pageSeo("/why-us/"),
    description: `${site.name} is a QCI NABET accredited environmental consultant in Pune offering environmental clearances, compliance and treatment plant services.`,
  };
}

export default function WhyUsPage() {
  const site = loadSite();
  const home = loadHome();
  const treatmentImage = getImageAsset("photo-treatment-plant");

  const pillars = [
    {
      icon: ShieldCheck,
      title: "QCI NABET Accredited Consultant (Cat A)",
      desc: "Envirosphere Consultant and Engineers is a QCI NABET Accredited Consultant, providing services to the public and private sector.",
    },
    {
      icon: Layers,
      title: "Thirteen services",
      desc: "From environmental clearances and compliance to environmental monitoring and the operation of treatment plants.",
    },
    {
      icon: FileCheck2,
      title: "Statutory clearances and consents",
      desc: "We help clients obtain clearances and consents from MoEFCC, Pollution Control Boards, MIDC and other government authorities.",
    },
    {
      icon: Factory,
      title: "ETP and STP operation",
      desc: "Our services include the operation and maintenance of effluent treatment plants (ETP) and sewage treatment plants (STP).",
    },
  ];

  return (
    <div>
      {/* Page Hero */}
      <section className="hero-atmosphere relative w-full bg-primary pt-28 pb-16 text-primary-foreground sm:pt-36 sm:pb-20">
        <Container>
          <SectionLabel tone="inverse" index="001">Why us</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-display max-w-4xl tracking-tight text-primary-foreground lg:col-span-8">
              Why Envirosphere.
            </h1>
            <p className="text-lead text-primary-foreground/85 font-light lg:col-span-4">
              Environmental clearances, compliance and engineering services from one firm.
            </p>
          </div>
        </Container>
      </section>

      {/* Pillars Grid */}
      <section className="border-t border-border bg-surface py-section">
        <Container>
          <ul data-card-grid="" className="grid gap-6 md:grid-cols-2">
            {pillars.map((pillar, idx) => (
              <li key={pillar.title} data-card="" className="flex list-none">
                <Reveal delay={staggerDelay(idx, 0.06)} className="flex w-full">
                  <div className="flex w-full flex-col justify-between rounded-card border border-border bg-background p-8">
                    <div>
                      <div className="flex size-11 items-center justify-center rounded-pill bg-primary/10 text-primary">
                        <pillar.icon aria-hidden="true" className="size-5" />
                      </div>
                      <h2 className="mt-6 text-h3 tracking-tight">
                        {pillar.title}
                      </h2>
                      <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>

                  </div>
                </Reveal>
              </li>
            ))}
          </ul>

          {/* Practical Engineering Visual Feature */}
          <Reveal className="mt-14">
            <div className="overflow-hidden rounded-card border border-border bg-background shadow-card">
              <div className="grid lg:grid-cols-12 items-center">
                <div className="lg:col-span-7 relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-surface">
                  <Image
                    src={treatmentImage.src}
                    alt={treatmentImage.alt}
                    width={treatmentImage.width ?? 1200}
                    height={treatmentImage.height ?? 800}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="lg:col-span-5 p-8 sm:p-10 space-y-4">
                  <span className="text-label text-primary uppercase tracking-label font-normal">
                    Water and wastewater
                  </span>
                  <h3 className="text-h3 tracking-tight">
                    ETP and STP operation and maintenance
                  </h3>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    Alongside clearances and compliance, our services include the operation and maintenance of effluent treatment plants (ETP) and sewage treatment plants (STP).
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Stats Counter Banner */}
      <Stats
        index="002"
        label={home.stats.label}
        items={home.stats.items}
        locale={site.locale}
        tone="background"
      />

      {/* Bottom CTA */}
      <section className="py-section">
        <Container>
          <div className="rounded-card bg-primary p-8 sm:p-14 text-primary-foreground">
            <div className="max-w-3xl">
              <span className="text-label uppercase tracking-label text-secondary">
                Get in touch
              </span>
              <h2 className="mt-6 text-h2 tracking-tight">
                Tell us about your project.
              </h2>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild variant="accent" size="lg">
                  <Link href="/contact/">Contact us</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Link href="/services/">Our services</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
