"use client";

import { CheckCircle2, AlertCircle, Phone, Mail, RotateCcw } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ErrorSummary,
  FieldError,
  describedBy,
  errorId,
  type SummaryField,
} from "@/components/forms/form-parts";
import { Turnstile, isTurnstileEnabled } from "@/components/forms/turnstile";
import { collectFieldErrors, firstInvalidField } from "@/lib/forms/errors";
import { submitForm } from "@/lib/forms/submit";
import { inquirySchema, isBotSubmission, type InquiryInput } from "@/lib/validators/forms";

export interface InquiryFormProps {
  services?: { slug: string; title: string }[];
  defaultService?: string;
  phoneFallback?: string;
  emailFallback?: string;
  className?: string;
}

/** On-screen order of the fields, with the control id and visible name used by the error summary. */
const fields = [
  { key: "name", id: "inquiry-name", label: "Full Name" },
  { key: "organization", id: "inquiry-org", label: "Company / Organization" },
  { key: "email", id: "inquiry-email", label: "Official Email Address" },
  { key: "phone", id: "inquiry-phone", label: "Contact Number" },
  { key: "service", id: "inquiry-service", label: "Service of Interest" },
  { key: "message", id: "inquiry-message", label: "Project Brief & Site Location" },
] as const;
const fieldKeys = fields.map((f) => f.key);

export function InquiryForm({
  services = [],
  defaultService = "",
  phoneFallback = "+91 98602 20550",
  emailFallback = "info@envirosphere.co.in",
  className,
}: InquiryFormProps) {
  const [formData, setFormData] = React.useState<InquiryInput>({
    type: "inquiry",
    name: "",
    organization: "",
    email: "",
    phone: "",
    service: defaultService,
    message: "",
    website: "",
  });

  const openedAtRef = React.useRef<number>(0);
  const focusTargetRef = React.useRef<string | null>(null);
  const statusRef = React.useRef<HTMLDivElement>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = React.useState<string>("");
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = React.useState(0);

  React.useEffect(() => {
    openedAtRef.current = performance.now();
  }, []);

  // After a failed submit, move focus to the first invalid field once its error has rendered.
  React.useEffect(() => {
    const id = focusTargetRef.current;
    if (!id) return;
    focusTargetRef.current = null;
    document.getElementById(id)?.focus();
  }, [fieldErrors]);

  // The success message replaces the form, so move focus to it: it is a live region and the old
  // focused control no longer exists.
  React.useEffect(() => {
    if (status === "success") statusRef.current?.focus();
  }, [status]);

  const summaryFields: SummaryField[] = Object.entries(fieldErrors).map(([key, message]) => {
    const field = fields.find((f) => f.key === key);
    return { key, label: field?.label ?? "Form", controlId: field?.id, message };
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Zod Validation (fill time is elapsed ms on the visitor's own clock)
    const fillMs = Math.round(performance.now() - openedAtRef.current);
    const parsed = inquirySchema.safeParse({
      ...formData,
      fillMs,
    });

    if (!parsed.success) {
      const { errors, honeypotOnly } = collectFieldErrors(parsed.error.issues);
      if (!honeypotOnly) {
        const first = firstInvalidField(fieldKeys, errors);
        focusTargetRef.current = fields.find((f) => f.key === first)?.id ?? null;
        setFieldErrors(errors);
        return;
      }
      // Only the hidden trap field failed (a bot, or a password manager that filled it): never
      // leave a person stuck on an error they cannot see. Silent fake success.
      setStatus("success");
      setStatusMessage("Thank you. Your enquiry has been received.");
      return;
    }

    // 2. Anti-abuse check (honeypot or sub-3s submit)
    if (isBotSubmission({ website: formData.website, fillMs })) {
      // Fake success for bots to prevent adversarial learning
      setStatus("success");
      setStatusMessage("Thank you. Your enquiry has been received.");
      return;
    }

    setFieldErrors({});
    if (isTurnstileEnabled() && !turnstileToken) {
      setStatus("error");
      setStatusMessage("Please complete the verification check, then submit again.");
      return;
    }

    setStatus("submitting");

    // 3. Submit (a Turnstile token is single-use, so the widget is refreshed afterwards)
    const result = await submitForm({
      ...parsed.data,
      turnstileToken: turnstileToken ?? undefined,
    });
    setTurnstileReset((n) => n + 1);

    if (result.success) {
      setStatus("success");
      setStatusMessage(
        result.message || "Thank you. Your enquiry has been sent.",
      );
    } else {
      setStatus("error");
      setStatusMessage(
        result.message ||
          "We could not deliver your message automatically. Please connect with our team directly.",
      );
    }
  };

  const handleReset = () => {
    setFormData({
      type: "inquiry",
      name: "",
      organization: "",
      email: "",
      phone: "",
      service: defaultService,
      message: "",
      website: "",
    });
    openedAtRef.current = performance.now();
    setFieldErrors({});
    setStatus("idle");
    setStatusMessage("");
  };

  if (status === "success") {
    return (
      <div
        ref={statusRef}
        role="status"
        tabIndex={-1}
        className="rounded-card border border-border bg-surface/60 p-8 sm:p-12 text-center"
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-pill bg-primary/10 text-primary">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </div>
        <h3 className="mt-6 font-heading text-h3 text-foreground">Inquiry Received</h3>
        <p className="mt-3 text-lead font-light text-muted-foreground">{statusMessage}</p>
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="size-4" aria-hidden="true" />
            Send Another Inquiry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={className ?? "rounded-card border border-border bg-surface/40 p-6 sm:p-10"}
    >
      <ErrorSummary
        heading="Please check these fields before sending:"
        fields={summaryFields}
        className="mb-6"
      />

      {/* Honeypot field for bot protection */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="inquiry-website">Website</label>
        <input
          id="inquiry-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="inquiry-name" className="block text-sm text-foreground/90">
            Full Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="inquiry-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="e.g. Dr. Rajesh Sharma"
            value={formData.name}
            onChange={handleChange}
            hasError={Boolean(fieldErrors.name)}
            aria-describedby={describedBy(fieldErrors.name && errorId("inquiry-name"))}
            className="mt-2"
          />
          <FieldError controlId="inquiry-name" message={fieldErrors.name} className="mt-1.5" />
        </div>

        <div>
          <label htmlFor="inquiry-org" className="block text-sm text-foreground/90">
            Company / Organization
          </label>
          <Input
            id="inquiry-org"
            name="organization"
            type="text"
            autoComplete="organization"
            placeholder="e.g. Bharat Chemical Works"
            value={formData.organization || ""}
            onChange={handleChange}
            hasError={Boolean(fieldErrors.organization)}
            aria-describedby={describedBy(fieldErrors.organization && errorId("inquiry-org"))}
            className="mt-2"
          />
          <FieldError
            controlId="inquiry-org"
            message={fieldErrors.organization}
            className="mt-1.5"
          />
        </div>

        <div>
          <label htmlFor="inquiry-email" className="block text-sm text-foreground/90">
            Official Email Address <span className="text-destructive">*</span>
          </label>
          <Input
            id="inquiry-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="rajesh@company.com"
            value={formData.email}
            onChange={handleChange}
            hasError={Boolean(fieldErrors.email)}
            aria-describedby={describedBy(fieldErrors.email && errorId("inquiry-email"))}
            className="mt-2"
          />
          <FieldError controlId="inquiry-email" message={fieldErrors.email} className="mt-1.5" />
        </div>

        <div>
          <label htmlFor="inquiry-phone" className="block text-sm text-foreground/90">
            Contact Number <span className="text-destructive">*</span>
          </label>
          <Input
            id="inquiry-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+91 98602 20550"
            value={formData.phone}
            onChange={handleChange}
            hasError={Boolean(fieldErrors.phone)}
            aria-describedby={describedBy(fieldErrors.phone && errorId("inquiry-phone"))}
            className="mt-2"
          />
          <FieldError controlId="inquiry-phone" message={fieldErrors.phone} className="mt-1.5" />
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="inquiry-service" className="block text-sm text-foreground/90">
          Service of Interest / Required Scope <span className="text-destructive">*</span>
        </label>
        <Select
          id="inquiry-service"
          name="service"
          value={formData.service}
          onChange={handleChange}
          hasError={Boolean(fieldErrors.service)}
          aria-describedby={describedBy(fieldErrors.service && errorId("inquiry-service"))}
          className="mt-2"
        >
          <option value="">Select a service...</option>
          <option value="general">General Environmental Advisory</option>
          {services.map((srv) => (
            <option key={srv.slug} value={srv.slug}>
              {srv.title}
            </option>
          ))}
        </Select>
        <FieldError controlId="inquiry-service" message={fieldErrors.service} className="mt-1.5" />
      </div>

      <div className="mt-6">
        <label htmlFor="inquiry-message" className="block text-sm text-foreground/90">
          Project Brief & Site Location <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="inquiry-message"
          name="message"
          rows={4}
          required
          placeholder="Please describe your project..."
          value={formData.message}
          onChange={handleChange}
          hasError={Boolean(fieldErrors.message)}
          aria-describedby={describedBy(fieldErrors.message && errorId("inquiry-message"))}
          className="mt-2"
        />
        <FieldError controlId="inquiry-message" message={fieldErrors.message} className="mt-1.5" />
      </div>

      <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} className="mt-6" />

      {status === "error" ? (
        <div
          role="alert"
          className="mt-6 rounded-card border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-normal text-destructive">{statusMessage}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You can reach us directly:
              </p>
              <div className="mt-3 flex flex-wrap gap-4">
                <a
                  href={`tel:${phoneFallback.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1.5 text-sm font-normal text-primary hover:underline"
                >
                  <Phone className="size-3.5" aria-hidden="true" />
                  {phoneFallback}
                </a>
                <a
                  href={`mailto:${emailFallback}`}
                  className="inline-flex items-center gap-1.5 text-sm font-normal text-primary hover:underline"
                >
                  <Mail className="size-3.5" aria-hidden="true" />
                  {emailFallback}
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="submit"
          variant="accent"
          size="lg"
          disabled={status === "submitting"}
          className="w-full sm:w-auto shrink-0"
        >
          {status === "submitting" ? "Transmitting..." : "Submit Inquiry"}
        </Button>
      </div>
    </form>
  );
}
