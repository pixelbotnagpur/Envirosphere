// @vitest-environment node
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { HOME_YAML, MEDIA_YAML, SERVICES_PAGE_YAML, SITE_YAML } from "@tests/unit/helpers/fixtures";
import { homeSchema, mediaSchema, servicesPageSchema, siteSchema } from "./content";

describe("content schemas", () => {
  it("accept the valid fixtures", () => {
    expect(siteSchema.safeParse(parse(SITE_YAML)).success).toBe(true);
    expect(mediaSchema.safeParse(parse(MEDIA_YAML)).success).toBe(true);
    expect(homeSchema.safeParse(parse(HOME_YAML)).success).toBe(true);
  });

  it("accepts the services page fixture and requires every serviceDetail label", () => {
    const data = parse(SERVICES_PAGE_YAML);
    expect(servicesPageSchema.safeParse(data).success).toBe(true);
    for (const key of ["breadcrumbHome", "breadcrumbServices", "label", "previousLabel", "nextLabel", "contact"]) {
      const broken = structuredClone(data);
      delete broken.serviceDetail[key];
      expect(servicesPageSchema.safeParse(broken).success, key).toBe(false);
    }
  });

  it("requires every interface label in site.ui", () => {
    const site = parse(SITE_YAML);
    delete site.ui.skipToContent;
    expect(siteSchema.safeParse(site).success).toBe(false);
  });

  it("rejects a title template without %s", () => {
    const site = parse(SITE_YAML);
    site.seo.titleTemplate = "Test";
    const result = siteSchema.safeParse(site);
    expect(result.success).toBe(false);
  });

  it("rejects a phone number that is not a phone number", () => {
    const site = parse(SITE_YAML);
    site.contact.phones = ["call me"];
    expect(siteSchema.safeParse(site).success).toBe(false);
  });

  it("accepts normal phone numbers", () => {
    for (const value of ["+91 9860220550", "+91 98602 20550"]) {
      const site = parse(SITE_YAML);
      site.contact.phones = [value];
      expect(siteSchema.safeParse(site).success).toBe(true);
    }
  });

  it("rejects phone numbers without enough digits", () => {
    for (const value of ["--------", "        ", "(((())))"]) {
      const site = parse(SITE_YAML);
      site.contact.phones = [value];
      expect(siteSchema.safeParse(site).success).toBe(false);
    }
  });

  it("rejects media paths outside /media/", () => {
    const media = { logo: { src: "/images/logo.svg", alt: "x" } };
    expect(mediaSchema.safeParse(media).success).toBe(false);
  });

  it("rejects media keys that are not lowercase-dash", () => {
    const media = { "Hero Home": { src: "/media/a.jpg", alt: "x" } };
    expect(mediaSchema.safeParse(media).success).toBe(false);
  });

  it("allows social links to be omitted", () => {
    const site = parse(SITE_YAML);
    delete site.links;
    expect(siteSchema.safeParse(site).success).toBe(true);
  });

  it("rejects home clients.logos with fewer than 6 keys", () => {
    const home = parse(HOME_YAML);
    home.clients.logos = ["client-a", "client-b"];
    expect(homeSchema.safeParse(home).success).toBe(false);
  });

  it("rejects negative stats values", () => {
    const home = parse(HOME_YAML);
    home.stats.items[0].value = -1;
    expect(homeSchema.safeParse(home).success).toBe(false);
  });

  it("requires every section label in home", () => {
    const labels = ["about", "services", "stats", "clients", "process", "testimonials", "contact"] as const;
    for (const key of labels) {
      const home = parse(HOME_YAML);
      delete home[key].label;
      expect(homeSchema.safeParse(home).success).toBe(false);
    }
  });
});
