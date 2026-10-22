export interface FormSubmissionResult {
  success: boolean;
  message: string;
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
      return {
        success: true,
        message: "Thank you. Your message has been received (demo mode).",
      };
    }
    return {
      success: false,
      message:
        "The submission service is temporarily unavailable. Please contact us directly via phone or email.",
    };
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
      return {
        success: false,
        message: `Submission failed with status ${response.status}. Please try again or reach out directly.`,
      };
    }

    const data = (await response.json()) as { success?: boolean; message?: string; error?: string };

    if (data.success) {
      return {
        success: true,
        message: data.message || "Thank you. Your inquiry has been successfully submitted.",
      };
    }

    return {
      success: false,
      message:
        data.error ||
        data.message ||
        "Could not process submission. Please verify your details or contact us directly.",
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      message: `Network error (${errorMessage}). Please check your connection or contact our office.`,
    };
  }
}
