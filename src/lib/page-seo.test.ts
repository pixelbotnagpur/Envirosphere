// @vitest-environment node
import { describe, expect, it } from "vitest";
import { loadServices } from "@/lib/content";
import { baseOpenGraph, pageSeo } from "./page-seo";

describe("pageSeo", () => {
  it("sets og:url equal to the canonical for every route", () => {
    const routes = [
      "/",
      "/about/",
      "/services/",
      ...loadServices().map((s) => `/services/${s.slug}/`),
    ];
    for (const route of routes) {
      const seo = pageSeo(route);
      expect(seo.alternates?.canonical).toMatch(/^https:\/\/.+\/$/);
      expect(seo.openGraph?.url).toBe(seo.alternates?.canonical);
    }
  });

  it("keeps the site-wide Open Graph fields, since a page openGraph replaces the layout one", () => {
    const base = baseOpenGraph();
    const og = pageSeo("/about/").openGraph;
    expect(og).toMatchObject({ siteName: base.siteName, type: "website", images: base.images });
    expect(base.images).toBeTruthy();
  });
});
