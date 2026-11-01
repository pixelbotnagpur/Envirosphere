import { Building2, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { loadServices, loadSite } from "@/lib/content";
import { pageSeo } from "@/lib/page-seo";
import { mailtoHref, telHref } from "@/lib/links";

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: "Contact Us",
    ...pageSeo("/contact/"),
    description: `Contact ${site.name}: head office in Pune, with branch offices in Mumbai, Tarapur, Nashik and Nagpur.`,
  };
}

export default function ContactPage() {
  const site = loadSite();
  const services = loadServices();

  return (
    <div>
      {/* Page Hero */}
      <section className="hero-atmosphere relative w-full bg-primary pt-28 pb-16 text-primary-foreground sm:pt-36 sm:pb-20">
        <Container>
          <SectionLabel tone="inverse" index="001">Contact</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-display max-w-4xl tracking-tight text-primary-foreground lg:col-span-8">
              Contact Envirosphere.
            </h1>
            <p className="text-lead text-primary-foreground/85 font-light lg:col-span-4">
              Tell us about your project by sending an enquiry, or call or email us.
            </p>
          </div>
        </Container>
      </section>

      {/* Main Grid: Form + Office Details */}
      <section className="border-t border-border bg-surface py-section">
        <Container className="grid gap-16 lg:grid-cols-12">
          {/* Inquiry Form Card */}
          <div className="lg:col-span-7">
            <div className="rounded-card border border-border bg-background p-8 sm:p-12 shadow-card">
              <span className="text-label text-muted-foreground uppercase tracking-label">
                Enquiry
              </span>
              <h2 className="mt-3 text-h2 tracking-tight">Send us an enquiry</h2>
              <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                Tell us about your project below.
              </p>

              <div className="mt-8">
                <InquiryForm
                  services={services}
                  phoneFallback={site.contact.phones[0]}
                  emailFallback={site.contact.email}
                  className="space-y-6"
                />
              </div>

            </div>
          </div>

          {/* Office Details & Fast Contact */}
          <div className="lg:col-span-5 space-y-8">
            {/* Direct Communication */}
            <div className="rounded-card border border-border bg-background p-8">
              <h3 className="text-h3">Phone and email</h3>
              <p className="mt-2 text-sm text-muted-foreground font-light">
                You can reach us at:
              </p>

              <div className="mt-6 space-y-4">
                <a
                  href={telHref(site.contact.phones[0])}
                  className="flex items-center gap-4 rounded-control border border-border bg-surface p-4 transition-colors hover:border-primary/50"
                >
                  <div className="flex size-10 items-center justify-center rounded-pill bg-primary/10 text-primary">
                    <Phone aria-hidden="true" className="size-4" />
                  </div>
                  <div>
                    <span className="block text-label uppercase tracking-label text-muted-foreground">Primary Line</span>
                    <span className="text-sm font-normal text-foreground">{site.contact.phones[0]}</span>
                  </div>
                </a>

                {site.contact.phones[1] ? (
                  <a
                    href={telHref(site.contact.phones[1])}
                    className="flex items-center gap-4 rounded-control border border-border bg-surface p-4 transition-colors hover:border-primary/50"
                  >
                    <div className="flex size-10 items-center justify-center rounded-pill bg-primary/10 text-primary">
                      <Phone aria-hidden="true" className="size-4" />
                    </div>
                    <div>
                      <span className="block text-label uppercase tracking-label text-muted-foreground">Secondary Line</span>
                      <span className="text-sm font-normal text-foreground">{site.contact.phones[1]}</span>
                    </div>
                  </a>
                ) : null}

                <a
                  href={mailtoHref(site.contact.email, "Statutory Inquiry - Envirosphere")}
                  className="flex items-center gap-4 rounded-control border border-border bg-surface p-4 transition-colors hover:border-primary/50"
                >
                  <div className="flex size-10 items-center justify-center rounded-pill bg-primary/10 text-primary">
                    <Mail aria-hidden="true" className="size-4" />
                  </div>
                  <div>
                    <span className="block text-label uppercase tracking-label text-muted-foreground">Office Email</span>
                    <span className="text-sm font-normal text-foreground">{site.contact.email}</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Pune Head Office Card */}
            <div className="rounded-card border border-border bg-background p-8">
              <div className="flex items-center gap-2 text-label text-muted-foreground uppercase tracking-label">
                <Building2 aria-hidden="true" className="size-4 text-primary" />
                <span>Head Office</span>
              </div>
              <h3 className="mt-3 text-h3">Pune Office</h3>
              <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                {site.contact.address}
              </p>

            </div>

            {/* Branch Network Summary */}
            <div className="rounded-card border border-border bg-background p-8">
              <span className="text-label text-muted-foreground uppercase tracking-label">Offices</span>
              <h4 className="mt-2 text-h4">Branch offices</h4>
              <ul className="mt-4 grid grid-cols-2 gap-3 text-sm text-foreground/80 font-light">
                {site.offices.filter((o) => o.city !== "Pune").map((office) => (
                  <li key={office.city} className="flex items-center gap-2">
                    <MapPin aria-hidden="true" className="size-3.5 text-primary" />
                    <span>{office.city} Branch</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
