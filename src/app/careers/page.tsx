import { Briefcase, Mail } from "lucide-react";
import type { Metadata } from "next";
import { JobOpeningsList } from "@/components/forms/job-openings-list";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { loadJobs, loadSite } from "@/lib/content";
import { pageSeo } from "@/lib/page-seo";
import { mailtoHref } from "@/lib/links";

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: "Careers | Join Our Environmental Engineering Team",
    ...pageSeo("/careers/"),
    description: `Explore career opportunities in EIA coordination, environmental monitoring, and wastewater engineering at ${site.name}.`,
  };
}

export default function CareersPage() {
  const site = loadSite();
  const jobs = loadJobs();

  return (
    <div>
      {/* Page Hero */}
      <section className="hero-atmosphere relative w-full bg-primary pt-28 pb-16 text-primary-foreground sm:pt-36 sm:pb-20">
        <Container>
          <SectionLabel tone="inverse" index="001">Careers at Envirosphere</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-display max-w-4xl tracking-tight text-primary-foreground lg:col-span-8">
              Work with the vanguard of environmental engineering.
            </h1>
            <p className="text-lead text-primary-foreground/85 font-light lg:col-span-4">
              Join an accredited team tackling complex environmental challenges for infrastructure, energy, and manufacturing leaders across India.
            </p>
          </div>
        </Container>
      </section>

      {/* Culture & Values */}
      <section className="border-t border-border bg-surface py-section">
        <Container>
          <div className="max-w-3xl">
            <h2 className="text-h2 tracking-tight">Technical Rigor & Purpose-Driven Impact</h2>
            <p className="mt-4 text-lead text-muted-foreground font-light">
              We empower our scientists and engineers with advanced analytical equipment, institutional training, and the authority to deliver honest, uncompromising environmental counsel.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Accredited Mentorship",
                desc: "Work alongside certified QCI NABET Category A coordinators and senior environmental functional experts.",
              },
              {
                title: "Diverse Practice Sectors",
                desc: "Gain hands-on experience across coastal developments, chemical zones, renewable energy, and smart cities.",
              },
              {
                title: "Continuous Learning",
                desc: "Stay ahead of evolving statutory frameworks, court rulings, MoEFCC notifications, and ESG methodologies.",
              },
            ].map((item, idx) => (
              <Reveal key={item.title} delay={idx * 0.08}>
                <div className="h-full rounded-card border border-border bg-background p-8">
                  <h3 className="text-h4">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Openings Section */}
      <section className="py-section border-t border-border">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-12 border-b border-border">
            <div>
              <SectionLabel index="002">Open Positions</SectionLabel>
              <h2 className="mt-6 text-h2 tracking-tight">Current Vacancies</h2>
            </div>
            <span className="text-sm text-muted-foreground font-light">
              Showing {jobs.length} open position{jobs.length === 1 ? "" : "s"}
            </span>
          </div>

          {jobs.length > 0 ? (
            <JobOpeningsList jobs={jobs} contactEmail={site.contact.email} />
          ) : (
            <div className="mt-12 rounded-card border border-border bg-surface p-12 text-center max-w-2xl mx-auto">
              <Briefcase aria-hidden="true" className="size-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-h3">No Current Openings</h3>
              <p className="mt-2 text-sm text-muted-foreground font-light">
                We are always interested in connecting with talented environmental professionals. Send your CV and portfolio for future opportunities.
              </p>
              <Button asChild size="lg" className="mt-6">
                <a href={mailtoHref(site.contact.email, "General Career Inquiry - [Your Name]")}>
                  Submit Spontaneous Application
                </a>
              </Button>
            </div>
          )}
        </Container>
      </section>

      {/* General Submission CTA */}
      <section className="border-t border-border bg-surface py-section">
        <Container>
          <div className="rounded-card bg-background border border-border p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h3 className="text-h3">Don’t see your exact role listed?</h3>
              <p className="mt-2 text-sm text-muted-foreground font-light">
                We frequently expand our project teams for major EIA campaigns, environmental audits, and industrial monitoring projects across India.
              </p>
            </div>
            <Button asChild variant="outline" size="lg">
              <a href={mailtoHref(site.contact.email, "Spontaneous Application - Envirosphere")}>
                <Mail aria-hidden="true" className="size-4 mr-2" />
                Email Your Resume
              </a>
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
