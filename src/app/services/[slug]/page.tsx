import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { ContactCta } from "@/components/sections/contact-cta";
import { Container } from "@/components/ui/container";
import { Markdown } from "@/components/ui/markdown";
import { SectionLabel } from "@/components/ui/section-label";
import { getImageAsset, loadService, loadServices, loadServicesPage, loadSite } from "@/lib/content";
import { pageSeo } from "@/lib/page-seo";
import { serviceNeighbours } from "@/lib/services-nav";

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
  if (!service) return { title: loadServicesPage().serviceDetail.notFoundTitle };

  return {
    title: service.title,
    ...pageSeo(`/services/${slug}/`),
    description: service.summary,
  };
}

const NEIGHBOUR_CARD =
  "group flex flex-col justify-between rounded-card border border-border p-6 transition-colors duration-(--duration-base) ease-out-expo hover:border-primary/50 hover:bg-surface";

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = loadService(slug);
  if (!service) notFound();

  const { serviceDetail: t } = loadServicesPage();
  const site = loadSite();
  const { previous, next } = serviceNeighbours(loadServices(), slug);
  const serviceImage = service.image ? getImageAsset(service.image) : null;

  return (
    <div>
      <section className="hero-atmosphere relative w-full bg-primary pt-28 pb-16 text-primary-foreground sm:pt-36 sm:pb-20">
        <Container>
          <nav
            aria-label={t.breadcrumbLabel}
            className="mb-8 flex flex-wrap items-center gap-2 text-label text-primary-foreground/70 uppercase tracking-label"
          >
            <Link href="/" className="hover:text-primary-foreground transition-colors">
              {t.breadcrumbHome}
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/services/" className="hover:text-primary-foreground transition-colors">
              {t.breadcrumbServices}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-primary-foreground">{service.title}</span>
          </nav>

          <SectionLabel tone="inverse" index={String(service.order).padStart(3, "0")}>
            {t.label}
          </SectionLabel>

          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-display max-w-4xl tracking-tight text-primary-foreground lg:col-span-8">
              {service.title}
            </h1>
            <p className="text-lead text-primary-foreground/85 font-light lg:col-span-4">{service.summary}</p>
          </div>
        </Container>
      </section>

      <section className="border-t border-border bg-surface py-section">
        <Container className="grid gap-12 lg:grid-cols-12">
          {serviceImage ? (
            <Reveal className="lg:col-span-12">
              <div className="overflow-hidden rounded-card border border-border bg-background shadow-card">
                <div className="relative aspect-[21/9] w-full overflow-hidden bg-surface">
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
          <Markdown className="lg:col-span-8">{service.body}</Markdown>
        </Container>
      </section>

      <section className="border-t border-border py-12">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2">
            {previous ? (
              <Link href={`/services/${previous.slug}/`} className={NEIGHBOUR_CARD} rel="prev">
                <span className="flex items-center gap-2 text-label uppercase tracking-label text-muted-foreground">
                  <ArrowLeft aria-hidden="true" className="size-3.5 transition-transform group-hover:-translate-x-1" />
                  {t.previousLabel}
                </span>
                <span className="mt-4 font-heading text-h4 text-foreground transition-colors group-hover:text-primary">
                  {previous.title}
                </span>
              </Link>
            ) : (
              <div aria-hidden="true" className="hidden sm:block" />
            )}
            {next ? (
              <Link href={`/services/${next.slug}/`} className={`${NEIGHBOUR_CARD} items-end text-right`} rel="next">
                <span className="flex items-center gap-2 text-label uppercase tracking-label text-muted-foreground">
                  {t.nextLabel}
                  <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="mt-4 font-heading text-h4 text-foreground transition-colors group-hover:text-primary">
                  {next.title}
                </span>
              </Link>
            ) : null}
          </div>
        </Container>
      </section>

      <ContactCta
        label={t.contact.label}
        heading={t.contact.heading}
        body={t.contact.body}
        primaryCta={t.contact.primaryCta}
        phone={site.contact.phones[0]}
        email={site.contact.email}
        phoneLabel={t.contact.phoneLabel}
        emailLabel={t.contact.emailLabel}
      />
    </div>
  );
}
