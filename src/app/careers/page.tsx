import type { Metadata } from "next";
import { JobOpeningsList } from "@/components/forms/job-openings-list";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { loadCareers, loadJobs, loadSite } from "@/lib/content";
import { pageSeo } from "@/lib/page-seo";

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: "Careers",
    ...pageSeo("/careers/"),
    description: `Careers at ${site.name}, Pune.`,
  };
}

export default function CareersPage() {
  const site = loadSite();
  const jobs = loadJobs();
  const { openings } = loadCareers();

  return (
    <div>
      {/* Page Hero */}
      <section className="hero-atmosphere relative w-full bg-primary pt-28 pb-16 text-primary-foreground sm:pt-36 sm:pb-20">
        <Container>
          <SectionLabel tone="inverse" index="001">Careers</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-display max-w-4xl tracking-tight text-primary-foreground lg:col-span-8">
              Careers at Envirosphere.
            </h1>
          </div>
        </Container>
      </section>

      {/* Openings */}
      <section className="border-t border-border bg-surface py-section">
        <Container>
          <div className="flex flex-col justify-between gap-6 border-b border-border pb-12 sm:flex-row sm:items-end">
            <div>
              <SectionLabel index="002">Open Positions</SectionLabel>
              <h2 className="mt-6 text-h2 tracking-tight">Current Vacancies</h2>
            </div>
            {jobs.length > 0 ? (
              <span className="text-sm font-light text-muted-foreground">
                Showing {jobs.length} open position{jobs.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>

          <JobOpeningsList jobs={jobs} contactEmail={site.contact.email} emptyState={openings} />
        </Container>
      </section>
    </div>
  );
}
