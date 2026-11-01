import { z } from "zod";
import { ICON_NAMES } from "../icon-names";

export const mediaKey = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*$/, "use lowercase letters, numbers and dashes, e.g. hero-home");
export const href = z.string().regex(/^(\/|https?:\/\/|mailto:|tel:)/, "must start with / or https://");
export const navItemSchema = z.object({ label: z.string().min(1), href });

/** An icon from the allowed list in src/lib/icon-names.ts. */
export const iconName = z.enum(ICON_NAMES, {
  error: `unknown icon; use one of: ${ICON_NAMES.join(", ")}`,
});

const text = z.string().min(1);

/** Page title and description for search results and link previews. */
export const pageSeoSchema = z.object({ title: text, description: text });

/** The Forest banner at the top of every inner page. `lead` is the short line to its right. */
export const pageHeroSchema = z.object({
  eyebrow: text,
  title: text,
  lead: text.optional(),
});

/** An image with the text shown beside it. */
export const featureSchema = z.object({
  image: mediaKey,
  eyebrow: text,
  title: text,
  text,
});

/** The closing call-to-action panel. */
export const ctaPanelSchema = z.object({
  label: text,
  heading: text,
  lead: text.optional(),
  primaryCta: navItemSchema,
  secondaryCta: navItemSchema.optional(),
});

/** A section with a small label, a heading and an optional intro line. */
export const sectionIntroSchema = z.object({ label: text, heading: text, lead: text.optional() });
