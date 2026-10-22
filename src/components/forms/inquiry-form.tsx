"use client";

import { CheckCircle2, AlertCircle, Phone, Mail, RotateCcw } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitForm } from "@/lib/forms/submit";
import { inquirySchema, isBotSubmission, type InquiryInput } from "@/lib/validators/forms";

export interface InquiryFormProps {
  services?: { slug: string; title: string }[];
  defaultService?: string;
  phoneFallback?: string;
  emailFallback?: string;
  className?: string;
}

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

  const formLoadedAtRef = React.useRef<number | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = React.useState<string>("");

  React.useEffect(() => {
    formLoadedAtRef.current = Date.now();
  }, []);

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

    // 1. Zod Validation
    const parsed = inquirySchema.safeParse({
      ...formData,
      formLoadedAt: formLoadedAtRef.current ?? undefined,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field && typeof field === "string" && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    // 2. Anti-abuse check (honeypot or sub-3s submit)
    if (isBotSubmission({ website: formData.website, formLoadedAt: formLoadedAtRef.current ?? undefined })) {
      // Fake success for bots to prevent adversarial learning
      setStatus("success");
      setStatusMessage("Thank you. Your consultation request has been received.");
      return;
    }

    setFieldErrors({});
    setStatus("submitting");

    // 3. Submit
    const result = await submitForm(parsed.data);

    if (result.success) {
      setStatus("success");
      setStatusMessage(
        result.message || "Thank you. Your consultation inquiry has been securely transmitted.",
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
    formLoadedAtRef.current = Date.now();
    setFieldErrors({});
    setStatus("idle");
    setStatusMessage("");
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-card border border-border bg-surface/60 p-8 sm:p-12 text-center"
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-pill bg-primary/10 text-primary">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </div>
        <h3 className="mt-6 font-heading text-h3 text-foreground">Inquiry Received</h3>
        <p className="mt-3 text-lead font-light text-muted-foreground">{statusMessage}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          An environmental consultant from our technical appraisal team will review your project and
          respond promptly.
        </p>
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
      {/* Honeypot field for bot protection */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", border: 0 }}
      >
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
            className="mt-2"
          />
          {fieldErrors.name ? (
            <p className="mt-1.5 text-xs text-destructive">{fieldErrors.name}</p>
          ) : null}
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
            className="mt-2"
          />
          {fieldErrors.organization ? (
            <p className="mt-1.5 text-xs text-destructive">{fieldErrors.organization}</p>
          ) : null}
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
            className="mt-2"
          />
          {fieldErrors.email ? (
            <p className="mt-1.5 text-xs text-destructive">{fieldErrors.email}</p>
          ) : null}
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
            className="mt-2"
          />
          {fieldErrors.phone ? (
            <p className="mt-1.5 text-xs text-destructive">{fieldErrors.phone}</p>
          ) : null}
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
          className="mt-2"
        >
          <option value="">Select a compliance or engineering service...</option>
          <option value="general">General Environmental Advisory</option>
          {services.map((srv) => (
            <option key={srv.slug} value={srv.slug}>
              {srv.title}
            </option>
          ))}
        </Select>
        {fieldErrors.service ? (
          <p className="mt-1.5 text-xs text-destructive">{fieldErrors.service}</p>
        ) : null}
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
          placeholder="Please outline the industry sector, proposed capacity, MIDC / district location, and target approval timelines..."
          value={formData.message}
          onChange={handleChange}
          hasError={Boolean(fieldErrors.message)}
          className="mt-2"
        />
        {fieldErrors.message ? (
          <p className="mt-1.5 text-xs text-destructive">{fieldErrors.message}</p>
        ) : null}
      </div>

      {status === "error" ? (
        <div className="mt-6 rounded-card border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-normal text-destructive">{statusMessage}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                You can reach our compliance desk directly:
              </p>
              <div className="mt-3 flex flex-wrap gap-4">
                <a
                  href={`tel:${phoneFallback.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1.5 text-xs font-normal text-primary hover:underline"
                >
                  <Phone className="size-3.5" aria-hidden="true" />
                  {phoneFallback}
                </a>
                <a
                  href={`mailto:${emailFallback}`}
                  className="inline-flex items-center gap-1.5 text-xs font-normal text-primary hover:underline"
                >
                  <Mail className="size-3.5" aria-hidden="true" />
                  {emailFallback}
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Your project details are kept confidential under our professional code of conduct.
        </p>
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
