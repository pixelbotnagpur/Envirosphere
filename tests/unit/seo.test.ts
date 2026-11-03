import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { loadDownloads, loadServices, loadSite } from "@/lib/content";

describe("SEO & Production Meta", () => {
  it("sitemap contains all expected pages with correct URL formatting", () => {
    const site = loadSite();
    const services = loadServices();
    const entries = sitemap();

    // Downloads is listed only while content/downloads.yaml has entries.
    const hasDownloads = loadDownloads().length > 0;
    expect(entries.length).toBe(1 + 6 + (hasDownloads ? 1 : 0) + services.length);
    expect(entries.some((e) => e.url === `${site.url}/downloads/`)).toBe(hasDownloads);

    // Home
    expect(entries.some((e) => e.url === `${site.url}/` && e.priority === 1.0)).toBe(true);

    // Core static routes
    const coreRoutes = ["/about/", "/services/", "/why-us/", "/careers/", "/gallery/", "/contact/"];
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

  describe("client preview build", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("blocks every crawler when NEXT_PUBLIC_NOINDEX is 1", () => {
      vi.stubEnv("NEXT_PUBLIC_NOINDEX", "1");
      expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    });

    it("still allows crawling in the real launch build", () => {
      vi.stubEnv("NEXT_PUBLIC_NOINDEX", "");
      expect(robots().rules).toMatchObject({ allow: "/" });
    });
  });
});
