import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { getImageAsset, loadService, loadServices } from "@/lib/content";
import { pageSeo } from "@/lib/page-seo";

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

  return {
    title: service.title,
    ...pageSeo(`/services/${slug}/`),
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
            Service
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
                </div>
              </Reveal>
            ) : null}
          </div>

          {/* Sidebar CTA Card */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 rounded-card border border-border bg-background p-8 shadow-card">
              <span className="text-label text-muted-foreground uppercase tracking-label tabular-nums">
                Service Order {String(service.order).padStart(3, "0")}
              </span>
              <h3 className="mt-4 text-h3">Interested in this service?</h3>
              <p className="mt-4 text-sm text-muted-foreground font-light leading-relaxed">
                Get in touch to discuss your project.
              </p>

              <div className="mt-8 flex flex-col gap-3">
                <Button asChild size="lg" className="w-full">
                  <Link href="/contact/">Contact us</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/services/">All services</Link>
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t border-border text-sm text-muted-foreground font-light space-y-2">
                <p>QCI NABET Accredited Consultant (Cat A).</p>
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
