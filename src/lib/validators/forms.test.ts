import { describe, expect, it } from "vitest";
import { forms } from "@tests/unit/helpers/forms";
import {
  createApplicationSchema,
  createCvFileSchema,
  createInquirySchema,
  isBotSubmission,
  isHoneypotFilled,
  isTooFast,
} from "./forms";

const inquirySchema = createInquirySchema(forms.inquiry.errors);
const applicationSchema = createApplicationSchema(forms.application.errors);
const cvFileSchema = createCvFileSchema(forms.application.errors);

/** The message the schema gives for one field of a bad value. */
const messageFor = (result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }, field: string) =>
  result.error?.issues.find((issue) => issue.path[0] === field)?.message;

describe("inquirySchema", () => {
  const validInquiry = {
    type: "inquiry" as const,
    name: "Dr. Arvind Kulkarni",
    organization: "Apex Biotech Industries",
    email: "arvind@apexbiotech.com",
    phone: "+91 98602 20550",
    service: "environmental-clearance",
    message: "We need an EIA scoping study for our upcoming facility in MIDC Tarapur.",
    website: "",
    fillMs: 5000,
  };

  it("accepts a well-formed consultation inquiry", () => {
    const result = inquirySchema.safeParse(validInquiry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Dr. Arvind Kulkarni");
      expect(result.data.type).toBe("inquiry");
    }
  });

  it("rejects an empty name or message", () => {
    const emptyName = inquirySchema.safeParse({ ...validInquiry, name: "" });
    expect(emptyName.success).toBe(false);
    expect(messageFor(emptyName, "name")).toBe(forms.inquiry.errors.nameMin);

    const shortMsg = inquirySchema.safeParse({ ...validInquiry, message: "short" });
    expect(shortMsg.success).toBe(false);
    expect(messageFor(shortMsg, "message")).toBe(forms.inquiry.errors.messageMin);
  });

  it("rejects invalid email formats", () => {
    const badEmail = inquirySchema.safeParse({ ...validInquiry, email: "invalid-email" });
    expect(badEmail.success).toBe(false);
    expect(messageFor(badEmail, "email")).toBe(forms.inquiry.errors.emailInvalid);
  });

  it("rejects invalid phone numbers", () => {
    const badPhone = inquirySchema.safeParse({ ...validInquiry, phone: "123" });
    expect(badPhone.success).toBe(false);
    expect(messageFor(badPhone, "phone")).toBe(forms.inquiry.errors.phoneInvalid);
  });

  it("rejects if the honeypot website field is populated", () => {
    const bot = inquirySchema.safeParse({ ...validInquiry, website: "https://spam.com" });
    expect(bot.success).toBe(false);
  });
});

describe("applicationSchema", () => {
  const validApplication = {
    type: "application" as const,
    name: "Pooja Deshmukh",
    email: "pooja.d@gmail.com",
    phone: "+91 91234 56789",
    role: "Senior EIA Coordinator",
    coverLetter: "10 years experience in MoEFCC appraisals.",
    cvFile: {
      name: "Pooja_Deshmukh_CV.pdf",
      type: "application/pdf" as const,
      size: 1024 * 1024, // 1MB
      data: "JVBERi0xLjQKJ...",
    },
    website: "",
    fillMs: 5000,
  };

  it("accepts a well-formed job application with CV", () => {
    const result = applicationSchema.safeParse(validApplication);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cvFile.name).toBe("Pooja_Deshmukh_CV.pdf");
      expect(result.data.role).toBe("Senior EIA Coordinator");
    }
  });

  it("rejects files over 5 MB", () => {
    const oversize = applicationSchema.safeParse({
      ...validApplication,
      cvFile: {
        ...validApplication.cvFile,
        size: 6 * 1024 * 1024,
      },
    });
    expect(oversize.success).toBe(false);
    expect(oversize.error?.issues[0]?.message).toBe(forms.application.errors.tooLarge);
  });

  it("rejects disallowed file extensions or MIME types", () => {
    const badExt = applicationSchema.safeParse({
      ...validApplication,
      cvFile: {
        ...validApplication.cvFile,
        name: "malicious.exe",
        type: "application/pdf" as const,
      },
    });
    expect(badExt.success).toBe(false);
    expect(badExt.error?.issues[0]?.message).toBe(forms.application.errors.wrongType);
  });
});

describe("isBotSubmission", () => {
  it("detects filled honeypot as bot", () => {
    expect(isBotSubmission({ website: "http://bot.xyz" })).toBe(true);
  });

  it("detects rapid submissions (< 3000ms) as bot", () => {
    expect(isBotSubmission({ website: "", fillMs: 2000 }, 3000)).toBe(true);
  });

  it("passes legitimate submissions", () => {
    expect(isBotSubmission({ website: "", fillMs: 5000 }, 3000)).toBe(false);
  });
});

describe("isHoneypotFilled / isTooFast", () => {
  it("tells the trap field apart from a fast fill", () => {
    expect(isHoneypotFilled({ website: " x " })).toBe(true);
    expect(isHoneypotFilled({ website: "  " })).toBe(false);
    expect(isTooFast(2999, 3000)).toBe(true);
    expect(isTooFast(3000, 3000)).toBe(false);
    expect(isTooFast(undefined, 3000)).toBe(false);
  });
});

describe("cvFileSchema (legacy .doc is not accepted)", () => {
  const base = { size: 1000, data: "JVBERi0=" };
  it("accepts pdf and docx", () => {
    expect(cvFileSchema.safeParse({ ...base, name: "cv.pdf", type: "application/pdf" }).success).toBe(true);
    expect(
      cvFileSchema.safeParse({
        ...base,
        name: "cv.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }).success,
    ).toBe(true);
  });
  it("rejects .doc and application/msword", () => {
    expect(cvFileSchema.safeParse({ ...base, name: "cv.doc", type: "application/msword" }).success).toBe(false);
    expect(cvFileSchema.safeParse({ ...base, name: "cv.pdf", type: "application/msword" }).success).toBe(false);
  });
});
