import { describe, expect, it } from "vitest";
import { canonicalAlternates, canonicalUrl } from "./seo";

describe("canonicalUrl", () => {
  it("builds the home URL with a trailing slash", () => {
    expect(canonicalUrl("https://example.com", "/")).toBe("https://example.com/");
    expect(canonicalUrl("https://example.com/", "")).toBe("https://example.com/");
  });

  it("adds the trailing slash and normalises slashes", () => {
    expect(canonicalUrl("https://example.com", "/about")).toBe("https://example.com/about/");
    expect(canonicalUrl("https://example.com/", "services/crz-clearance/")).toBe(
      "https://example.com/services/crz-clearance/",
    );
  });

  it("wraps the URL for Next metadata", () => {
    expect(canonicalAlternates("https://example.com", "/why-us/")).toEqual({
      canonical: "https://example.com/why-us/",
    });
  });
});
