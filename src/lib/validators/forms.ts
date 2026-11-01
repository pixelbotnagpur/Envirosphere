import { z } from "zod";

export const phoneRegex = /^(?=(?:\D*\d){8})\+?[0-9 ()-]{8,20}$/;

/**
 * Validation rules for the two forms. The messages a visitor reads are NOT written here: they live
 * in content/forms.yaml and are handed to these factories, so every user-facing word is editable
 * by the site owner (rule 33). These schemas run in the browser only; the Apps Script has its own
 * checks. The honeypot field has no message because it is never shown.
 */

/** Messages for the CV file checks, shared by both the file chooser and the schema. */
export interface CvMessages {
  wrongType: string;
  tooLarge: string;
  emptyFile: string;
}

export interface InquiryMessages {
  nameMin: string;
  nameMax: string;
  organizationMax: string;
  emailInvalid: string;
  emailMax: string;
  phoneInvalid: string;
  serviceRequired: string;
  messageMin: string;
  messageMax: string;
}

export interface ApplicationMessages extends CvMessages {
  nameMin: string;
  nameMax: string;
  emailInvalid: string;
  emailMax: string;
  phoneInvalid: string;
  roleRequired: string;
  coverLetterMax: string;
}

export function createInquirySchema(m: InquiryMessages) {
  return z.object({
    type: z.literal("inquiry").default("inquiry"),
    name: z.string().trim().min(2, m.nameMin).max(100, m.nameMax),
    organization: z.string().trim().max(100, m.organizationMax).optional().default(""),
    email: z.string().trim().email(m.emailInvalid).max(120, m.emailMax),
    phone: z.string().trim().regex(phoneRegex, m.phoneInvalid),
    service: z.string().trim().min(1, m.serviceRequired),
    message: z.string().trim().min(10, m.messageMin).max(2000, m.messageMax),
    website: z.string().max(0).optional().default(""),
    /** Milliseconds the visitor had the form open, measured in the browser with performance.now(). */
    fillMs: z.number().int().min(0).optional(),
    turnstileToken: z.string().optional(),
  });
}

export type InquiryInput = z.input<ReturnType<typeof createInquirySchema>>;
export type InquiryData = z.infer<ReturnType<typeof createInquirySchema>>;

export const allowedCvMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export function createCvFileSchema(m: CvMessages) {
  return z.object({
    name: z.string().trim().max(255).regex(/\.(pdf|docx)$/i, m.wrongType),
    type: z.enum(allowedCvMimeTypes, { error: m.wrongType }),
    size: z.number().int().positive().max(5 * 1024 * 1024, m.tooLarge),
    data: z.string().min(1, m.emptyFile),
  });
}

export type CvFileInput = z.input<ReturnType<typeof createCvFileSchema>>;
export type CvFileData = z.infer<ReturnType<typeof createCvFileSchema>>;

export function createApplicationSchema(m: ApplicationMessages) {
  return z.object({
    type: z.literal("application").default("application"),
    name: z.string().trim().min(2, m.nameMin).max(100, m.nameMax),
    email: z.string().trim().email(m.emailInvalid).max(120, m.emailMax),
    phone: z.string().trim().regex(phoneRegex, m.phoneInvalid),
    role: z.string().trim().min(2, m.roleRequired),
    coverLetter: z.string().trim().max(2000, m.coverLetterMax).optional().default(""),
    cvFile: createCvFileSchema(m),
    website: z.string().max(0).optional().default(""),
    /** Milliseconds the visitor had the form open, measured in the browser with performance.now(). */
    fillMs: z.number().int().min(0).optional(),
    turnstileToken: z.string().optional(),
  });
}

export type ApplicationInput = z.input<ReturnType<typeof createApplicationSchema>>;
export type ApplicationData = z.infer<ReturnType<typeof createApplicationSchema>>;

/**
 * Anti-abuse gate: checks honeypot field and minimum fill time (default: 3000ms).
 * `fillMs` is elapsed time measured on the visitor's own clock, so it is immune to clock skew.
 */
export function isBotSubmission(
  data: { website?: string; fillMs?: number },
  minFillTimeMs = process.env.NODE_ENV === "test" ? 0 : 3000,
): boolean {
  if (data.website && data.website.trim().length > 0) {
    return true;
  }
  if (typeof data.fillMs === "number" && data.fillMs < minFillTimeMs) {
    return true;
  }
  return false;
}
