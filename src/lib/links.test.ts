import { describe, expect, it } from "vitest";
import { mailtoHref, telHref } from "./links";

describe("links", () => {
  it("strips spaces from phone numbers for tel: links", () => {
    expect(telHref("+91 98602 20550")).toBe("tel:+919860220550");
  });
  it("builds mailto links", () => {
    expect(mailtoHref("info@example.com")).toBe("mailto:info@example.com");
  });
});
