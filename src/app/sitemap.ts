import type { MetadataRoute } from "next";
import { loadDownloads, loadServices, loadSite } from "@/lib/content";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = loadSite();
  const services = loadServices();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${site.url}/`,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${site.url}/about/`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.url}/services/`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${site.url}/why-us/`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.url}/careers/`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${site.url}/gallery/`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    // The Downloads page only goes into the sitemap once content/downloads.yaml has entries.
    ...(loadDownloads().length > 0
      ? [{ url: `${site.url}/downloads/`, changeFrequency: "monthly" as const, priority: 0.7 }]
      : []),
    {
      url: `${site.url}/contact/`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${site.url}/services/${service.slug}/`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...serviceRoutes];
}
