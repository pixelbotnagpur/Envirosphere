import type { ZodIssue } from "zod";

/** The hidden bot trap. It is never shown to a visitor, even when a password manager fills it. */
const honeypotField = "website";

export interface FieldErrors {
  /** First message for each visible field, keyed by the top-level field name. */
  errors: Record<string, string>;
  /** True when the honeypot was the only thing wrong, so the submission is a silent fake success. */
  honeypotOnly: boolean;
}

export function collectFieldErrors(issues: readonly ZodIssue[]): FieldErrors {
  const errors: Record<string, string> = {};
  let sawHoneypot = false;
  for (const issue of issues) {
    const field = typeof issue.path[0] === "string" ? issue.path[0] : "form";
    if (field === honeypotField) {
      sawHoneypot = true;
      continue;
    }
    if (!errors[field]) errors[field] = issue.message;
  }
  return { errors, honeypotOnly: sawHoneypot && Object.keys(errors).length === 0 };
}
