import { Building2, Clock, Mail, MapPin, MessageSquare, Phone, Send, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { loadServices, loadSite } from "@/lib/content";
import { mailtoHref, telHref } from "@/lib/links";

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: "Contact Us | Head Office Pune & Regional Branches",
    description: `Connect with ${site.name} for environmental clearance inquiries, compliance audits, and engineering consultations.`,
  };
}

export default function ContactPage() {
  const site = loadSite();
  const services = loadServices();

  return (
    <div className="py-section">
      {/* Header */}
      <section className="pb-16 sm:pb-20">
        <Container>
          <SectionLabel index="001">Contact & Consultation</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-display max-w-4xl tracking-tight lg:col-span-8">
              Start your compliance consultation with our senior team.
            </h1>
            <p className="text-lead text-muted-foreground font-light lg:col-span-4">
              Whether you are planning a greenfield industrial development, seeking statutory clearances, or upgrading an ETP/STP facility, we provide accountable, timely guidance.
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
                Direct Inquiry
              </span>
              <h2 className="mt-3 text-h2 tracking-tight">Project Consultation Request</h2>
              <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                Fill in your project parameters below. Our accredited technical team will review your requirements and respond within one business day.
              </p>

              <form className="mt-8 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-xs uppercase tracking-label font-normal text-foreground">
                      Full Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      className="mt-2 w-full rounded-control border border-border bg-surface px-4 py-3 text-sm text-foreground"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-xs uppercase tracking-label font-normal text-foreground">
                      Organization / Company *
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      required
                      placeholder="e.g. Tata Projects Ltd."
                      className="mt-2 w-full rounded-control border border-border bg-surface px-4 py-3 text-sm text-foreground"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email" className="block text-xs uppercase tracking-label font-normal text-foreground">
                      Work Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="rahul@company.com"
                      className="mt-2 w-full rounded-control border border-border bg-surface px-4 py-3 text-sm text-foreground"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs uppercase tracking-label font-normal text-foreground">
                      Phone Number *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="+91 98000 00000"
                      className="mt-2 w-full rounded-control border border-border bg-surface px-4 py-3 text-sm text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="service" className="block text-xs uppercase tracking-label font-normal text-foreground">
                    Service of Interest *
                  </label>
                  <select
                    id="service"
                    name="service"
                    required
                    defaultValue=""
                    className="mt-2 w-full rounded-control border border-border bg-surface px-4 py-3 text-sm text-foreground"
                  >
                    <option value="" disabled>Select an environmental service...</option>
                    {services.map((s) => (
                      <option key={s.slug} value={s.title}>
                        {String(s.order).padStart(3, "0")} - {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs uppercase tracking-label font-normal text-foreground">
                    Project Details & Location
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="Briefly describe your project sector, plot area, MIDC location, or statutory deadline..."
                    className="mt-2 w-full rounded-control border border-border bg-surface p-4 text-sm text-foreground resize-none"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" size="lg" className="w-full sm:w-auto">
                    <Send aria-hidden="true" className="size-4 mr-2" />
                    Submit Consultation Request
                  </Button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-border flex items-center gap-2 text-xs text-muted-foreground font-light">
                <ShieldCheck aria-hidden="true" className="size-4 text-primary shrink-0" />
                <span>Your project data is handled under strict professional non-disclosure protocols.</span>
              </div>
            </div>
          </div>

          {/* Office Details & Fast Contact */}
          <div className="lg:col-span-5 space-y-8">
            {/* Direct Communication */}
            <div className="rounded-card border border-border bg-background p-8">
              <h3 className="text-h3">Direct Channels</h3>
              <p className="mt-2 text-sm text-muted-foreground font-light">
                For urgent clearances or immediate document submission deadlines:
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
                    <span className="block text-xs uppercase tracking-label text-muted-foreground">Primary Line</span>
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
                      <span className="block text-xs uppercase tracking-label text-muted-foreground">Secondary Line</span>
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
                    <span className="block text-xs uppercase tracking-label text-muted-foreground">Office Email</span>
                    <span className="text-sm font-normal text-foreground">{site.contact.email}</span>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${site.contact.phones[0].replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-control border border-border bg-surface p-4 transition-colors hover:border-primary/50"
                >
                  <div className="flex size-10 items-center justify-center rounded-pill bg-primary/10 text-primary">
                    <MessageSquare aria-hidden="true" className="size-4" />
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-label text-muted-foreground">WhatsApp Business</span>
                    <span className="text-sm font-normal text-foreground">Direct Technical Messaging</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Pune Head Office Card */}
            <div className="rounded-card border border-border bg-background p-8">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-label">
                <Building2 aria-hidden="true" className="size-4 text-primary" />
                <span>Corporate Headquarters</span>
              </div>
              <h3 className="mt-3 text-h3">Pune Office</h3>
              <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                {site.contact.address}
              </p>

              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock aria-hidden="true" className="size-4 text-primary" />
                <span>Monday – Saturday: 9:30 AM – 6:30 PM IST</span>
              </div>
            </div>

            {/* Branch Network Summary */}
            <div className="rounded-card border border-border bg-background p-8">
              <span className="text-xs text-muted-foreground uppercase tracking-label">Regional Presence</span>
              <h4 className="mt-2 text-h4">Branch Office Network</h4>
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
