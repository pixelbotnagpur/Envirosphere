import type { Metadata } from "next";
import { GalleryGrid } from "@/components/sections/gallery-grid";
import { PageHero } from "@/components/sections/page-hero";
import { getImageAsset, loadGallery, loadGalleryPage } from "@/lib/content";
import { pageMetadata } from "@/lib/page-seo";

export function generateMetadata(): Metadata {
  return pageMetadata("/gallery/", loadGalleryPage().seo);
}

export default function GalleryPage() {
  const page = loadGalleryPage();
  const items = loadGallery().map((item) => ({ ...item, image: getImageAsset(item.image) }));

  return (
    <div>
      <PageHero {...page.hero} />
      <GalleryGrid items={items} />
    </div>
  );
}
