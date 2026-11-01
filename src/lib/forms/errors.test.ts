import { describe, expect, it } from "vitest";
import { forms } from "@tests/unit/helpers/forms";
import { createApplicationSchema, createInquirySchema } from "@/lib/validators/forms";
import { collectFieldErrors, firstInvalidField } from "./errors";

const applicationSchema = createApplicationSchema(forms.application.errors);
const inquirySchema = createInquirySchema(forms.inquiry.errors);

describe("collectFieldErrors", () => {
  it("keeps the first message per field and flattens nested cvFile errors onto cvFile", () => {
    const parsed = applicationSchema.safeParse({ name: "", email: "x", phone: "1", role: "R", cvFile: {} });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const { errors } = collectFieldErrors(parsed.error.issues);
    expect(Object.keys(errors).sort()).toEqual(["cvFile", "email", "name", "phone", "role"]);
  });

  it("never surfaces the honeypot, but reports that it was the only problem", () => {
    const parsed = inquirySchema.safeParse({
      name: "Rajesh Sharma",
      email: "r@example.com",
      phone: "+91 98602 20550",
      service: "general",
      message: "A long enough message here.",
      website: "http://autofilled.example",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const result = collectFieldErrors(parsed.error.issues);
    expect(result.errors).toEqual({});
    expect(result.honeypotOnly).toBe(true);
  });

  it("is not honeypotOnly when a real field also fails", () => {
    const parsed = inquirySchema.safeParse({ name: "", website: "x" });
    if (parsed.success) throw new Error("expected failure");
    const result = collectFieldErrors(parsed.error.issues);
    expect(result.honeypotOnly).toBe(false);
    expect(result.errors.name).toBeDefined();
  });
});

describe("firstInvalidField", () => {
  it("follows on-screen order, not the order errors were found", () => {
    expect(firstInvalidField(["name", "email", "phone"], { phone: "x", email: "y" })).toBe("email");
  });

  it("returns null when nothing in the order has an error", () => {
    expect(firstInvalidField(["name"], { role: "x" })).toBeNull();
  });
});

describe("firstInvalidField", () => {
  it("follows on-screen order, not the order errors were found", () => {
    expect(firstInvalidField(["name", "email", "phone"], { phone: "x", email: "y" })).toBe("email");
  });

  it("returns null when nothing in the order has an error", () => {
    expect(firstInvalidField(["name"], { role: "x" })).toBeNull();
  });
});
