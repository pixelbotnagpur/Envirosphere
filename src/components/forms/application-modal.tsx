"use client";

import { CheckCircle2, AlertCircle, UploadCloud, X, FileText } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ErrorSummary,
  FieldError,
  describedBy,
  errorId,
  type SummaryField,
} from "@/components/forms/form-parts";
import { Turnstile, isTurnstileEnabled } from "@/components/forms/turnstile";
import { cn } from "@/lib/utils";
import { validateCvFile } from "@/lib/forms/cv";
import { collectFieldErrors, firstInvalidField } from "@/lib/forms/errors";
import { submitForm, submitMessage } from "@/lib/forms/submit";
import { fillText } from "@/lib/forms/text";
import {
  createApplicationSchema,
  isBotSubmission,
  type ApplicationInput,
  type CvFileInput,
} from "@/lib/validators/forms";
import type { FormsContent } from "@/lib/validators/forms-content";

export interface ApplicationModalProps {
  /** Every label, hint and message of the window (content/forms.yaml). */
  copy: FormsContent;
  role: string;
  isOpen: boolean;
  onClose: () => void;
  /** Where to send a CV when the form fails (site.yaml contact). Omitted: no email is suggested. */
  emailFallback?: string;
  /** Called while focus is being returned after close; call preventDefault() to move it elsewhere. */
  onCloseAutoFocus?: (event: Event) => void;
}

/** On-screen order of the fields and the id of each control (used by the error summary). */
const fields = [
  { key: "name", id: "app-name", copyKey: "name" },
  { key: "email", id: "app-email", copyKey: "email" },
  { key: "phone", id: "app-phone", copyKey: "phone" },
  { key: "coverLetter", id: "app-cover", copyKey: "coverLetter" },
  { key: "cvFile", id: "app-cv", copyKey: "cv" },
] as const;
const fieldKeys = fields.map((f) => f.key);

export function ApplicationModal({
  copy,
  role,
  isOpen,
  onClose,
  emailFallback,
  onCloseAutoFocus,
}: ApplicationModalProps) {
  const { common, application } = copy;
  const applicationSchema = React.useMemo(
    () => createApplicationSchema(application.errors),
    [application.errors],
  );
  const nameRef = React.useRef<HTMLInputElement>(null);
  // Radix only restores focus to a <Dialog.Trigger>; this dialog is opened from the outside, so
  // remember the element that had focus when it opened and return to it on close.
  const returnFocusRef = React.useRef<HTMLElement | null>(null);
  const [formData, setFormData] = React.useState<Omit<ApplicationInput, "cvFile">>({
    type: "application",
    name: "",
    email: "",
    phone: "",
    role,
    coverLetter: "",
    website: "",
  });

  const [cvFile, setCvFile] = React.useState<CvFileInput | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const openedAtRef = React.useRef<number>(0);
  const focusTargetRef = React.useRef<string | null>(null);
  const cvFocusRef = React.useRef<"input" | "remove" | null>(null);
  const statusRef = React.useRef<HTMLDivElement>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = React.useState<string>("");
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = React.useState(0);

  React.useEffect(() => {
    if (isOpen) openedAtRef.current = performance.now();
  }, [isOpen]);

  // After a failed submit, move focus to the first invalid field once its error has rendered.
  React.useEffect(() => {
    const id = focusTargetRef.current;
    if (!id) return;
    focusTargetRef.current = null;
    document.getElementById(id)?.focus();
  }, [fieldErrors]);

  // Choosing a file swaps the chooser for the file chip (and removing it swaps back), so the
  // focused control disappears: hand focus to the control that replaced it.
  React.useEffect(() => {
    const target = cvFocusRef.current;
    if (!target) return;
    cvFocusRef.current = null;
    document.getElementById(target === "remove" ? "app-cv-remove" : "app-cv")?.focus();
  }, [cvFile]);

  // The success message replaces the form, so move focus to it: it is a live region and the old
  // focused control no longer exists.
  React.useEffect(() => {
    if (status === "success") statusRef.current?.focus();
  }, [status]);

  const emailSubject = fillText(application.failure.emailSubject, { role });
  const cvError = fileError ?? fieldErrors.cvFile ?? null;
  const summaryFields: SummaryField[] = Object.entries(fieldErrors).map(([key, message]) => {
    const field = fields.find((f) => f.key === key);
    const text = field ? application.fields[field.copyKey] : undefined;
    return {
      key,
      label: text ? (text.summaryLabel ?? text.label) : common.formLabel,
      controlId: field?.id,
      message,
    };
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const acceptFile = (file: File) => {
    setFileError(null);
    setFieldErrors((prev) => {
      if (!prev.cvFile) return prev;
      const next = { ...prev };
      delete next.cvFile;
      return next;
    });

    // Checked once, here, by extension and size. file.type is not trusted: browsers report an
    // empty or odd type for ordinary documents.
    const check = validateCvFile(file);
    if (!check.ok) {
      setFileError(application.errors[check.reason]);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(",")[1] || "";
      cvFocusRef.current = "remove";
      setCvFile({ name: file.name, type: check.mimeType, size: file.size, data: base64Data });
    };
    reader.onerror = () => {
      setFileError(application.errors.cvUnreadable);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so choosing the same file again after an error still fires a change event.
    e.target.value = "";
    if (file) acceptFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  };

  const handleRemoveFile = () => {
    cvFocusRef.current = "input";
    setCvFile(null);
    setFileError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fillMs = Math.round(performance.now() - openedAtRef.current);
    const payload = { ...formData, cvFile: cvFile ?? undefined, fillMs };

    // Validate everything at once so every problem is reported together, CV included.
    const parsed = applicationSchema.safeParse(payload);
    const issues = parsed.success ? [] : parsed.error.issues;
    const { errors } = collectFieldErrors(issues);
    if (!cvFile) {
      errors.cvFile = application.errors.cvRequired;
    }
    if (Object.keys(errors).length > 0) {
      const first = firstInvalidField(fieldKeys, errors);
      focusTargetRef.current = fields.find((f) => f.key === first)?.id ?? null;
      setFieldErrors(errors);
      return;
    }
    if (!parsed.success) {
      // Every other field passed, so only the hidden trap field failed (a bot, or a password manager that filled it): never
      // leave a person stuck on an error they cannot see. Silent fake success.
      setStatus("success");
      setStatusMessage(application.success.logged);
      return;
    }

    if (isBotSubmission({ website: formData.website, fillMs })) {
      setStatus("success");
      setStatusMessage(application.success.logged);
      return;
    }

    setFieldErrors({});
    if (isTurnstileEnabled() && !turnstileToken) {
      setStatus("error");
      setStatusMessage(common.verificationRequired);
      return;
    }

    setStatus("submitting");

    const result = await submitForm({
      ...parsed.data,
      turnstileToken: turnstileToken ?? undefined,
    });
    setTurnstileReset((n) => n + 1);

    setStatus(result.success ? "success" : "error");
    // The server's own text when it gives one; otherwise the text for what happened.
    setStatusMessage(submitMessage(result, common.submit));
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => (open ? undefined : onClose())}>
      <Dialog.Portal>
        {/* The overlay is the scroll container: Lenis ignores wheel events inside data-lenis-prevent. */}
        <Dialog.Overlay
          data-modal-overlay=""
          data-lenis-prevent=""
          className="modal-fade fixed inset-0 z-(--z-modal) flex items-start justify-center overflow-y-auto overscroll-contain bg-foreground/50 p-4 backdrop-blur-sm sm:p-6"
        >
          <Dialog.Content
            onOpenAutoFocus={(event) => {
              if (document.activeElement instanceof HTMLElement) {
                returnFocusRef.current = document.activeElement;
              }
              if (nameRef.current) {
                event.preventDefault();
                nameRef.current.focus();
              }
            }}
            onCloseAutoFocus={(event) => {
              onCloseAutoFocus?.(event);
              if (event.defaultPrevented) return;
              event.preventDefault();
              returnFocusRef.current?.focus();
            }}
            className="modal-pop relative my-auto w-full max-w-xl rounded-card border border-border bg-background p-6 shadow-card sm:p-8"
          >
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={application.closeLabel}
                className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-pill"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </Dialog.Close>

            {status === "success" ? (
              <div ref={statusRef} role="status" tabIndex={-1} className="py-6 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-pill bg-primary/10 text-primary">
                  <CheckCircle2 className="size-8" aria-hidden="true" />
                </div>
                <Dialog.Title className="mt-6 font-heading text-h3 text-foreground">
                  {application.success.heading}
                </Dialog.Title>
                <p className="mt-3 text-lead font-light text-muted-foreground">{statusMessage}</p>
                <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                  {application.success.note}
                </Dialog.Description>
                <div className="mt-8 flex justify-center gap-4">
                  <Dialog.Close asChild>
                    <Button variant="outline">{application.success.close}</Button>
                  </Dialog.Close>
                </div>
              </div>
            ) : (
              <div>
                <Dialog.Title className="font-heading text-h3 text-foreground">
                  {fillText(application.title, { role })}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {application.description}
                </Dialog.Description>

                <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                  <ErrorSummary
                    heading={common.errorSummaryHeading}
                    fields={summaryFields}
                  />

                  {/* Honeypot */}
                  <div aria-hidden="true" className="sr-only">
                    <label htmlFor="app-website">{common.honeypotLabel}</label>
                    <input
                      id="app-website"
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.website || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="app-name" className="block text-sm text-foreground/90">
                      {application.fields.name.label} <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="app-name"
                      ref={nameRef}
                      name="name"
                      type="text"
                      required
                      placeholder={application.fields.name.placeholder}
                      value={formData.name}
                      onChange={handleChange}
                      hasError={Boolean(fieldErrors.name)}
                      aria-describedby={describedBy(fieldErrors.name && errorId("app-name"))}
                      autoComplete="name"
                      className="mt-1.5"
                    />
                    <FieldError controlId="app-name" message={fieldErrors.name} className="mt-1" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="app-email" className="block text-sm text-foreground/90">
                        {application.fields.email.label} <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="app-email"
                        name="email"
                        type="email"
                        required
                        placeholder={application.fields.email.placeholder}
                        value={formData.email}
                        onChange={handleChange}
                        hasError={Boolean(fieldErrors.email)}
                        aria-describedby={describedBy(fieldErrors.email && errorId("app-email"))}
                        autoComplete="email"
                        className="mt-1.5"
                      />
                      <FieldError
                        controlId="app-email"
                        message={fieldErrors.email}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label htmlFor="app-phone" className="block text-sm text-foreground/90">
                        {application.fields.phone.label} <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="app-phone"
                        name="phone"
                        type="tel"
                        required
                        placeholder={application.fields.phone.placeholder}
                        value={formData.phone}
                        onChange={handleChange}
                        hasError={Boolean(fieldErrors.phone)}
                        aria-describedby={describedBy(fieldErrors.phone && errorId("app-phone"))}
                        autoComplete="tel"
                        className="mt-1.5"
                      />
                      <FieldError
                        controlId="app-phone"
                        message={fieldErrors.phone}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="app-cover" className="block text-sm text-foreground/90">
                      {application.fields.coverLetter.label}
                    </label>
                    <Textarea
                      id="app-cover"
                      name="coverLetter"
                      rows={3}
                      placeholder={application.fields.coverLetter.placeholder}
                      value={formData.coverLetter || ""}
                      onChange={handleChange}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <span id="app-cv-label" className="block text-sm text-foreground/90">
                      {application.fields.cv.label}{" "}
                      <span className="text-destructive">*</span>
                    </span>

                    {cvFile ? (
                      <div className="mt-2 flex items-center justify-between rounded-control border border-border bg-surface/50 px-4 py-3 text-sm">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                          <span className="truncate text-foreground font-normal">
                            {cvFile.name}
                          </span>
                          <span className="text-sm text-muted-foreground shrink-0">
                            ({fillText(application.fields.cv.sizeLabel, { size: (cvFile.size / 1024 / 1024).toFixed(2) })})
                          </span>
                        </div>
                        <button
                          id="app-cv-remove"
                          type="button"
                          onClick={handleRemoveFile}
                          className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={application.fields.cv.removeLabel}
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <label
                        data-dragging={isDragging ? "true" : undefined}
                        onDragEnter={handleDragOver}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                          "mt-2 flex cursor-pointer flex-col items-center justify-center rounded-control border border-dashed px-6 py-6 text-center transition-colors has-[:focus-visible]:border-primary has-[:focus-visible]:bg-primary/5",
                          isDragging
                            ? "border-primary bg-primary/10"
                            : "border-border bg-surface/30 hover:border-foreground/40",
                        )}
                      >
                        <UploadCloud className="size-8 text-muted-foreground" aria-hidden="true" />
                        <span className="mt-2 text-sm text-foreground font-normal">
                          {application.fields.cv.dropTitle}
                        </span>
                        <span className="mt-1 text-sm text-muted-foreground">
                          {application.fields.cv.dropHint}
                        </span>
                        <input
                          id="app-cv"
                          type="file"
                          aria-invalid={cvError ? "true" : undefined}
                          aria-describedby={describedBy(cvError && errorId("app-cv"))}
                          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                    )}

                    <FieldError controlId="app-cv" message={cvError} className="mt-1.5" />
                  </div>

                  <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />

                  {status === "error" ? (
                    <div
                      role="alert"
                      className="rounded-card border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          className="size-5 shrink-0 text-destructive mt-0.5"
                          aria-hidden="true"
                        />
                        <div className="flex-1">
                          <p className="text-destructive">{statusMessage}</p>
                          {emailFallback ? (
                            <>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {fillText(application.failure.emailIntro, { subject: emailSubject })}
                              </p>
                              <a
                                href={`mailto:${emailFallback}?subject=${encodeURIComponent(emailSubject)}`}
                                className="mt-2 inline-block text-sm text-primary font-normal hover:underline"
                              >
                                {emailFallback}
                              </a>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                    <Dialog.Close asChild>
                      <Button type="button" variant="outline">
                        {application.cancelLabel}
                      </Button>
                    </Dialog.Close>
                    <Button type="submit" variant="accent" disabled={status === "submitting"}>
                      {status === "submitting" ? common.submitting : application.submitLabel}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
