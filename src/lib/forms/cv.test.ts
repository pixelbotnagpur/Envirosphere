import { describe, expect, it } from "vitest";
import { cvMaxBytes, validateCvFile } from "./cv";

const file = (name: string, size = 1000, type = "") => ({ name, size, type });

describe("validateCvFile", () => {
  it("accepts a PDF and derives the MIME type from the extension", () => {
    expect(validateCvFile(file("resume.pdf"))).toEqual({ ok: true, mimeType: "application/pdf" });
  });

  it("accepts DOCX in any letter case", () => {
    expect(validateCvFile(file("My CV.DOCX"))).toEqual({
      ok: true,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  });

  it("does not trust the browser-reported type", () => {
    expect(validateCvFile(file("cv.pdf", 10, "application/octet-stream")).ok).toBe(true);
    expect(validateCvFile(file("cv.exe", 10, "application/pdf")).ok).toBe(false);
  });

  it("rejects old .doc and other formats in plain language", () => {
    const doc = validateCvFile(file("cv.doc"));
    expect(doc.ok).toBe(false);
    if (!doc.ok) expect(doc.error).toMatch(/PDF or DOCX/);
    expect(validateCvFile(file("cv")).ok).toBe(false);
    expect(validateCvFile(file("cv.pdf.exe")).ok).toBe(false);
  });

  it("rejects files over 5 MB and empty files", () => {
    const big = validateCvFile(file("cv.pdf", cvMaxBytes + 1));
    expect(big.ok).toBe(false);
    if (!big.ok) expect(big.error).toMatch(/5 MB/);
    expect(validateCvFile(file("cv.pdf", cvMaxBytes)).ok).toBe(true);
    expect(validateCvFile(file("cv.pdf", 0)).ok).toBe(false);
  });
});
