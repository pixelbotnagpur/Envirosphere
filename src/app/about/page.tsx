import type { Metadata } from "next";
import { CardGrid } from "@/components/sections/card-grid";
import { ContentSection } from "@/components/sections/content-section";
import { CtaBand } from "@/components/sections/cta-band";
import { MediaFeature } from "@/components/sections/media-feature";
import { PageHero } from "@/components/sections/page-hero";
import { TextSplit } from "@/components/sections/text-split";
import { getImageAsset, loadAboutPage, loadSite } from "@/lib/content";
import { pageMetadata } from "@/lib/page-seo";

export function generateMetadata(): Metadata {
  return pageMetadata("/about/", loadAboutPage().seo);
}

export default function AboutPage() {
  const page = loadAboutPage();
  const site = loadSite();

  return (
    <div>
      <PageHero {...page.hero} />

      <TextSplit
        heading={page.story.heading}
        paragraphs={page.story.paragraphs}
        image={getImageAsset(page.story.image)}
      />

      <ContentSection
        index="002"
        label={page.accreditation.label}
        heading={page.accreditation.heading}
        lead={page.accreditation.lead}
      >
        <MediaFeature
          className="mt-12"
          image={getImageAsset(page.accreditation.feature.image)}
          eyebrow={page.accreditation.feature.eyebrow}
          title={page.accreditation.feature.title}
          text={page.accreditation.feature.text}
        />
      </ContentSection>

      <ContentSection
        index="003"
        tone="surface"
        leadWidth="2xl"
        label={page.offices.label}
        heading={page.offices.heading}
        lead={page.offices.lead}
      >
        <CardGrid
          className="mt-12"
          variant="label"
          columns="three"
          headingLevel={3}
          items={site.offices.map((office) => ({
            icon: page.offices.icon,
            eyebrow: office.name,
            title: office.city,
            text: office.address,
          }))}
        />
      </ContentSection>

      <CtaBand {...page.cta} />
    </div>
  );
}
