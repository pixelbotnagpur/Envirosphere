// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getImage, loadHome, loadServices, loadSite } from "@/lib/content";

vi.mock("lenis/react", () => ({
  ReactLenis: ({ children }: { children?: unknown }) => children,
  useLenis: () => undefined,
}));

/** Text as the browser shows it: markup removed, entities decoded. */
const visibleText = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

const home = loadHome();
const site = loadSite();
const services = loadServices();

describe("Home page renders content/pages/home.yaml", () => {
  it("shows the hero, section and card copy from the file", async () => {
    const { default: HomePage } = await import("@/app/page");
    const text = visibleText(renderToStaticMarkup(HomePage()));
    const expected = [
      home.hero.eyebrow,
      home.hero.title,
      home.hero.primaryCta.label,
      home.services.viewLabel,
      home.fieldArchive.heading,
      home.fieldArchive.topCta.label,
      home.fieldArchive.bottomCta.label,
      ...home.hero.keywords,
      ...home.fieldArchive.items.flatMap((item) => [item.tag, item.caption]),
      ...home.services.featured.map((card) => card.tag),
    ];
    for (const value of expected) expect(text, value).toContain(value);
  });

  it("uses the images named in the file (hero background and about photo)", async () => {
    const { default: HomePage } = await import("@/app/page");
    const html = renderToStaticMarkup(HomePage());
    // next/image may wrap the path in /_next/image?url=... when the optimizer is on (not in the export).
    const used = (key: string) => {
      const { src } = getImage(key);
      return html.includes(src) || html.includes(encodeURIComponent(src));
    };
    expect(home.hero.image).toBeDefined();
    expect(used(home.hero.image as string)).toBe(true);
    expect(used(home.about.image)).toBe(true);
    expect(used(home.visualBreak.image)).toBe(true);
  });

  it("links each featured card to its own service page, with title and summary from the service", async () => {
    const { default: HomePage } = await import("@/app/page");
    const html = renderToStaticMarkup(HomePage());
    const text = visibleText(html);
    for (const card of home.services.featured) {
      const service = services.find((s) => s.slug === card.service);
      expect(service, card.service).toBeDefined();
      expect(html).toContain(`href="/services/${card.service}/"`);
      expect(text).toContain(card.title ?? service?.title ?? "");
      expect(text).toContain(card.summary ?? service?.summary ?? "");
    }
  });

  it("shows the hero facts from the stats and the office cities from site.yaml", async () => {
    const { default: HomePage } = await import("@/app/page");
    const text = visibleText(renderToStaticMarkup(HomePage()));
    for (const label of home.hero.highlights) {
      const stat = home.stats.items.find((item) => item.label === label);
      expect(text).toContain(`${stat?.value}${stat?.suffix} ${label}`);
    }
    expect(text).toContain(site.offices.map((o) => o.city).join(" • "));
  });

  it("takes the page title (as written) and description from the file", async () => {
    const { generateMetadata } = await import("@/app/page");
    const meta = generateMetadata();
    expect(meta.title).toEqual({ absolute: home.seo.title });
    expect(meta.description).toBe(home.seo.description);
    expect(meta.alternates?.canonical).toBe(`${site.url}/`);
  });
});
