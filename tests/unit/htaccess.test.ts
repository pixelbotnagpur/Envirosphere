// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const raw = readFileSync(path.join(process.cwd(), "public", ".htaccess"));
const text = raw.toString("utf8");
const csp = /Content-Security-Policy\s+"([^"]+)"/.exec(text)?.[1] ?? "";
const directive = (name: string) =>
  csp
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith(name + " ")) ?? "";

describe("public/.htaccess security header block", () => {
  it("has no UTF-8 BOM", () => {
    expect([raw[0], raw[1], raw[2]]).not.toEqual([0xef, 0xbb, 0xbf]);
  });

  it("has no Formspree leftovers", () => {
    expect(text.toLowerCase()).not.toContain("formspree");
  });

  it("CSP allows the Apps Script and Turnstile origins", () => {
    const connect = directive("connect-src");
    for (const o of [
      "'self'",
      "https://script.google.com",
      "https://script.googleusercontent.com",
      "https://challenges.cloudflare.com",
    ]) {
      expect(connect).toContain(o);
    }
    expect(directive("form-action")).toContain("https://script.google.com");
    expect(directive("script-src")).toContain("https://challenges.cloudflare.com");
    expect(directive("frame-src")).toContain("https://challenges.cloudflare.com");
  });

  it("HSTS is staged (short max-age, no preload, no includeSubDomains)", () => {
    const hsts = /Strict-Transport-Security\s+"([^"]+)"/.exec(text)?.[1] ?? "";
    expect(hsts).toMatch(/^max-age=300$/);
    expect(hsts).not.toMatch(/preload|includeSubDomains/i);
  });

  it("keeps the case-insensitive X-Forwarded-Proto rule", () => {
    expect(text).toMatch(/X-Forwarded-Proto\}\s+!https\s+\[NC\]/);
  });
});
