import { z } from "zod";
import {
  ctaPanelSchema,
  mediaKey,
  navItemSchema,
  pageHeroSchema,
  pageSeoSchema,
} from "./shared";

export * from "./pages";
export * from "./forms-content";
export { ctaPanelSchema, iconName, pageHeroSchema, pageSeoSchema } from "./shared";

const phone = z
  .string()
  .regex(/^(?=(?:\D*\d){8})\+?[0-9 ()-]{8,20}$/, "must look like +91 98602 20550");

export const mediaItemSchema = z.object({
  src: z
    .string()
    .regex(/^\/media\/.+\.[a-z0-9]+$/i, "must start with /media/ and end with a file extension"),
  // Empty alt is allowed only for purely decorative images.
  alt: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export const mediaSchema = z.record(mediaKey, mediaItemSchema);

export const siteSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  tagline: z.string().min(1),
  url: z.url(),
  locale: z.string().default("en-IN"),
  logoKey: mediaKey,
  cta: navItemSchema,
  contact: z.object({
    email: z.email(),
    phones: z.array(phone).min(1),
    whatsapp: phone.optional(),
    /** Optional address for job applications; when absent the main email is used. */
    careersEmail: z.email().optional(),
    address: z.string().min(1),
  }),
  offices: z
    .array(
      z.object({ name: z.string().min(1), city: z.string().min(1), address: z.string().optional() }),
    )
    .min(1),
  accreditations: z.array(z.object({ label: z.string().min(1), detail: z.string().optional() })),
  nav: z.array(navItemSchema).min(1),
  links: z
    .object({
      linkedin: z.url().optional(),
      facebook: z.url().optional(),
      instagram: z.url().optional(),
      youtube: z.url().optional(),
    })
    .default({}),
  seo: z.object({
    titleTemplate: z.string().refine((v) => v.includes("%s"), 'must contain "%s" for the page title'),
    description: z.string().min(1),
    ogImageKey: mediaKey,
  }),
  ui: z.object({
    skipToContent: z.string().min(1),
    openMenu: z.string().min(1),
    closeMenu: z.string().min(1),
    mainNav: z.string().min(1),
    mobileNav: z.string().min(1),
    footerContact: z.string().min(1),
    footerExplore: z.string().min(1),
    notFound: z.object({
      label: z.string().min(1),
      heading: z.string().min(1),
      cta: z.string().min(1),
    }),
  }),
});

const sectionLabel = z.string().min(1);

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use the file name of a service without .md, e.g. crz-clearance");

/** One of the cards under "What we offer". Title and summary come from the service file unless set here. */
export const featuredServiceSchema = z.object({
  service: slug,
  tag: z.string().min(1),
  image: mediaKey,
  title: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
});

const homeBaseSchema = z.object({
  seo: pageSeoSchema,
  hero: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    primaryCta: navItemSchema,
    secondaryCta: navItemSchema.optional(),
    scrollLabel: z.string().min(1),
    /** Background photo (a name from media.yaml). Without it the hero is a plain Forest band. */
    image: mediaKey.optional(),
    /** Labels of stats (stats.items) shown as short facts under the buttons. */
    highlights: z.array(z.string().min(1)).default([]),
    /** Short words shown at the bottom right of the hero, separated by dots. */
    keywords: z.array(z.string().min(1)).default([]),
  }),
  about: z.object({
    label: sectionLabel,
    heading: z.string().min(1),
    paragraphs: z.array(z.string().min(1)).min(1),
    image: mediaKey,
    cta: navItemSchema,
  }),
  services: z.object({
    label: sectionLabel,
    heading: z.string().min(1),
    intro: z.string().min(1),
    cta: navItemSchema,
    viewLabel: z.string().min(1),
    featured: z.array(featuredServiceSchema).default([]),
  }),
  stats: z.object({
    label: sectionLabel,
    items: z
      .array(
        z.object({
          value: z.number().int().nonnegative(),
          suffix: z.string().default(""),
          label: z.string().min(1),
        }),
      )
      .min(2),
  }),
  clients: z.object({
    label: sectionLabel,
    heading: z.string().min(1),
    logos: z.array(mediaKey).min(6),
  }),
  process: z.object({
    label: sectionLabel,
    heading: z.string().min(1),
    steps: z.array(z.object({ title: z.string().min(1), body: z.string().min(1) })).min(2),
  }),
  testimonials: z.object({
    label: sectionLabel,
    heading: z.string().min(1),
    items: z
      .array(z.object({ quote: z.string().min(1), name: z.string().min(1), role: z.string().optional() }))
      .min(1),
  }),
  fieldArchive: z.object({
    label: sectionLabel,
    heading: z.string().min(1),
    body: z.string().min(1),
    /** Outline button at the right of the heading. */
    topCta: navItemSchema,
    /** Outline button below the photographs. */
    bottomCta: navItemSchema,
    items: z
      .array(z.object({ image: mediaKey, tag: z.string().min(1), caption: z.string().min(1) }))
      .min(1),
  }),
  visualBreak: z.object({
    image: mediaKey,
    /** Small pill at the top left of the photo. */
    tag: z.string().min(1).optional(),
    /** Larger line at the bottom left of the photo. */
    quote: z.string().min(1).optional(),
    /** Show the office cities (from site.yaml) at the bottom right of the photo. */
    showOffices: z.boolean().default(true),
  }),
  contact: z.object({
    label: sectionLabel,
    heading: z.string().min(1),
    body: z.string().min(1),
    primaryCta: navItemSchema,
    phoneLabel: z.string().min(1),
    emailLabel: z.string().min(1),
  }),
});

export const homeSchema = homeBaseSchema.superRefine((home, ctx) => {
  const labels = home.stats.items.map((item) => item.label);
  home.hero.highlights.forEach((label, index) => {
    if (!labels.includes(label)) {
      ctx.addIssue({
        code: "custom",
        path: ["hero", "highlights", index],
        message: `"${label}" is not one of the stats below (${labels.join(", ")}); write a stats label exactly`,
      });
    }
  });
});

/** content/pages/services.yaml: the Services page (hub) and the labels used on every service page. */
export const servicesPageSchema = z.object({
  hub: z.object({
    seo: pageSeoSchema,
    hero: pageHeroSchema,
    listLabel: z.string().min(1),
    viewLabel: z.string().min(1),
    cta: ctaPanelSchema,
  }),
  serviceDetail: z.object({
    breadcrumbHome: z.string().min(1),
    breadcrumbServices: z.string().min(1),
    breadcrumbLabel: z.string().min(1),
    notFoundTitle: z.string().min(1),
    label: z.string().min(1),
    previousLabel: z.string().min(1),
    nextLabel: z.string().min(1),
    contact: z.object({
      label: z.string().min(1),
      heading: z.string().min(1),
      body: z.string().min(1),
      primaryCta: navItemSchema,
      phoneLabel: z.string().min(1),
      emailLabel: z.string().min(1),
    }),
  }),
});

export const serviceFrontMatterSchema = z.object({
  title: z.string().min(1),
  order: z.number().int().positive(),
  summary: z.string().min(1),
  image: mediaKey.optional(),
});

export const jobSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  department: z.string().min(1),
  location: z.string().min(1),
  type: z.string().default("Full-time"),
  experience: z.string().min(1),
  description: z.string().min(1),
  requirements: z.array(z.string().min(1)),
});
export const jobsSchema = z.array(jobSchema);

/** content/pages/careers.yaml (the openings themselves are in content/jobs.yaml) */
export const careersSchema = z.object({
  seo: pageSeoSchema,
  hero: pageHeroSchema,
  openings: z.object({
    label: z.string().min(1),
    heading: z.string().min(1),
    countOne: z.string().includes("{count}", { error: 'must contain {count}, e.g. "Showing {count} open position"' }),
    countMany: z.string().includes("{count}", { error: 'must contain {count}, e.g. "Showing {count} open positions"' }),
    noneHeading: z.string().min(1),
    noneBody: z.string().min(1),
    generalApplyLabel: z.string().min(1),
    generalRoleLabel: z.string().min(1),
    emailLabel: z.string().min(1),
    /** Heading above the list of requirements of an opening. */
    requirementsLabel: z.string().min(1),
    applyWithCvLabel: z.string().min(1),
    applyByEmailLabel: z.string().min(1),
    /** Subject of the "apply by email" link; {title} becomes the job title. */
    emailSubject: z
      .string()
      .includes("{title}", { error: 'must contain {title}, e.g. "Application for {title} - [Your Name]"' }),
  }),
});

export const downloadItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  fileKey: mediaKey,
  format: z.string().default("PDF"),
  size: z.string().optional(),
  description: z.string().min(1),
});
export const downloadsSchema = z.array(downloadItemSchema);

export const galleryItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  image: mediaKey,
  caption: z.string().optional(),
});
export const gallerySchema = z.array(galleryItemSchema);

export type Site = z.infer<typeof siteSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type MediaItem = z.infer<typeof mediaItemSchema>;
export type Home = z.infer<typeof homeSchema>;
export type ServicesPage = z.infer<typeof servicesPageSchema>;
export type ServiceFrontMatter = z.infer<typeof serviceFrontMatterSchema>;
export type Careers = z.infer<typeof careersSchema>;
export type Job = z.infer<typeof jobSchema>;
export type DownloadItem = z.infer<typeof downloadItemSchema>;
export type GalleryItem = z.infer<typeof galleryItemSchema>;
