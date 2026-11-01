// @vitest-environment node
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import {
  ABOUT_YAML,
  CAREERS_YAML,
  CONTACT_YAML,
  DOWNLOADS_PAGE_YAML,
  GALLERY_PAGE_YAML,
  HOME_YAML,
  MEDIA_YAML,
  SERVICES_PAGE_YAML,
  SITE_YAML,
  WHY_US_YAML,
} from "@tests/unit/helpers/fixtures";
import {
  aboutPageSchema,
  careersSchema,
  contactPageSchema,
  downloadsPageSchema,
  galleryPageSchema,
  homeSchema,
  mediaSchema,
  servicesPageSchema,
  siteSchema,
  whyUsPageSchema,
} from "./content";

describe("content schemas", () => {
  it("accept the valid fixtures", () => {
    expect(siteSchema.safeParse(parse(SITE_YAML)).success).toBe(true);
    expect(mediaSchema.safeParse(parse(MEDIA_YAML)).success).toBe(true);
    expect(homeSchema.safeParse(parse(HOME_YAML)).success).toBe(true);
  });

  it("accepts the services page fixture and requires every serviceDetail label", () => {
    const data = parse(SERVICES_PAGE_YAML);
    expect(servicesPageSchema.safeParse(data).success).toBe(true);
    for (const key of [
      "breadcrumbHome",
      "breadcrumbServices",
      "breadcrumbLabel",
      "notFoundTitle",
      "label",
      "previousLabel",
      "nextLabel",
      "contact",
    ]) {
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

describe("inner page schemas", () => {
  const pages = [
    ["about", aboutPageSchema, ABOUT_YAML],
    ["why-us", whyUsPageSchema, WHY_US_YAML],
    ["contact", contactPageSchema, CONTACT_YAML],
    ["gallery", galleryPageSchema, GALLERY_PAGE_YAML],
    ["downloads", downloadsPageSchema, DOWNLOADS_PAGE_YAML],
    ["careers", careersSchema, CAREERS_YAML],
  ] as const;

  it.each(pages)("accepts the valid %s fixture", (_name, schema, yaml) => {
    expect(schema.safeParse(parse(yaml)).success).toBe(true);
  });

  it.each(pages)("requires seo.title and seo.description on %s", (_name, schema, yaml) => {
    for (const key of ["title", "description"]) {
      const broken = parse(yaml);
      delete broken.seo[key];
      expect(schema.safeParse(broken).success, key).toBe(false);
    }
  });

  it("requires the services hub seo and hero", () => {
    const broken = parse(SERVICES_PAGE_YAML);
    delete broken.hub.seo.description;
    expect(servicesPageSchema.safeParse(broken).success).toBe(false);
  });

  it("requires the hero title and keeps the lead optional", () => {
    const data = parse(GALLERY_PAGE_YAML);
    delete data.hero.lead;
    expect(galleryPageSchema.safeParse(data).success).toBe(true);
    delete data.hero.title;
    expect(galleryPageSchema.safeParse(data).success).toBe(false);
  });

  it("rejects an icon that is not on the allowed list, naming the choices", () => {
    const data = parse(WHY_US_YAML);
    data.pillars[0].icon = "sparkles";
    const result = whyUsPageSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("use one of: award");
  });

  it("rejects an about story without paragraphs", () => {
    const data = parse(ABOUT_YAML);
    data.story.paragraphs = [];
    expect(aboutPageSchema.safeParse(data).success).toBe(false);
  });

  it("rejects a media key that is not written as a key", () => {
    const data = parse(ABOUT_YAML);
    data.story.image = "/media/photos/x.jpg";
    expect(aboutPageSchema.safeParse(data).success).toBe(false);
  });

  it("needs at least one phone label on the contact page", () => {
    const data = parse(CONTACT_YAML);
    data.direct.phoneLabels = [];
    expect(contactPageSchema.safeParse(data).success).toBe(false);
  });

  it("requires {count} in the careers opening counts", () => {
    const data = parse(CAREERS_YAML);
    data.openings.countMany = "Showing open positions";
    expect(careersSchema.safeParse(data).success).toBe(false);
  });
});

