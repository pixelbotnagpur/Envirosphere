// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dir = path.join(process.cwd(), "integrations", "google-sheets");
const validationSource = readFileSync(path.join(dir, "validation.js"), "utf8");
const codeSource = readFileSync(path.join(dir, "Code.gs"), "utf8");

// validation.js is plain Apps Script style JS; evaluate it with a fake CommonJS `module`.
type Result = { ok: boolean; message?: string; clean?: Record<string, string>; ext?: string; mime?: string };
interface Validation {
  SERVICE_SLUGS: string[];
  LIMITS: Record<string, number>;
  CV_MAX_BYTES: number;
  sanitize(v: unknown): string;
  isValidEmail(v: unknown): boolean;
  checkFillTime(fillMs: unknown): boolean;
  isHoneypotTripped(p: unknown): boolean;
  validateInquiry(p: Record<string, unknown>): Result;
  validateApplication(p: Record<string, unknown>, roles: string[] | null): Result;
  checkCvMetadata(cv: unknown): Result;
  checkCvBytes(bytes: number[], ext: string): Result;
  safeCvFilename(now: number, name: string, ext: string): string;
  isOverLimit(count: unknown, max: number): boolean;
  turnstileAction(secret: string | null, token: unknown): "skip" | "reject" | "verify";
}
const mod = { exports: {} as unknown as Validation };
new Function("module", validationSource)(mod);
const v = mod.exports;

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const goodInquiry = {
  name: "Anand Mahajan",
  organization: "Godavari Paper Mills",
  email: "anand@example.com",
  phone: "+91 98602 20550",
  service: "water-audit",
  message: "We need a water audit for our unit.",
};
const goodApplication = {
  name: "Pooja Deshmukh",
  email: "pooja@example.com",
  phone: "+91 98602 20550",
  role: "Senior EIA Coordinator",
  coverLetter: "Hello",
  cvFile: { name: "cv.pdf" },
};

describe("service allow-list stays in sync with content/services", () => {
  it("matches the service slugs plus general", () => {
    const slugs = readdirSync(path.join(process.cwd(), "content", "services"))
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""));
    expect([...v.SERVICE_SLUGS].sort()).toEqual([...slugs, "general"].sort());
  });
});

describe("sanitize", () => {
  it("prefixes formula-looking and tab/CR-led values", () => {
    for (const bad of ["=SUM(A1)", "+1", "-1", "@cmd", "\t=1", "\r=1", "  =1"]) {
      expect(v.sanitize(bad).startsWith("'")).toBe(true);
    }
  });
  it("leaves normal text alone and strips control characters", () => {
    expect(v.sanitize("  Hello  ")).toBe("Hello");
    expect(v.sanitize("a\u0000b")).toBe("ab");
    expect(v.sanitize(null)).toBe("");
  });
});

describe("fill time and honeypot", () => {
  it("requires an integer fillMs between 3 seconds and 24 hours", () => {
    expect(v.checkFillTime(undefined)).toBe(false);
    expect(v.checkFillTime(null)).toBe(false);
    expect(v.checkFillTime("abc")).toBe(false);
    expect(v.checkFillTime("5000")).toBe(false);
    expect(v.checkFillTime(NaN)).toBe(false);
    expect(v.checkFillTime(Infinity)).toBe(false);
    expect(v.checkFillTime(4000.5)).toBe(false);
    expect(v.checkFillTime(-5000)).toBe(false);
    expect(v.checkFillTime(2999)).toBe(false);
    expect(v.checkFillTime(3000)).toBe(true);
    expect(v.checkFillTime(86_400_000)).toBe(true);
    expect(v.checkFillTime(86_400_001)).toBe(false);
  });
  it("does not depend on any absolute timestamp", () => {
    expect(validationSource).not.toContain("formLoadedAt");
    expect(codeSource).not.toContain("formLoadedAt");
  });
  it("detects the honeypot", () => {
    expect(v.isHoneypotTripped({ website: "http://spam" })).toBe(true);
    expect(v.isHoneypotTripped({ website: "  " })).toBe(false);
    expect(v.isHoneypotTripped({})).toBe(false);
  });
});

describe("validateInquiry", () => {
  it("accepts a good inquiry", () => {
    const r = v.validateInquiry(goodInquiry);
    expect(r.ok).toBe(true);
    expect(r.clean?.service).toBe("water-audit");
  });
  it("enforces length caps on every field", () => {
    for (const [field, max] of [
      ["name", v.LIMITS.name],
      ["organization", v.LIMITS.organization],
      ["email", v.LIMITS.email],
      ["message", v.LIMITS.message],
    ] as const) {
      expect(v.validateInquiry({ ...goodInquiry, [field]: "a".repeat(max + 1) }).ok).toBe(false);
    }
    expect(v.validateInquiry({ ...goodInquiry, message: "x".repeat(60000) }).ok).toBe(false);
  });
  it("rejects bad email, phone and unknown services", () => {
    expect(v.validateInquiry({ ...goodInquiry, email: "nope" }).ok).toBe(false);
    expect(v.validateInquiry({ ...goodInquiry, email: "a@b.co\nBcc: x@y.z" }).ok).toBe(false);
    expect(v.validateInquiry({ ...goodInquiry, phone: "12" }).ok).toBe(false);
    expect(v.validateInquiry({ ...goodInquiry, service: "=HYPERLINK()" }).ok).toBe(false);
    expect(v.validateInquiry({ ...goodInquiry, service: "" }).ok).toBe(false);
    expect(v.validateInquiry({ ...goodInquiry, name: { a: 1 } }).ok).toBe(false);
  });
  it("accepts the general service", () => {
    expect(v.validateInquiry({ ...goodInquiry, service: "general" }).ok).toBe(true);
  });
});

describe("validateApplication", () => {
  it("accepts a good application and applies the ALLOWED_ROLES list when set", () => {
    expect(v.validateApplication(goodApplication, null).ok).toBe(true);
    expect(v.validateApplication(goodApplication, ["Senior EIA Coordinator"]).ok).toBe(true);
    expect(v.validateApplication(goodApplication, ["Other Role"]).ok).toBe(false);
    expect(v.validateApplication({ ...goodApplication, role: "General Application" }, ["Other"]).ok).toBe(true);
  });
  it("rejects odd role text, long fields and missing CV", () => {
    expect(v.validateApplication({ ...goodApplication, role: "=cmd|' /C calc'!A0" }, null).ok).toBe(false);
    expect(v.validateApplication({ ...goodApplication, role: "a".repeat(121) }, null).ok).toBe(false);
    expect(v.validateApplication({ ...goodApplication, coverLetter: "x".repeat(2001) }, null).ok).toBe(false);
    expect(v.validateApplication({ ...goodApplication, cvFile: undefined }, null).ok).toBe(false);
  });
});

describe("CV checks", () => {
  const meta = (over: Record<string, unknown> = {}) => ({ name: "cv.pdf", type: PDF, data: "JVBERi0=", ...over });

  it("accepts pdf, doc and docx metadata with matching MIME", () => {
    expect(v.checkCvMetadata(meta()).ext).toBe("pdf");
    expect(v.checkCvMetadata(meta({ name: "a.DOCX", type: DOCX })).ext).toBe("docx");
    expect(v.checkCvMetadata(meta({ name: "a.doc", type: "application/msword" })).ok).toBe(true);
  });
  it("rejects wrong extension, mismatching MIME, oversize and non-base64 data", () => {
    expect(v.checkCvMetadata(meta({ name: "cv.exe" })).ok).toBe(false);
    expect(v.checkCvMetadata(meta({ name: "cv.pdf.html", type: PDF })).ok).toBe(false);
    expect(v.checkCvMetadata(meta({ type: "text/html" })).ok).toBe(false);
    expect(v.checkCvMetadata(meta({ name: "cv.docx", type: PDF })).ok).toBe(false);
    expect(v.checkCvMetadata(meta({ data: "A".repeat(8_000_000) })).ok).toBe(false);
    expect(v.checkCvMetadata(meta({ data: "<script>" })).ok).toBe(false);
    expect(v.checkCvMetadata(null).ok).toBe(false);
  });
  it("checks magic bytes (including Apps Script signed bytes) and size", () => {
    expect(v.checkCvBytes([0x25, 0x50, 0x44, 0x46, 0x2d], "pdf").ok).toBe(true);
    expect(v.checkCvBytes([0x4d, 0x5a, 0x90, 0x00], "pdf").ok).toBe(false);
    const signedDoc = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].map((b) => (b > 127 ? b - 256 : b));
    expect(v.checkCvBytes(signedDoc, "doc").ok).toBe(true);
    expect(v.checkCvBytes([0x50, 0x4b, 0x03, 0x04, 1], "docx").ok).toBe(true);
    expect(v.checkCvBytes([0x50, 0x4b, 0x03, 0x04], "pdf").ok).toBe(false);
    expect(v.checkCvBytes([], "pdf").ok).toBe(false);
    expect(v.checkCvBytes(new Array(v.CV_MAX_BYTES + 1).fill(0x25), "pdf").ok).toBe(false);
  });
  it("builds a safe stored filename from timestamp and sanitised name", () => {
    const name = v.safeCvFilename(Date.UTC(2026, 10, 1, 14, 30, 5), "../../My CV (final)<script>.pdf", "pdf");
    expect(name).toBe("CV_20261101-143005_My-CV-final-script.pdf");
    expect(v.safeCvFilename(0, "???.pdf", "docx")).toMatch(/^CV_19700101-000000_cv\.docx$/);
    expect(v.safeCvFilename(0, "a".repeat(200) + ".pdf", "pdf").length).toBeLessThan(80);
  });
});

describe("throttle and Turnstile decisions", () => {
  it("limits at the configured count", () => {
    expect(v.isOverLimit(undefined, 5)).toBe(false);
    expect(v.isOverLimit("4", 5)).toBe(false);
    expect(v.isOverLimit("5", 5)).toBe(true);
  });
  it("fails closed when a secret is set and skips only when it is not", () => {
    expect(v.turnstileAction("", undefined)).toBe("skip");
    expect(v.turnstileAction(null, "tok")).toBe("skip");
    expect(v.turnstileAction("secret", undefined)).toBe("reject");
    expect(v.turnstileAction("secret", "")).toBe("reject");
    expect(v.turnstileAction("secret", "x".repeat(5000))).toBe("reject");
    expect(v.turnstileAction("secret", "tok")).toBe("verify");
  });
});

describe("Code.gs wiring (source guards; Apps Script cannot run here)", () => {
  it("uses the validation helpers and the TURNSTILE_SECRET property", () => {
    for (const fn of [
      "isHoneypotTripped",
      "checkFillTime",
      "validateInquiry",
      "validateApplication",
      "checkCvMetadata",
      "checkCvBytes",
      "safeCvFilename",
      "turnstileAction",
      "isOverLimit",
    ]) {
      expect(codeSource).toContain(fn + "(");
    }
    expect(codeSource).toContain("TURNSTILE_SECRET");
  });
  it("never falls back to the Drive root and never leaks error text to the client", () => {
    expect(codeSource).not.toContain("getRootFolder");
    expect(codeSource).not.toMatch(/jsonResponse\([^)]*(toString\(\)|error\.message|err\.message)/);
    expect(codeSource).toContain("DRIVE_FOLDER_ID");
  });
  it("takes the lock only around the sheet append", () => {
    const doPost = codeSource.slice(codeSource.indexOf("function doPost"), codeSource.indexOf("function handleInquiry"));
    expect(doPost).not.toContain("waitLock");
    expect(codeSource).toMatch(/function appendRowLocked/);
    expect(codeSource.match(/waitLock\(/g)).toHaveLength(1);
  });
});
