import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { getImageAsset, loadService, loadServices, loadSite } from "@/lib/content";
import { canonicalAlternates } from "@/lib/seo";

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const services = loadServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = loadService(slug);
  if (!service) return { title: "Service Not Found" };

  const site = loadSite();
  return {
    title: service.title,
    alternates: canonicalAlternates(site.url, `/services/${slug}/`),
    description: service.summary,
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = loadService(slug);
  if (!service) notFound();

  const allServices = loadServices();
  const currentIndex = allServices.findIndex((s) => s.slug === slug);
  const prevService = currentIndex > 0 ? allServices[currentIndex - 1] : allServices[allServices.length - 1];
  const nextService = currentIndex < allServices.length - 1 ? allServices[currentIndex + 1] : allServices[0];
  const serviceImage = service.image ? getImageAsset(service.image) : null;

  return (
    <div>
      {/* Service Hero & Breadcrumbs */}
      <section className="hero-atmosphere relative w-full bg-primary pt-28 pb-16 text-primary-foreground sm:pt-36 sm:pb-20">
        <Container>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumbs" className="mb-8 flex items-center gap-2 text-label text-primary-foreground/70 uppercase tracking-label">
            <Link href="/" className="hover:text-primary-foreground transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/services/" className="hover:text-primary-foreground transition-colors">Services</Link>
            <span aria-hidden="true">/</span>
            <span className="text-primary-foreground">{service.title}</span>
          </nav>

          <SectionLabel tone="inverse" index={String(service.order).padStart(3, "0")}>
            Service Specification
          </SectionLabel>

          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-display max-w-4xl tracking-tight text-primary-foreground lg:col-span-8">
              {service.title}
            </h1>
            <p className="text-lead text-primary-foreground/85 font-light lg:col-span-4">
              {service.summary}
            </p>
          </div>
        </Container>
      </section>

      {/* Main Content & Scope */}
      <section className="border-t border-border bg-surface py-section">
        <Container className="grid gap-16 lg:grid-cols-12">
          {/* Main Scope Column */}
          <div className="lg:col-span-8">
            {serviceImage ? (
              <Reveal className="mb-10">
                <div className="overflow-hidden rounded-card border border-border bg-background shadow-card">
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface">
                    <Image
                      src={serviceImage.src}
                      alt={serviceImage.alt}
                      width={serviceImage.width ?? 1200}
                      height={serviceImage.height ?? 675}
                      className="h-full w-full object-cover"
                      priority
                    />
                  </div>
                  <div className="border-t border-border px-6 py-3.5 text-sm text-muted-foreground flex items-center justify-between">
                    <span>Field Documentation &bull; {service.title}</span>
                    <span className="uppercase tracking-label text-primary font-normal">Authentic Field Record</span>
                  </div>
                </div>
              </Reveal>
            ) : null}

            <Reveal>
              <h2 className="text-h2 tracking-tight">Scope & Engineering Methodology</h2>
              <p className="mt-6 text-lead text-muted-foreground font-light leading-relaxed">
                Our interdisciplinary team of QCI NABET accredited coordinators, functional area experts, and certified environmental engineers handles end-to-end documentation, technical baseline assessments, regulatory liaison, and statutory follow-ups to secure clean compliance for your facility.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <Reveal delay={0.1}>
                <div className="rounded-card border border-border bg-background p-6">
                  <div className="flex size-10 items-center justify-center rounded-pill bg-primary/10 text-primary">
                    <ShieldCheck aria-hidden="true" className="size-5" />
                  </div>
                  <h3 className="mt-4 text-h4">Accredited Expertise</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-light leading-relaxed">
                    Delivered under NABET Category A accreditation standards, ensuring complete adherence to MoEFCC, CPCB, and State Pollution Control Board guidelines.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="rounded-card border border-border bg-background p-6">
                  <div className="flex size-10 items-center justify-center rounded-pill bg-primary/10 text-primary">
                    <CheckCircle2 aria-hidden="true" className="size-5" />
                  </div>
                  <h3 className="mt-4 text-h4">Full Lifecycle Support</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-light leading-relaxed">
                    From preliminary site due diligence and baseline survey sampling through presentation before technical appraisal committees (SEAC/SEIAA) and post-clearance audits.
                  </p>
                </div>
              </Reveal>
            </div>

            {/* Regulatory Authorities */}
            <div className="mt-12 rounded-card border border-border bg-background p-8">
              <h3 className="text-h4">Governing Authorities & Statutory Frameworks</h3>
              <p className="mt-3 text-sm text-muted-foreground font-light">
                This service interface coordinates approvals and compliance directly with the following statutory bodies:
              </p>
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {[
                  "Ministry of Environment, Forest and Climate Change (MoEFCC)",
                  "State Pollution Control Boards (MPCB & Regional SPCBs)",
                  "State Expert Appraisal Committee (SEAC)",
                  "Maharashtra Industrial Development Corporation (MIDC)",
                  "Central Ground Water Authority (CGWA)",
                  "Directorate of Industrial Safety and Health (DISH)",
                  "Petroleum and Explosives Safety Organization (PESO)",
                ].map((auth) => (
                  <li
                    key={auth}
                    className="rounded-pill border border-border bg-surface px-4 py-2 text-sm font-normal text-foreground"
                  >
                    {auth}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar CTA Card */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 rounded-card border border-border bg-background p-8 shadow-card">
              <span className="text-label text-muted-foreground uppercase tracking-label tabular-nums">
                Service Order {String(service.order).padStart(3, "0")}
              </span>
              <h3 className="mt-4 text-h3">Ready to initiate clearance or audit?</h3>
              <p className="mt-4 text-sm text-muted-foreground font-light leading-relaxed">
                Connect directly with our senior environmental consultants to review your project timeline, requirements, and compliance roadmap.
              </p>

              <div className="mt-8 flex flex-col gap-3">
                <Button asChild size="lg" className="w-full">
                  <Link href="/contact/">Request Consultation</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/services/">All 13 Services</Link>
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t border-border text-sm text-muted-foreground font-light space-y-2">
                <p>Fast turnaround on statutory queries.</p>
                <p>NABET Accredited Category A Consultant.</p>
              </div>
            </div>
          </aside>
        </Container>
      </section>

      {/* Prev / Next Service Navigation */}
      <section className="border-t border-border py-12">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2">
            <Link
              href={`/services/${prevService.slug}/`}
              className="group flex flex-col justify-between rounded-card border border-border p-6 transition-colors duration-(--duration-base) ease-out-expo hover:border-primary/50 hover:bg-surface"
            >
              <div className="flex items-center gap-2 text-label uppercase tracking-label text-muted-foreground">
                <ArrowLeft aria-hidden="true" className="size-3.5 transition-transform group-hover:-translate-x-1" />
                <span>Previous Service</span>
              </div>
              <p className="mt-4 font-heading text-h4 text-foreground group-hover:text-primary transition-colors">
                {prevService.title}
              </p>
            </Link>

            <Link
              href={`/services/${nextService.slug}/`}
              className="group flex flex-col justify-between items-end text-right rounded-card border border-border p-6 transition-colors duration-(--duration-base) ease-out-expo hover:border-primary/50 hover:bg-surface"
            >
              <div className="flex items-center gap-2 text-label uppercase tracking-label text-muted-foreground">
                <span>Next Service</span>
                <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="mt-4 font-heading text-h4 text-foreground group-hover:text-primary transition-colors">
                {nextService.title}
              </p>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
