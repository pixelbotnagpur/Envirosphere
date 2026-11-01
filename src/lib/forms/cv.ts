import type { CvFileInput } from "@/lib/validators/forms";

export const cvMaxBytes = 5 * 1024 * 1024;

const mimeByExtension: Record<string, CvFileInput["type"]> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Why a chosen file was refused; the visitor-facing text for each is in content/forms.yaml. */
export type CvRejection = "wrongType" | "emptyFile" | "tooLarge";

export type CvCheck = { ok: true; mimeType: CvFileInput["type"] } | { ok: false; reason: CvRejection };

/**
 * Checks a chosen CV once, at selection time. The type comes from the file extension, never from
 * `file.type`: browsers report an empty or odd type for perfectly good documents.
 */
export function validateCvFile(file: { name: string; size: number }): CvCheck {
  const extension = /\.([A-Za-z0-9]+)$/.exec(file.name)?.[1]?.toLowerCase() ?? "";
  const mimeType = mimeByExtension[extension];
  if (!mimeType) {
    return { ok: false, reason: "wrongType" };
  }
  if (file.size <= 0) {
    return { ok: false, reason: "emptyFile" };
  }
  if (file.size > cvMaxBytes) {
    return { ok: false, reason: "tooLarge" };
  }
  return { ok: true, mimeType };
}
