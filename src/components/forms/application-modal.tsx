"use client";

import { CheckCircle2, AlertCircle, UploadCloud, X, FileText } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Turnstile, isTurnstileEnabled } from "@/components/forms/turnstile";
import { submitForm } from "@/lib/forms/submit";
import {
  applicationSchema,
  isBotSubmission,
  type ApplicationInput,
  type CvFileInput,
} from "@/lib/validators/forms";

export interface ApplicationModalProps {
  role: string;
  isOpen: boolean;
  onClose: () => void;
  emailFallback?: string;
  /** Called while focus is being returned after close; call preventDefault() to move it elsewhere. */
  onCloseAutoFocus?: (event: Event) => void;
}

export function ApplicationModal({
  role,
  isOpen,
  onClose,
  emailFallback = "careers@envirosphere.co.in",
  onCloseAutoFocus,
}: ApplicationModalProps) {
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
  const openedAtRef = React.useRef<number>(0);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = React.useState<string>("");
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = React.useState(0);

  React.useEffect(() => {
    if (isOpen) openedAtRef.current = performance.now();
  }, [isOpen]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setFileError("CV file size exceeds the 5 MB limit.");
      return;
    }

    // Validate type
    const validExtensions = /\.(pdf|docx)$/i;
    if (!validExtensions.test(file.name)) {
      setFileError("Only PDF, DOC, or DOCX files are accepted.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(",")[1] || "";
      setCvFile({
        name: file.name,
        type: (file.type as CvFileInput["type"]) || "application/pdf",
        size: file.size,
        data: base64Data,
      });
    };
    reader.onerror = () => {
      setFileError("Could not read file. Please try another document.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setCvFile(null);
    setFileError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!cvFile) {
      setFileError("Please upload your CV document (PDF, DOC, or DOCX).");
      return;
    }

    const fillMs = Math.round(performance.now() - openedAtRef.current);
    const payload = {
      ...formData,
      cvFile,
      fillMs,
    };

    const parsed = applicationSchema.safeParse(payload);

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

    if (isBotSubmission({ website: formData.website, fillMs })) {
      setStatus("success");
      setStatusMessage("Thank you. Your application has been logged.");
      return;
    }

    if (isTurnstileEnabled() && !turnstileToken) {
      setStatus("error");
      setStatusMessage("Please complete the verification check, then submit again.");
      return;
    }

    setFieldErrors({});
    setStatus("submitting");

    const result = await submitForm({
      ...parsed.data,
      turnstileToken: turnstileToken ?? undefined,
    });
    setTurnstileReset((n) => n + 1);

    if (result.success) {
      setStatus("success");
      setStatusMessage(
        result.message || "Thank you. Your job application and CV have been safely received.",
      );
    } else {
      setStatus("error");
      setStatusMessage(
        result.message ||
          "Could not transmit application automatically. Please email your CV directly.",
      );
    }
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
                aria-label="Close modal"
                className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-pill"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </Dialog.Close>

            {status === "success" ? (
              <div role="status" className="py-6 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-pill bg-primary/10 text-primary">
                  <CheckCircle2 className="size-8" aria-hidden="true" />
                </div>
                <Dialog.Title className="mt-6 font-heading text-h3 text-foreground">
                  Application Submitted
                </Dialog.Title>
                <p className="mt-3 text-lead font-light text-muted-foreground">{statusMessage}</p>
                <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                  Our HR and technical appraisal team will review your profile and reach out if
                  there is a mutual fit.
                </Dialog.Description>
                <div className="mt-8 flex justify-center gap-4">
                  <Dialog.Close asChild>
                    <Button variant="outline">Close</Button>
                  </Dialog.Close>
                </div>
              </div>
            ) : (
              <div>
                <Dialog.Title className="font-heading text-h3 text-foreground">
                  Apply for {role}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Submit your curriculum vitae and contact details directly to our technical
                  recruitment panel.
                </Dialog.Description>

                <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                  {/* Honeypot */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      width: 1,
                      height: 1,
                      padding: 0,
                      margin: -1,
                      overflow: "hidden",
                      clip: "rect(0, 0, 0, 0)",
                      border: 0,
                    }}
                  >
                    <label htmlFor="app-website">Website</label>
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
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="app-name"
                      ref={nameRef}
                      name="name"
                      type="text"
                      required
                      placeholder="e.g. Pooja Deshmukh"
                      value={formData.name}
                      onChange={handleChange}
                      hasError={Boolean(fieldErrors.name)}
                      className="mt-1.5"
                    />
                    {fieldErrors.name ? (
                      <p className="mt-1 text-sm text-destructive">{fieldErrors.name}</p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="app-email" className="block text-sm text-foreground/90">
                        Email Address <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="app-email"
                        name="email"
                        type="email"
                        required
                        placeholder="pooja@domain.com"
                        value={formData.email}
                        onChange={handleChange}
                        hasError={Boolean(fieldErrors.email)}
                        className="mt-1.5"
                      />
                      {fieldErrors.email ? (
                        <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>
                      ) : null}
                    </div>

                    <div>
                      <label htmlFor="app-phone" className="block text-sm text-foreground/90">
                        Phone Number <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="app-phone"
                        name="phone"
                        type="tel"
                        required
                        placeholder="+91 98602 20550"
                        value={formData.phone}
                        onChange={handleChange}
                        hasError={Boolean(fieldErrors.phone)}
                        className="mt-1.5"
                      />
                      {fieldErrors.phone ? (
                        <p className="mt-1 text-sm text-destructive">{fieldErrors.phone}</p>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="app-cover" className="block text-sm text-foreground/90">
                      Brief Introduction & Key Clearances Handled
                    </label>
                    <Textarea
                      id="app-cover"
                      name="coverLetter"
                      rows={3}
                      placeholder="Highlight key sectors (EIA, SPCB, auditing) or technical qualifications..."
                      value={formData.coverLetter || ""}
                      onChange={handleChange}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-foreground/90">
                      Curriculum Vitae (PDF or DOC, max 5 MB){" "}
                      <span className="text-destructive">*</span>
                    </label>

                    {cvFile ? (
                      <div className="mt-2 flex items-center justify-between rounded-control border border-border bg-surface/50 px-4 py-3 text-sm">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                          <span className="truncate text-foreground font-normal">
                            {cvFile.name}
                          </span>
                          <span className="text-sm text-muted-foreground shrink-0">
                            ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Remove selected CV"
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <label className="mt-2 flex flex-col items-center justify-center rounded-control border border-dashed border-border hover:border-foreground/40 bg-surface/30 px-6 py-6 text-center cursor-pointer transition-colors">
                        <UploadCloud className="size-8 text-muted-foreground" aria-hidden="true" />
                        <span className="mt-2 text-sm text-foreground font-normal">
                          Click to choose or drag CV file
                        </span>
                        <span className="mt-1 text-sm text-muted-foreground">
                          PDF, DOC, or DOCX (up to 5 MB)
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                    )}

                    {fileError ? (
                      <p className="mt-1.5 text-sm text-destructive">{fileError}</p>
                    ) : null}
                  </div>

                  <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />

                  {status === "error" ? (
                    <div className="rounded-card border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          className="size-5 shrink-0 text-destructive mt-0.5"
                          aria-hidden="true"
                        />
                        <div className="flex-1">
                          <p className="text-destructive">{statusMessage}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Please email your CV directly with subject &quot;Application: {role}
                            &quot;:
                          </p>
                          <a
                            href={`mailto:${emailFallback}?subject=${encodeURIComponent(`Application: ${role}`)}`}
                            className="mt-2 inline-block text-sm text-primary font-normal hover:underline"
                          >
                            {emailFallback}
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                    <Dialog.Close asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </Dialog.Close>
                    <Button type="submit" variant="accent" disabled={status === "submitting"}>
                      {status === "submitting" ? "Transmitting..." : "Submit Application"}
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
