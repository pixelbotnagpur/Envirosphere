import type { CvFileInput } from "@/lib/validators/forms";

export const cvMaxBytes = 5 * 1024 * 1024;

const mimeByExtension: Record<string, CvFileInput["type"]> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export type CvCheck = { ok: true; mimeType: CvFileInput["type"] } | { ok: false; error: string };

/**
 * Checks a chosen CV once, at selection time. The type comes from the file extension, never from
 * `file.type`: browsers report an empty or odd type for perfectly good documents.
 */
export function validateCvFile(file: { name: string; size: number }): CvCheck {
  const extension = /\.([A-Za-z0-9]+)$/.exec(file.name)?.[1]?.toLowerCase() ?? "";
  const mimeType = mimeByExtension[extension];
  if (!mimeType) {
    return { ok: false, error: "Please choose a PDF or DOCX file (older .doc files are not accepted)." };
  }
  if (file.size <= 0) {
    return { ok: false, error: "This file looks empty. Please choose another document." };
  }
  if (file.size > cvMaxBytes) {
    return { ok: false, error: "This file is larger than 5 MB. Please choose a smaller PDF or DOCX." };
  }
  return { ok: true, mimeType };
}
