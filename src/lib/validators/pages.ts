import { z } from "zod";
import {
  ctaPanelSchema,
  featureSchema,
  iconName,
  mediaKey,
  pageHeroSchema,
  pageSeoSchema,
  sectionIntroSchema,
} from "./shared";

const text = z.string().min(1);

/** content/pages/about.yaml */
export const aboutPageSchema = z.object({
  seo: pageSeoSchema,
  hero: pageHeroSchema,
  story: z.object({
    heading: text,
    paragraphs: z.array(text).min(1),
    image: mediaKey,
  }),
  accreditation: sectionIntroSchema.extend({ feature: featureSchema }),
  offices: sectionIntroSchema.extend({ icon: iconName }),
  cta: ctaPanelSchema,
});

/** content/pages/why-us.yaml */
export const whyUsPageSchema = z.object({
  seo: pageSeoSchema,
  hero: pageHeroSchema,
  pillars: z.array(z.object({ icon: iconName, title: text, text })).min(1),
  feature: featureSchema,
  cta: ctaPanelSchema,
});

/** content/pages/contact.yaml */
export const contactPageSchema = z.object({
  seo: pageSeoSchema,
  hero: pageHeroSchema,
  enquiry: z.object({ label: text, heading: text, intro: text }),
  direct: z.object({
    heading: text,
    intro: text,
    /** One label per phone number shown, in the order of `contact.phones` in site.yaml. */
    phoneLabels: z.array(text).min(1),
    emailLabel: text,
    emailSubject: text,
  }),
  headOffice: z.object({
    /** Must match a `city` in the offices list of site.yaml. */
    city: text,
    label: text,
    heading: text,
  }),
  branches: z.object({ label: text, heading: text, itemSuffix: text }),
});

/** content/pages/gallery.yaml (the photographs themselves are in content/gallery.yaml) */
export const galleryPageSchema = z.object({
  seo: pageSeoSchema,
  hero: pageHeroSchema,
});

/** content/pages/downloads.yaml (the files themselves are in content/downloads.yaml) */
export const downloadsPageSchema = z.object({
  seo: pageSeoSchema,
  hero: pageHeroSchema,
  emptyText: text,
  downloadLabel: text,
});

export type AboutPageContent = z.infer<typeof aboutPageSchema>;
export type WhyUsPageContent = z.infer<typeof whyUsPageSchema>;
export type ContactPageContent = z.infer<typeof contactPageSchema>;
export type GalleryPageContent = z.infer<typeof galleryPageSchema>;
export type DownloadsPageContent = z.infer<typeof downloadsPageSchema>;
