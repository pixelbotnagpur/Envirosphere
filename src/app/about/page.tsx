import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { staggerDelay } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { getImageAsset, loadHome, loadSite } from "@/lib/content";
import { pageSeo } from "@/lib/page-seo";

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: "About Us",
    ...pageSeo("/about/"),
    description: `Learn about ${site.name}, a QCI NABET Category A accredited environmental consultant with offices in Pune, Mumbai, Tarapur, Nashik, and Nagpur.`,
  };
}

export default function AboutPage() {
  const site = loadSite();
  const home = loadHome();
  const aboutImage = getImageAsset(home.about.image);
  const acoMeetImage = getImageAsset("photo-aco-meet");

  return (
    <div>
      {/* Page Hero */}
      <section className="hero-atmosphere relative w-full bg-primary pt-28 pb-16 text-primary-foreground sm:pt-36 sm:pb-20">
        <Container>
          <SectionLabel tone="inverse" index="001">Company Profile</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-display max-w-4xl tracking-tight text-primary-foreground lg:col-span-8">
              Environmental consultants and engineers, based in Pune.
            </h1>
            <p className="text-lead text-primary-foreground/85 font-light lg:col-span-4">
              Envirosphere Consultant and Engineers is a QCI NABET Accredited Consultant (Cat A), providing services to the public and private sector.
            </p>
          </div>
        </Container>
      </section>

      {/* Narrative & Visual */}
      <section className="border-t border-border bg-surface py-section">
        <Container className="grid gap-16 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-6 text-lead font-light text-foreground/90 leading-relaxed">
            <Reveal>
              <h2 className="text-h2 tracking-tight text-foreground">
                Our Mission & Philosophy
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p>
                Our firm provides strategic planning and cost-effective, sustainable solutions to public and private sector clients for obtaining statutory clearances and consents from MoEFCC, State Pollution Control Boards, MIDC, and other government authorities.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <p>
                The organisation is guided by a code of ethics and professional practices, working towards its stated vision and mission.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <Parallax className="aspect-[4/5] rounded-card overflow-hidden shadow-card border border-border">
              <Image
                src={aboutImage.src}
                alt={aboutImage.alt}
                width={aboutImage.width}
                height={aboutImage.height}
                className="h-full w-full object-cover"
                priority
              />
            </Parallax>
          </div>
        </Container>
      </section>

      {/* Accreditations & Trust */}
      <section className="py-section border-t border-border">
        <Container>
          <SectionLabel index="002">Accreditation Standards</SectionLabel>
          <h2 className="mt-6 text-h2 tracking-tight">QCI NABET Accredited Consultant</h2>
          <p className="mt-4 max-w-3xl text-lead text-muted-foreground font-light">
            Envirosphere is a QCI NABET Accredited Consultant (Cat A).
          </p>

          {/* Institutional Engagement Showcase */}
          <Reveal className="mt-12">
            <div className="overflow-hidden rounded-card border border-border bg-background shadow-card">
              <div className="grid lg:grid-cols-12 items-center">
                <div className="lg:col-span-7 relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-surface">
                  <Image
                    src={acoMeetImage.src}
                    alt={acoMeetImage.alt}
                    width={acoMeetImage.width ?? 1200}
                    height={acoMeetImage.height ?? 800}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="lg:col-span-5 p-8 sm:p-10 space-y-4">
                  <span className="text-label text-primary uppercase tracking-label font-normal">
                    ACO Meet 2026
                  </span>
                  <h3 className="text-h3 tracking-tight">
                    Photograph from the ACO Meet 2026
                  </h3>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    The ACO Meet 2026 was a meeting of NABET accredited consultant organisations.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* 5-Branch Office Network */}
      <section className="border-t border-border bg-surface py-section">
        <Container>
          <SectionLabel index="003">Presence</SectionLabel>
          <h2 className="mt-6 text-h2 tracking-tight">Our offices</h2>
          <p className="mt-4 max-w-2xl text-lead text-muted-foreground font-light">
            Head office in Pune, with branch offices in Mumbai, Tarapur, Nashik and Nagpur.
          </p>

          <div data-card-grid="" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {site.offices.map((office, idx) => (
              <Reveal key={office.city} delay={staggerDelay(idx, 0.08)} data-card="" className="flex">
                <div className="flex w-full flex-col justify-between rounded-card border border-border bg-background p-8">
                  <div>
                    <div className="flex items-center gap-2 text-label text-muted-foreground uppercase tracking-label">
                      <Building2 aria-hidden="true" className="size-4 text-primary" />
                      <span>{office.name}</span>
                    </div>
                    <h3 className="mt-4 text-h3">{office.city}</h3>
                    {office.address ? (
                      <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                        {office.address}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Bottom CTA */}
      <section className="py-section">
        <Container>
          <div className="rounded-card bg-primary p-8 sm:p-14 text-primary-foreground">
            <div className="max-w-3xl">
              <span className="text-label uppercase tracking-label text-secondary">
                Get in touch
              </span>
              <h2 className="mt-6 text-h2 tracking-tight">
                Talk to our team about your project.
              </h2>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild variant="accent" size="lg">
                  <Link href="/contact/">Connect With Our Team</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Link href="/services/">Explore Our Services</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
