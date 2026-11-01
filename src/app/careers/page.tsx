import type { Metadata } from "next";
import { JobOpeningsList } from "@/components/forms/job-openings-list";
import { OpeningsHeader } from "@/components/sections/openings-header";
import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/container";
import { loadCareers, loadJobs, loadSite } from "@/lib/content";
import { pageMetadata } from "@/lib/page-seo";

export function generateMetadata(): Metadata {
  return pageMetadata("/careers/", loadCareers().seo);
}

export default function CareersPage() {
  const site = loadSite();
  const jobs = loadJobs();
  const { hero, openings } = loadCareers();
  const countText = (jobs.length === 1 ? openings.countOne : openings.countMany).replace(
    "{count}",
    String(jobs.length),
  );

  return (
    <div>
      <PageHero {...hero} />

      <section className="border-t border-border bg-surface py-section">
        <Container>
          <OpeningsHeader
            index="002"
            label={openings.label}
            heading={openings.heading}
            note={jobs.length > 0 ? countText : undefined}
          />

          <JobOpeningsList jobs={jobs} contactEmail={site.contact.email} emptyState={openings} />
        </Container>
      </section>
    </div>
  );
}
