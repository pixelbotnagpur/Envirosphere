import { z } from "zod";

/** content/forms.yaml: every word the two forms show (labels, hints, messages, buttons). */

const text = z.string().min(1);
/** A text that must contain a {name} placeholder, replaced when the form is shown. */
const withPlaceholder = (name: string, example: string) =>
  z.string().includes(`{${name}}`, { error: `must contain {${name}}, e.g. "${example}"` });

const field = z.object({ label: text, placeholder: text.optional(), summaryLabel: text.optional() });

/** Texts shown after a message was sent, used only when the server sends none of its own. */
const submitMessages = z.object({
  sent: text,
  demo: text,
  unavailable: text,
  httpError: withPlaceholder("status", "Submission failed with status {status}. Please try again."),
  rejected: text,
  networkError: withPlaceholder("error", "Network error ({error}). Please check your connection."),
});

const cvMessages = z.object({ wrongType: text, tooLarge: text, emptyFile: text });

export const formsSchema = z.object({
  common: z.object({
    errorSummaryHeading: text,
    /** Name used in the error summary for a problem that belongs to no field. */
    formLabel: text,
    verificationRequired: text,
    submitting: text,
    /** Label of the hidden spam-trap field (never seen by visitors, read by nobody). */
    honeypotLabel: text,
    submit: submitMessages,
  }),
  inquiry: z.object({
    fields: z.object({
      name: field,
      organization: field,
      email: field,
      phone: field,
      service: field.extend({ generalOption: text }),
      message: field,
    }),
    errors: z.object({
      nameMin: text,
      nameMax: text,
      organizationMax: text,
      emailInvalid: text,
      emailMax: text,
      phoneInvalid: text,
      serviceRequired: text,
      messageMin: text,
      messageMax: text,
    }),
    submitLabel: text,
    success: z.object({ heading: text, received: text, another: text }),
    failure: z.object({ direct: text }),
  }),
  application: z.object({
    title: withPlaceholder("role", "Apply for {role}"),
    description: text,
    closeLabel: text,
    fields: z.object({
      name: field,
      email: field,
      phone: field,
      coverLetter: field,
      cv: z.object({
        label: text,
        summaryLabel: text.optional(),
        dropTitle: text,
        dropHint: text,
        removeLabel: text,
        sizeLabel: withPlaceholder("size", "{size} MB"),
      }),
    }),
    errors: cvMessages.extend({
      nameMin: text,
      nameMax: text,
      emailInvalid: text,
      emailMax: text,
      phoneInvalid: text,
      roleRequired: text,
      coverLetterMax: text,
      cvRequired: text,
      cvUnreadable: text,
    }),
    cancelLabel: text,
    submitLabel: text,
    success: z.object({ heading: text, logged: text, note: text, close: text }),
    failure: z.object({
      emailIntro: withPlaceholder("subject", 'Please email your CV directly with subject "{subject}":'),
      emailSubject: withPlaceholder("role", "Application: {role}"),
    }),
  }),
});

export type FormsContent = z.infer<typeof formsSchema>;
export type InquiryCopy = FormsContent["inquiry"];
export type ApplicationCopy = FormsContent["application"];
export type FormsCommonCopy = FormsContent["common"];
