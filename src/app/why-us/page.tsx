import { CheckCircle2, Factory, FileCheck2, FlaskConical, Milestone, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { getImageAsset, loadHome, loadSite } from "@/lib/content";
import { canonicalAlternates } from "@/lib/seo";

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: "Why Us | Proven Track Record & Engineering Precision",
    alternates: canonicalAlternates(site.url, "/why-us/"),
    description: `Discover why 250+ industrial and infrastructure leaders trust ${site.name} for statutory environmental clearances and compliance.`,
  };
}

export default function WhyUsPage() {
  const home = loadHome();
  const treatmentImage = getImageAsset("photo-treatment-plant");

  const pillars = [
    {
      icon: ShieldCheck,
      title: "QCI NABET Category A Certified",
      desc: "Our accreditation ensures every report, EIA study, and EMP submission withstands the rigorous review of State & Central Appraisal Committees.",
    },
    {
      icon: Users,
      title: "250+ Corporate & Industrial Clients",
      desc: "Trusted by Fortune 500 multinationals, major infrastructure conglomerates, and industrial park developers across Maharashtra and India.",
    },
    {
      icon: Milestone,
      title: "25+ Active Clearances & Audits",
      desc: "Continuous, live engagement with regulatory bodies gives us real-time insights into changing statutory norms, notifications, and portal workflows.",
    },
    {
      icon: FileCheck2,
      title: "Single-Window Statutory Approvals",
      desc: "We coordinate with MoEFCC, MPCB, MIDC, DISH, PESO, and CGWA under one accountable team, eliminating multi-agency friction.",
    },
    {
      icon: FlaskConical,
      title: "Advanced In-House Monitoring",
      desc: "Comprehensive testing for ambient air, stack emissions, noise, effluent, sewage, and ground water conducted with certified methodologies.",
    },
    {
      icon: Factory,
      title: "Turnkey Treatment Engineering",
      desc: "From designing zero liquid discharge (ZLD) treatment plants to operating on-site ETPs and STPs, we bridge paperwork with practical engineering.",
    },
  ];

  return (
    <div>
      {/* Page Hero */}
      <section className="hero-atmosphere relative w-full bg-primary pt-28 pb-16 text-primary-foreground sm:pt-36 sm:pb-20">
        <Container>
          <SectionLabel tone="inverse" index="001">Competitive Advantage</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-display max-w-4xl tracking-tight text-primary-foreground lg:col-span-8">
              Why leading enterprises partner with Envirosphere.
            </h1>
            <p className="text-lead text-primary-foreground/85 font-light lg:col-span-4">
              Environmental compliance should accelerate your business, not stall it. We combine accredited scientific rigor with operational agility.
            </p>
          </div>
        </Container>
      </section>

      {/* Pillars Grid */}
      <section className="border-t border-border bg-surface py-section">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar, idx) => (
              <li key={pillar.title} className="flex list-none">
                <Reveal delay={idx * 0.06} className="flex w-full">
                  <div className="h-full rounded-card border border-border bg-background p-8 flex flex-col justify-between">
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

                    <div className="mt-8 pt-4 border-t border-border flex items-center gap-2 text-sm text-primary font-normal">
                      <CheckCircle2 aria-hidden="true" className="size-3.5" />
                      <span>Verified Compliance Delivery</span>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </div>

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
                    Turnkey Engineering Depth
                  </span>
                  <h3 className="text-h3 tracking-tight">
                    Beyond Advisory: Practical On-Ground Engineering
                  </h3>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    Unlike pure paperwork liaisons, our in-house engineering team designs, commissions, and operates biological effluent treatment (ETP) and sewage treatment (STP) plants with zero liquid discharge (ZLD) systems across Maharashtra.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Stats Counter Banner */}
      <section className="border-t border-border bg-secondary py-section text-secondary-foreground">
        <Container>
          <SectionLabel index="002" className="text-secondary-foreground">
            Measurable Impact
          </SectionLabel>
          <div className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {home.stats.items.map((item) => (
              <div key={item.label} className="border-t border-secondary-foreground/45 pt-6">
                <p className="font-heading text-display tracking-tight">
                  {item.value}
                  {item.suffix ? <span>{item.suffix}</span> : null}
                </p>
                <p className="mt-2 text-lead font-light text-secondary-foreground/90">
                  {item.label}
                </p>
              </div>
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
                Get Started
              </span>
              <h2 className="mt-6 text-h2 tracking-tight">
                Secure your project’s statutory clearance without delays or compliance exposure.
              </h2>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild variant="accent" size="lg">
                  <Link href="/contact/">Schedule a Compliance Consultation</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Link href="/services/">Review All Services</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
