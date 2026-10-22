import { Award, Building2, Compass, MapPin, Shield } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { getImageAsset, loadHome, loadSite } from "@/lib/content";

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: "About Us | Accreditations & Nationwide Presence",
    description: `Learn about ${site.name}, a QCI NABET Category A accredited environmental consultant with offices in Pune, Mumbai, Tarapur, Nashik, and Nagpur.`,
  };
}

export default function AboutPage() {
  const site = loadSite();
  const home = loadHome();
  const aboutImage = getImageAsset(home.about.image);

  return (
    <div>
      {/* Page Hero */}
      <section className="hero-atmosphere relative w-full bg-primary pt-28 pb-16 text-primary-foreground sm:pt-36 sm:pb-20">
        <Container>
          <SectionLabel tone="inverse" index="001">Company Profile</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-display max-w-4xl tracking-tight text-primary-foreground lg:col-span-8">
              Pioneering sustainable environmental solutions since inception.
            </h1>
            <p className="text-lead text-primary-foreground/85 font-light lg:col-span-4">
              Envirosphere Consultant and Engineers is a QCI NABET Accredited Category A Consultant, delivering precision environmental engineering, statutory clearances, and compliance nationwide.
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
                The organization is guided by an uncompromising code of ethics, professional rigor, and technical depth. We bridge the gap between regulatory mandates and project velocity, ensuring that critical infrastructure and manufacturing facilities operate in total harmony with statutory environmental frameworks.
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
          <h2 className="mt-6 text-h2 tracking-tight">QCI NABET Category A Credentials</h2>
          <p className="mt-4 max-w-3xl text-lead text-muted-foreground font-light">
            Category A accreditation is the highest national recognition awarded by the National Accreditation Board for Education and Training (NABET) / Quality Council of India (QCI).
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Award,
                title: "NABET Category A",
                desc: "Authorized to prepare EIA/EMP reports for Category A and Category B industrial, building, and mining developments.",
              },
              {
                icon: Shield,
                title: "Statutory Adherence",
                desc: "Complete fidelity to EIA Notification 2006, Water Act 1974, Air Act 1981, and Hazardous Waste Management Rules.",
              },
              {
                icon: Compass,
                title: "Multidisciplinary Team",
                desc: "Certified Functional Area Experts (FAEs) in Air Pollution, Water Quality, Ecology & Biodiversity, and Risk Assessment.",
              },
            ].map((item, idx) => (
              <Reveal key={item.title} delay={idx * 0.1}>
                <div className="h-full rounded-card border border-border bg-surface p-8">
                  <div className="flex size-11 items-center justify-center rounded-pill bg-primary text-primary-foreground">
                    <item.icon aria-hidden="true" className="size-5" />
                  </div>
                  <h3 className="mt-6 text-h3">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* 5-Branch Office Network */}
      <section className="border-t border-border bg-surface py-section">
        <Container>
          <SectionLabel index="003">Presence</SectionLabel>
          <h2 className="mt-6 text-h2 tracking-tight">Five Strategic Regional Offices</h2>
          <p className="mt-4 max-w-2xl text-lead text-muted-foreground font-light">
            Headquartered in Pune with operational branches across major industrial hubs in Maharashtra to ensure immediate, on-the-ground support.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {site.offices.map((office, idx) => (
              <Reveal key={office.city} delay={idx * 0.08}>
                <div className="h-full rounded-card border border-border bg-background p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-label">
                      <Building2 aria-hidden="true" className="size-4 text-primary" />
                      <span>{office.name}</span>
                    </div>
                    <h3 className="mt-4 text-h3">{office.city}</h3>
                    <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                      {office.address ?? `${office.city} Regional Operations Office, Maharashtra, India.`}
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin aria-hidden="true" className="size-3.5 text-primary" />
                    <span>Active Regulatory Jurisdiction</span>
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
                Partner With Us
              </span>
              <h2 className="mt-6 text-h2 tracking-tight">
                Work with accredited experts who understand compliance from first study to final consent.
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
