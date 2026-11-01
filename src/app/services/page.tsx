import type { Metadata } from "next";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { ServiceCardGrid } from "@/components/sections/service-card-grid";
import { getImageAsset, loadServices, loadServicesPage } from "@/lib/content";
import { pageMetadata } from "@/lib/page-seo";

export function generateMetadata(): Metadata {
  return pageMetadata("/services/", loadServicesPage().hub.seo);
}

export default function ServicesPage() {
  const { hub } = loadServicesPage();
  const items = loadServices().map(({ slug, order, title, summary, image }) => ({
    slug,
    order,
    title,
    summary,
    image: image ? getImageAsset(image) : undefined,
  }));

  return (
    <div>
      <PageHero {...hub.hero} />
      <ServiceCardGrid items={items} listLabel={hub.listLabel} viewLabel={hub.viewLabel} />
      <CtaBand tone="secondary" index="002" {...hub.cta} />
    </div>
  );
}
