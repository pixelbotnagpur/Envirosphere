import { loadForms, loadSite } from "@/lib/content";

/** The real form texts and contact details, so tests expect what the owner files say. */
export const forms = loadForms();
export const siteContact = loadSite().contact;

/** A matcher for a text from the forms file (special characters escaped), for getByLabelText and friends. */
export const rx = (text: string) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

/** The name a field has in the "please check these fields" list. */
export const summaryLabel = (field: { label: string; summaryLabel?: string }) => field.summaryLabel ?? field.label;
