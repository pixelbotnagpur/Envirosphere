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
import { submitForm, submitMessage } from "@/lib/forms/submit";
import { createInquirySchema, isHoneypotFilled, isTooFast, type InquiryInput } from "@/lib/validators/forms";
import type { FormsContent } from "@/lib/validators/forms-content";

export interface InquiryFormProps {
  /** Every label, hint and message of the form (content/forms.yaml). */
  copy: FormsContent;
  services?: { slug: string; title: string }[];
  defaultService?: string;
  /** Shown when sending fails (site.yaml contact). */
  phoneFallback: string;
  emailFallback: string;
  className?: string;
}

/** On-screen order of the fields and the id of each control (used by the error summary). */
const fields = [
  { key: "name", id: "inquiry-name" },
  { key: "organization", id: "inquiry-org" },
  { key: "email", id: "inquiry-email" },
  { key: "phone", id: "inquiry-phone" },
  { key: "service", id: "inquiry-service" },
  { key: "message", id: "inquiry-message" },
] as const;
const fieldKeys = fields.map((f) => f.key);

export function InquiryForm({
  copy,
  services = [],
  defaultService = "",
  phoneFallback,
  emailFallback,
  className,
}: InquiryFormProps) {
  const { common, inquiry } = copy;
  const inquirySchema = React.useMemo(() => createInquirySchema(inquiry.errors), [inquiry.errors]);
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
  const [tooFast, setTooFast] = React.useState(false);
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
    const text = field ? inquiry.fields[field.key] : undefined;
    return {
      key,
      label: text ? (text.summaryLabel ?? text.label) : common.formLabel,
      controlId: field?.id,
      message,
    };
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
    setTooFast(false);

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
      setStatusMessage(inquiry.success.received);
      return;
    }

    // 2. Anti-abuse check. A filled honeypot gets a silent fake success (bots learn nothing). A
    // fast submit (autofill) is sent nowhere: the server would refuse it, so ask the person to
    // press the button again instead of pretending it worked.
    if (isHoneypotFilled({ website: formData.website })) {
      setStatus("success");
      setStatusMessage(inquiry.success.received);
      return;
    }
    if (isTooFast(fillMs)) {
      setTooFast(true);
      return;
    }

    setFieldErrors({});
    if (isTurnstileEnabled() && !turnstileToken) {
      setStatus("error");
      setStatusMessage(common.verificationRequired);
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
      setStatusMessage(submitMessage(result, common.submit));
    } else {
      setStatus("error");
      // The server's own explanation when it gives one; otherwise the text for what went wrong.
      setStatusMessage(submitMessage(result, common.submit));
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
        <h3 className="mt-6 font-heading text-h3 text-foreground">{inquiry.success.heading}</h3>
        <p className="mt-3 text-lead font-light text-muted-foreground">{statusMessage}</p>
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="size-4" aria-hidden="true" />
            {inquiry.success.another}
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
        heading={common.errorSummaryHeading}
        fields={summaryFields}
        className="mb-6"
      />

      {/* Honeypot field for bot protection */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="inquiry-website">{common.honeypotLabel}</label>
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
            {inquiry.fields.name.label} <span className="text-destructive">*</span>
          </label>
          <Input
            id="inquiry-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder={inquiry.fields.name.placeholder}
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
            {inquiry.fields.organization.label}
          </label>
          <Input
            id="inquiry-org"
            name="organization"
            type="text"
            autoComplete="organization"
            placeholder={inquiry.fields.organization.placeholder}
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
            {inquiry.fields.email.label} <span className="text-destructive">*</span>
          </label>
          <Input
            id="inquiry-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={inquiry.fields.email.placeholder}
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
            {inquiry.fields.phone.label} <span className="text-destructive">*</span>
          </label>
          <Input
            id="inquiry-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder={inquiry.fields.phone.placeholder}
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
          {inquiry.fields.service.label} <span className="text-destructive">*</span>
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
          <option value="">{inquiry.fields.service.placeholder}</option>
          <option value="general">{inquiry.fields.service.generalOption}</option>
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
          {inquiry.fields.message.label} <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="inquiry-message"
          name="message"
          rows={4}
          required
          placeholder={inquiry.fields.message.placeholder}
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
                {inquiry.failure.direct}
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

      <p role="status" className="mt-6 text-sm text-muted-foreground">
        {tooFast ? common.tooFast : null}
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="submit"
          variant="accent"
          size="lg"
          disabled={status === "submitting"}
          className="w-full sm:w-auto shrink-0"
        >
          {status === "submitting" ? common.submitting : inquiry.submitLabel}
        </Button>
      </div>
    </form>
  );
}
