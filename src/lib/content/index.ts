import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  aboutPageSchema,
  careersSchema,
  contactPageSchema,
  downloadsPageSchema,
  downloadsSchema,
  formsSchema,
  galleryPageSchema,
  gallerySchema,
  homeSchema,
  jobsSchema,
  mediaSchema,
  serviceFrontMatterSchema,
  servicesPageSchema,
  siteSchema,
  whyUsPageSchema,
  type AboutPageContent,
  type Careers,
  type ContactPageContent,
  type DownloadItem,
  type DownloadsPageContent,
  type FormsContent,
  type GalleryItem,
  type GalleryPageContent,
  type Home,
  type Job,
  type Media,
  type ServiceFrontMatter,
  type ServicesPage,
  type Site,
  type WhyUsPageContent,
} from "../validators/content";
import { resolveMedia, toImageAsset, verifyAllMedia, type ImageAsset, type ResolvedMedia } from "./media";
import { CONTENT_ROOT, ContentError, PUBLIC_ROOT, readMarkdownFile, readYamlFile } from "./read";

export type Service = ServiceFrontMatter & { slug: string; body: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const loadSite = (root = CONTENT_ROOT): Site => readYamlFile("site.yaml", siteSchema, root);
export const loadMedia = (root = CONTENT_ROOT): Media => readYamlFile("media.yaml", mediaSchema, root);
export const loadHome = (root = CONTENT_ROOT): Home =>
  readYamlFile("pages/home.yaml", homeSchema, root);

export const loadForms = (root = CONTENT_ROOT): FormsContent =>
  readYamlFile("forms.yaml", formsSchema, root);

export const loadServicesPage = (root = CONTENT_ROOT): ServicesPage =>
  readYamlFile("pages/services.yaml", servicesPageSchema, root);

export const loadCareers = (root = CONTENT_ROOT): Careers =>
  readYamlFile("pages/careers.yaml", careersSchema, root);

export const loadAboutPage = (root = CONTENT_ROOT): AboutPageContent =>
  readYamlFile("pages/about.yaml", aboutPageSchema, root);

export const loadWhyUsPage = (root = CONTENT_ROOT): WhyUsPageContent =>
  readYamlFile("pages/why-us.yaml", whyUsPageSchema, root);

export const loadContactPage = (root = CONTENT_ROOT): ContactPageContent =>
  readYamlFile("pages/contact.yaml", contactPageSchema, root);

export const loadGalleryPage = (root = CONTENT_ROOT): GalleryPageContent =>
  readYamlFile("pages/gallery.yaml", galleryPageSchema, root);

export const loadDownloadsPage = (root = CONTENT_ROOT): DownloadsPageContent =>
  readYamlFile("pages/downloads.yaml", downloadsPageSchema, root);

export const loadJobs = (root = CONTENT_ROOT): Job[] => {
  const file = path.join(root, "jobs.yaml");
  return existsSync(file) ? readYamlFile("jobs.yaml", jobsSchema, root) : [];
};

export const loadDownloads = (root = CONTENT_ROOT): DownloadItem[] => {
  const file = path.join(root, "downloads.yaml");
  return existsSync(file) ? readYamlFile("downloads.yaml", downloadsSchema, root) : [];
};

export const loadGallery = (root = CONTENT_ROOT): GalleryItem[] => {
  const file = path.join(root, "gallery.yaml");
  return existsSync(file) ? readYamlFile("gallery.yaml", gallerySchema, root) : [];
};

export function loadServices(root = CONTENT_ROOT): Service[] {
  const dir = path.join(root, "services");
  if (!existsSync(dir)) return [];
  const names = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith(".") && !entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const services: Service[] = [];
  for (const file of names) {
    if (!file.endsWith(".md")) {
      throw new ContentError(
        `content/services/${file}: only .md files are allowed here (rename to lowercase .md or remove it)`,
      );
    }
    const slug = file.replace(/\.md$/, "");
    if (!SLUG.test(slug)) {
      throw new ContentError(
        `content/services/${file}: file names must be lowercase letters, numbers and dashes, e.g. crz-clearance.md`,
      );
    }
    const { data, body } = readMarkdownFile(`services/${file}`, serviceFrontMatterSchema, root);
    if (body.trim() === "") {
      throw new ContentError(
        `content/services/${file}: the service text below the --- line is empty; write the service description there`,
      );
    }
    services.push({ ...data, slug, body });
  }
  const seen = new Map<number, string>();
  for (const service of services) {
    const first = seen.get(service.order);
    if (first) {
      throw new ContentError(
        `content/services: "${first}" and "${service.slug}.md" both use order ${service.order}; give each service a different number`,
      );
    }
    seen.set(service.order, `${service.slug}.md`);
  }
  return services.sort((a, b) => a.order - b.order);
}

export function loadService(slug: string, root = CONTENT_ROOT): Service | undefined {
  return loadServices(root).find((s) => s.slug === slug);
}

export interface FeaturedService {
  slug: string;
  title: string;
  summary: string;
  tag: string;
  image: string;
  href: string;
}

/**
 * The Home cards under "What we offer". Each card names a service file; its link is built from that
 * name, so it can never point at a page that does not exist. Title and summary come from the service
 * file unless the card overrides them in home.yaml.
 */
export function resolveFeaturedServices(home: Home, services: Service[]): FeaturedService[] {
  return home.services.featured.map((card, index) => {
    const service = services.find((s) => s.slug === card.service);
    if (!service) {
      throw new ContentError(
        `content/pages/home.yaml → services.featured[${index}].service: "${card.service}" is not a service; ` +
          `use a file name from content/services without .md (${services.map((s) => s.slug).join(", ")})`,
      );
    }
    return {
      slug: service.slug,
      title: card.title ?? service.title,
      summary: card.summary ?? service.summary,
      tag: card.tag,
      image: card.image,
      href: `/services/${service.slug}/`,
    };
  });
}

/** Loads everything and checks every media reference. Used by `pnpm content:check` and the build. */
export function loadAll(root = CONTENT_ROOT, publicRoot = PUBLIC_ROOT) {
  const site = loadSite(root);
  const media = loadMedia(root);
  const home = loadHome(root);
  const services = loadServices(root);
  const servicesPage = loadServicesPage(root);
  const careers = loadCareers(root);
  const forms = loadForms(root);
  const aboutPage = loadAboutPage(root);
  const whyUsPage = loadWhyUsPage(root);
  const contactPage = loadContactPage(root);
  const galleryPage = loadGalleryPage(root);
  const downloadsPage = loadDownloadsPage(root);
  const jobs = loadJobs(root);
  const gallery = loadGallery(root);
  const downloads = loadDownloads(root);

  verifyAllMedia(media, publicRoot);
  resolveFeaturedServices(home, services);
  if (!site.offices.some((office) => office.city === contactPage.headOffice.city)) {
    throw new ContentError(
      `content/pages/contact.yaml → headOffice.city: "${contactPage.headOffice.city}" is not one of the offices in content/site.yaml (${site.offices.map((o) => o.city).join(", ")})`,
    );
  }
  const references: [string | undefined, string][] = [
    [site.logoKey, "content/site.yaml → logoKey"],
    [site.seo.ogImageKey, "content/site.yaml → seo.ogImageKey"],
    [home.hero.image, "content/pages/home.yaml → hero.image"],
    [home.about.image, "content/pages/home.yaml → about.image"],
    ...home.services.featured.map((card, index): [string | undefined, string] => [
      card.image,
      `content/pages/home.yaml → services.featured[${index}].image`,
    ]),
    ...home.fieldArchive.items.map((item, index): [string | undefined, string] => [
      item.image,
      `content/pages/home.yaml → fieldArchive.items[${index}].image`,
    ]),
    [home.visualBreak.image, "content/pages/home.yaml → visualBreak.image"],
    ...home.clients.logos.map((key, index): [string | undefined, string] => [
      key,
      `content/pages/home.yaml → clients.logos[${index}]`,
    ]),
    [aboutPage.story.image, "content/pages/about.yaml → story.image"],
    [aboutPage.accreditation.feature.image, "content/pages/about.yaml → accreditation.feature.image"],
    [whyUsPage.feature.image, "content/pages/why-us.yaml → feature.image"],
    ...services.map((s): [string | undefined, string] => [
      s.image,
      `content/services/${s.slug}.md → image`,
    ]),
    ...gallery.map((g): [string | undefined, string] => [g.image, `content/gallery.yaml → "${g.id}" image`]),
    ...downloads.map((d): [string | undefined, string] => [
      d.fileKey,
      `content/downloads.yaml → "${d.id}" fileKey`,
    ]),
  ];
  for (const [key, where] of references) {
    if (key) resolveMedia(media, key, publicRoot, where);
  }
  return {
    site,
    media,
    home,
    servicesPage,
    careers,
    forms,
    aboutPage,
    whyUsPage,
    contactPage,
    galleryPage,
    downloadsPage,
    services,
    jobs,
    gallery,
    downloads,
  };
}

export function getImage(key: string): ResolvedMedia {
  return resolveMedia(loadMedia(), key);
}

export function getImageAsset(key: string): ImageAsset {
  return toImageAsset(getImage(key));
}
export type { ImageAsset };

const SOCIAL_LABELS = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
} as const;

export function socialLinks(site: Site): { label: string; href: string }[] {
  return (Object.keys(SOCIAL_LABELS) as (keyof typeof SOCIAL_LABELS)[]).flatMap((key) => {
    const href = site.links[key];
    return href ? [{ label: SOCIAL_LABELS[key], href }] : [];
  });
}
