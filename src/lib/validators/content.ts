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

export const homeSchema = z.object({
  hero: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    primaryCta: navItemSchema,
    image: mediaKey.optional(),
  }),
});

export const serviceFrontMatterSchema = z.object({
  title: z.string().min(1),
  order: z.number().int().positive(),
  summary: z.string().min(1),
  image: mediaKey.optional(),
});

export type Site = z.infer<typeof siteSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type MediaItem = z.infer<typeof mediaItemSchema>;
export type Home = z.infer<typeof homeSchema>;
export type ServiceFrontMatter = z.infer<typeof serviceFrontMatterSchema>;
