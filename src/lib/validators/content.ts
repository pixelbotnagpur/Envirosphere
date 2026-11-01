import { z } from "zod";

const mediaKey = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*$/, "use lowercase letters, numbers and dashes, e.g. hero-home");
const href = z
  .string()
  .regex(/^(\/|https?:\/\/|mailto:|tel:)/, "must start with / or https://");
const phone = z
  .string()
  .regex(/^(?=(?:\D*\d){8})\+?[0-9 ()-]{8,20}$/, "must look like +91 98602 20550");

const navItemSchema = z.object({ label: z.string().min(1), href });

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

export const homeSchema = z.object({
  hero: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    primaryCta: navItemSchema,
    secondaryCta: navItemSchema.optional(),
    scrollLabel: z.string().min(1),
    image: mediaKey.optional(),
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
  contact: z.object({
    label: sectionLabel,
    heading: z.string().min(1),
    body: z.string().min(1),
    primaryCta: navItemSchema,
    phoneLabel: z.string().min(1),
    emailLabel: z.string().min(1),
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
export type ServiceFrontMatter = z.infer<typeof serviceFrontMatterSchema>;
export type Job = z.infer<typeof jobSchema>;
export type DownloadItem = z.infer<typeof downloadItemSchema>;
export type GalleryItem = z.infer<typeof galleryItemSchema>;
