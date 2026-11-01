import { z } from "zod";

export const phoneRegex = /^(?=(?:\D*\d){8})\+?[0-9 ()-]{8,20}$/;

export const inquirySchema = z.object({
  type: z.literal("inquiry").default("inquiry"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  organization: z.string().trim().max(100, "Organization name cannot exceed 100 characters").optional().default(""),
  email: z.string().trim().email("Please enter a valid email address").max(120, "Email cannot exceed 120 characters"),
  phone: z.string().trim().regex(phoneRegex, "Please enter a valid phone number (e.g. +91 98602 20550)"),
  service: z.string().trim().min(1, "Please select a service or general inquiry"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message cannot exceed 2000 characters"),
  website: z.string().max(0, "Bot detected").optional().default(""),
  /** Milliseconds the visitor had the form open, measured in the browser with performance.now(). */
  fillMs: z.number().int().min(0).optional(),
  turnstileToken: z.string().optional(),
});

export type InquiryInput = z.input<typeof inquirySchema>;
export type InquiryData = z.infer<typeof inquirySchema>;

export const allowedCvMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const cvFileSchema = z.object({
  name: z
    .string()
    .trim()
    .max(255)
    .regex(/\.(pdf|docx)$/i, "CV file must be a PDF or DOCX document"),
  type: z.enum(allowedCvMimeTypes, {
    error: "File must be a PDF or Word document (.pdf, .docx)",
  }),
  size: z.number().int().positive().max(5 * 1024 * 1024, "CV file size must not exceed 5 MB"),
  data: z.string().min(1, "CV file data cannot be empty"),
});

export type CvFileInput = z.input<typeof cvFileSchema>;
export type CvFileData = z.infer<typeof cvFileSchema>;

export const applicationSchema = z.object({
  type: z.literal("application").default("application"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").max(120, "Email cannot exceed 120 characters"),
  phone: z.string().trim().regex(phoneRegex, "Please enter a valid phone number"),
  role: z.string().trim().min(2, "Please specify the position applied for"),
  coverLetter: z.string().trim().max(2000, "Cover note cannot exceed 2000 characters").optional().default(""),
  cvFile: cvFileSchema,
  website: z.string().max(0, "Bot detected").optional().default(""),
  /** Milliseconds the visitor had the form open, measured in the browser with performance.now(). */
  fillMs: z.number().int().min(0).optional(),
  turnstileToken: z.string().optional(),
});

export type ApplicationInput = z.input<typeof applicationSchema>;
export type ApplicationData = z.infer<typeof applicationSchema>;

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
