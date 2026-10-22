import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  homeSchema,
  mediaSchema,
  serviceFrontMatterSchema,
  siteSchema,
  type Home,
  type Media,
  type ServiceFrontMatter,
  type Site,
} from "../validators/content";
import { resolveMedia, verifyAllMedia, type ResolvedMedia } from "./media";
import { CONTENT_ROOT, ContentError, PUBLIC_ROOT, readMarkdownFile, readYamlFile } from "./read";

export type Service = ServiceFrontMatter & { slug: string; body: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const loadSite = (root = CONTENT_ROOT): Site => readYamlFile("site.yaml", siteSchema, root);
export const loadMedia = (root = CONTENT_ROOT): Media => readYamlFile("media.yaml", mediaSchema, root);
export const loadHome = (root = CONTENT_ROOT): Home =>
  readYamlFile("pages/home.yaml", homeSchema, root);

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

/** Loads everything and checks every media reference. Used by `pnpm content:check` and the build. */
export function loadAll(root = CONTENT_ROOT, publicRoot = PUBLIC_ROOT) {
  const site = loadSite(root);
  const media = loadMedia(root);
  const home = loadHome(root);
  const services = loadServices(root);

  verifyAllMedia(media, publicRoot);
  const references: [string | undefined, string][] = [
    [site.logoKey, "content/site.yaml → logoKey"],
    [site.seo.ogImageKey, "content/site.yaml → seo.ogImageKey"],
    [home.hero.image, "content/pages/home.yaml → hero.image"],
    ...services.map((s): [string | undefined, string] => [
      s.image,
      `content/services/${s.slug}.md → image`,
    ]),
  ];
  for (const [key, where] of references) {
    if (key) resolveMedia(media, key, publicRoot, where);
  }
  return { site, media, home, services };
}

export function getImage(key: string): ResolvedMedia {
  return resolveMedia(loadMedia(), key);
}

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
