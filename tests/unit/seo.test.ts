import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { loadServices, loadSite } from "@/lib/content";

describe("SEO & Production Meta", () => {
  it("sitemap contains all expected pages with correct URL formatting", () => {
    const site = loadSite();
    const services = loadServices();
    const entries = sitemap();

    expect(entries.length).toBe(1 + 7 + services.length); // home + 7 static + 13 services = 21

    // Home
    expect(entries.some((e) => e.url === `${site.url}/` && e.priority === 1.0)).toBe(true);

    // Core static routes
    const coreRoutes = ["/about/", "/services/", "/why-us/", "/careers/", "/gallery/", "/downloads/", "/contact/"];
    for (const route of coreRoutes) {
      expect(entries.some((e) => e.url === `${site.url}${route}`)).toBe(true);
    }

    // All services
    for (const service of services) {
      expect(entries.some((e) => e.url === `${site.url}/services/${service.slug}/`)).toBe(true);
    }

    // Every URL starts with site.url and ends with /
    for (const entry of entries) {
      expect(entry.url.startsWith(site.url)).toBe(true);
      expect(entry.url.endsWith("/")).toBe(true);
    }
  });

  it("robots config allows crawling and points to sitemap.xml", () => {
    const site = loadSite();
    const config = robots();

    expect(config.sitemap).toBe(`${site.url}/sitemap.xml`);
    expect(config.rules).toEqual({
      userAgent: "*",
      allow: "/",
    });
  });
});
