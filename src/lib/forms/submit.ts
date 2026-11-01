import { fillText } from "@/lib/forms/text";
import type { FormsCommonCopy } from "@/lib/validators/forms-content";

/** What happened to a submission. The visitor-facing text for each is in content/forms.yaml. */
export type SubmitOutcome = "sent" | "demo" | "unavailable" | "http-error" | "rejected" | "network-error";

export interface FormSubmissionResult {
  success: boolean;
  outcome: SubmitOutcome;
  /** Text sent back by the Apps Script itself (used as is, it is server-side copy). */
  serverMessage?: string;
  /** Extra value for the message: the HTTP status or the network error text. */
  detail?: string;
}

/** The sentence to show for a result: the server's own text when there is one, else content/forms.yaml. */
export function submitMessage(result: FormSubmissionResult, copy: FormsCommonCopy["submit"]): string {
  if (result.serverMessage) return result.serverMessage;
  switch (result.outcome) {
    case "sent":
      return copy.sent;
    case "demo":
      return copy.demo;
    case "unavailable":
      return copy.unavailable;
    case "http-error":
      return fillText(copy.httpError, { status: result.detail ?? "" });
    case "rejected":
      return copy.rejected;
    case "network-error":
      return fillText(copy.networkError, { error: result.detail ?? "" });
  }
}

/**
 * Transmits form payload as text/plain JSON to eliminate CORS preflight on Google Apps Script Web App.
 */
export async function submitForm<T extends Record<string, unknown>>(
  payload: T,
  endpoint = process.env.NEXT_PUBLIC_FORMS_ENDPOINT,
): Promise<FormSubmissionResult> {
  if (!endpoint || endpoint.trim() === "") {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      return { success: true, outcome: "demo" };
    }
    return { success: false, outcome: "unavailable" };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { success: false, outcome: "http-error", detail: String(response.status) };
    }

    const data = (await response.json()) as { success?: boolean; message?: string; error?: string };

    if (data.success) {
      return { success: true, outcome: "sent", serverMessage: data.message || undefined };
    }

    return { success: false, outcome: "rejected", serverMessage: data.error || data.message || undefined };
  } catch (err: unknown) {
    return {
      success: false,
      outcome: "network-error",
      detail: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
