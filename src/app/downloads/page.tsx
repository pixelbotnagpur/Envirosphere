import type { Metadata } from "next";
import { DownloadGrid } from "@/components/sections/download-grid";
import { PageHero } from "@/components/sections/page-hero";
import { getImage, loadDownloads, loadDownloadsPage } from "@/lib/content";
import { pageMetadata } from "@/lib/page-seo";

export function generateMetadata(): Metadata {
  return {
    ...pageMetadata("/downloads/", loadDownloadsPage().seo),
    // An empty page should not be indexed; it also is left out of the sitemap.
    ...(loadDownloads().length === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default function DownloadsPage() {
  const page = loadDownloadsPage();
  const items = loadDownloads().map((item) => ({ ...item, href: getImage(item.fileKey).src }));

  return (
    <div>
      <PageHero {...page.hero} />
      <DownloadGrid items={items} emptyText={page.emptyText} downloadLabel={page.downloadLabel} />
    </div>
  );
}
