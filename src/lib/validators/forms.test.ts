import { describe, expect, it } from "vitest";
import {
  applicationSchema,
  inquirySchema,
  isBotSubmission,
} from "./forms";

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
    formLoadedAt: Date.now() - 5000,
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

    const shortMsg = inquirySchema.safeParse({ ...validInquiry, message: "short" });
    expect(shortMsg.success).toBe(false);
  });

  it("rejects invalid email formats", () => {
    const badEmail = inquirySchema.safeParse({ ...validInquiry, email: "invalid-email" });
    expect(badEmail.success).toBe(false);
  });

  it("rejects invalid phone numbers", () => {
    const badPhone = inquirySchema.safeParse({ ...validInquiry, phone: "123" });
    expect(badPhone.success).toBe(false);
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
    formLoadedAt: Date.now() - 5000,
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
  });
});

describe("isBotSubmission", () => {
  it("detects filled honeypot as bot", () => {
    expect(isBotSubmission({ website: "http://bot.xyz" })).toBe(true);
  });

  it("detects rapid submissions (< 3000ms) as bot", () => {
    const now = 10000;
    expect(isBotSubmission({ website: "", formLoadedAt: 8000 }, 3000, now)).toBe(true);
  });

  it("passes legitimate submissions", () => {
    const now = 10000;
    expect(isBotSubmission({ website: "", formLoadedAt: 5000 }, 3000, now)).toBe(false);
  });
});
