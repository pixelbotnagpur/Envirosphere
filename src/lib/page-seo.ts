import type { Metadata } from "next";
import { getImage, loadSite } from "@/lib/content";
import { canonicalUrl } from "@/lib/seo";

/**
 * Site-wide Open Graph fields. A page-level `openGraph` REPLACES the layout one in Next
 * metadata (no deep merge), so every page that sets `og:url` must carry these as well.
 */
export function baseOpenGraph(): NonNullable<Metadata["openGraph"]> {
  const site = loadSite();
  const og = getImage(site.seo.ogImageKey);
  return {
    siteName: site.name,
    locale: site.locale.replace("-", "_"),
    type: "website",
    images: [{ url: og.src, alt: og.alt }],
  };
}

/** Canonical link plus an `og:url` that always equals it, for one route. */
export function pageSeo(routePath: string): Pick<Metadata, "alternates" | "openGraph"> {
  const url = canonicalUrl(loadSite().url, routePath);
  return { alternates: { canonical: url }, openGraph: { ...baseOpenGraph(), url } };
}
