import { describe, expect, it } from "vitest";
import { applicationSchema, inquirySchema } from "@/lib/validators/forms";
import { collectFieldErrors } from "./errors";

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
