import type { Metadata } from "next";
import { CardGrid } from "@/components/sections/card-grid";
import { CtaBand } from "@/components/sections/cta-band";
import { MediaFeature } from "@/components/sections/media-feature";
import { PageHero } from "@/components/sections/page-hero";
import { Stats } from "@/components/sections/stats";
import { Container } from "@/components/ui/container";
import { getImageAsset, loadHome, loadSite, loadWhyUsPage } from "@/lib/content";
import { pageMetadata } from "@/lib/page-seo";

export function generateMetadata(): Metadata {
  return pageMetadata("/why-us/", loadWhyUsPage().seo);
}

export default function WhyUsPage() {
  const page = loadWhyUsPage();
  const site = loadSite();
  // The numbers band is shared with the Home page so the figures are edited in one place.
  const { stats } = loadHome();

  return (
    <div>
      <PageHero {...page.hero} />

      <section className="border-t border-border bg-surface py-section">
        <Container>
          <CardGrid asList stagger={0.06} items={page.pillars} />
          <MediaFeature
            className="mt-14"
            image={getImageAsset(page.feature.image)}
            eyebrow={page.feature.eyebrow}
            title={page.feature.title}
            text={page.feature.text}
          />
        </Container>
      </section>

      <Stats index="002" label={stats.label} items={stats.items} locale={site.locale} tone="background" />

      <CtaBand {...page.cta} />
    </div>
  );
}
