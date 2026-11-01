import { readFileSync } from "node:fs";
import { parse } from "yaml";

/** Reads a YAML file under content/ so e2e assertions take their expected text from the owner files. */
export function readContent<T = Record<string, unknown>>(file: string): T {
  return parse(readFileSync(`content/${file}`, "utf8")) as T;
}

/** The `title:` of a service markdown file (content/services/<slug>.md). */
export function serviceTitle(slug: string): string {
  const text = readFileSync(`content/services/${slug}.md`, "utf8");
  const match = /^title:\s*(.+)$/m.exec(text);
  if (!match) throw new Error(`content/services/${slug}.md has no title`);
  return match[1].trim().replace(/^["']|["']$/g, "");
}

interface Hero {
  eyebrow: string;
  title: string;
  lead?: string;
}
interface Cta {
  label: string;
  href: string;
}

export interface PageContent {
  hero: Hero;
}
export interface AboutContent extends PageContent {
  accreditation: { heading: string };
}
export interface WhyUsContent extends PageContent {
  pillars: { title: string }[];
}
export interface ContactContent extends PageContent {
  headOffice: { label: string };
}
export interface GalleryContent extends PageContent {
  seo: { title: string };
}
export interface DownloadsContent extends PageContent {
  emptyText: string;
  downloadLabel: string;
}
export interface CareersContent extends PageContent {
  openings: { heading: string; generalApplyLabel: string };
}
export interface ServicesContent {
  hub: PageContent;
  serviceDetail: { contact: { primaryCta: Cta }; nextLabel: string };
}
export interface HomeContent {
  stats: { items: { label: string }[] };
}
