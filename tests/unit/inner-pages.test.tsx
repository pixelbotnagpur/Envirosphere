// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  loadAboutPage,
  loadCareers,
  loadContactPage,
  loadDownloadsPage,
  loadForms,
  loadGalleryPage,
  loadServicesPage,
  loadSite,
  loadWhyUsPage,
} from "@/lib/content";

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

type Seo = { title: string; description: string };
interface PageCase {
  route: string;
  load: () => Promise<{ default: () => React.ReactElement; generateMetadata: () => { title?: unknown; description?: unknown } }>;
  seo: Seo;
  hero: { eyebrow: string; title: string; lead?: string };
  /** Strings from the content files that must appear on the page. */
  expected: string[];
}

const about = loadAboutPage();
const whyUs = loadWhyUsPage();
const contact = loadContactPage();
const gallery = loadGalleryPage();
const downloads = loadDownloadsPage();
const careers = loadCareers();
const { hub } = loadServicesPage();
const site = loadSite();
const forms = loadForms();

const cases: PageCase[] = [
  {
    route: "/about/",
    load: () => import("@/app/about/page"),
    seo: about.seo,
    hero: about.hero,
    expected: [
      about.story.heading,
      ...about.story.paragraphs,
      about.accreditation.heading,
      about.accreditation.feature.title,
      about.offices.heading,
      about.cta.primaryCta.label,
      ...site.offices.map((o) => o.city),
    ],
  },
  {
    route: "/why-us/",
    load: () => import("@/app/why-us/page"),
    seo: whyUs.seo,
    hero: whyUs.hero,
    expected: [...whyUs.pillars.flatMap((p) => [p.title, p.text]), whyUs.feature.title, whyUs.cta.heading],
  },
  {
    route: "/contact/",
    load: () => import("@/app/contact/page"),
    seo: contact.seo,
    hero: contact.hero,
    expected: [
      contact.enquiry.heading,
      forms.inquiry.submitLabel,
      forms.inquiry.fields.name.label,
      forms.inquiry.fields.service.generalOption,
      contact.direct.heading,
      contact.headOffice.heading,
      site.contact.address,
      site.contact.email,
      ...site.contact.phones.slice(0, contact.direct.phoneLabels.length),
      ...site.offices
        .filter((o) => o.city !== contact.headOffice.city)
        .map((o) => `${o.city} ${contact.branches.itemSuffix}`),
    ],
  },
  {
    route: "/careers/",
    load: () => import("@/app/careers/page"),
    seo: careers.seo,
    hero: careers.hero,
    expected: [careers.openings.label, careers.openings.heading, careers.openings.noneHeading],
  },
  {
    route: "/gallery/",
    load: () => import("@/app/gallery/page"),
    seo: gallery.seo,
    hero: gallery.hero,
    expected: [],
  },
  {
    route: "/downloads/",
    load: () => import("@/app/downloads/page"),
    seo: downloads.seo,
    hero: downloads.hero,
    expected: [downloads.emptyText],
  },
  {
    route: "/services/",
    load: () => import("@/app/services/page"),
    seo: hub.seo,
    hero: hub.hero,
    expected: [hub.viewLabel, hub.cta.heading, hub.cta.lead ?? "", hub.cta.primaryCta.label],
  },
];

describe("inner pages render their copy from content/", () => {
  it.each(cases)("$route", async ({ route, load, seo, hero, expected }) => {
    const page = await load();
    const html = renderToStaticMarkup(page.default());
    const text = visibleText(html);

    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    for (const value of [hero.eyebrow, hero.title, hero.lead ?? "", ...expected]) {
      expect(text, `missing on ${route}: ${value}`).toContain(value);
    }

    const metadata = page.generateMetadata();
    expect(metadata.title).toBe(seo.title);
    expect(metadata.description).toBe(seo.description);
  });
});
