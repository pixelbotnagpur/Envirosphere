// @vitest-environment node
import { describe, expect, it } from "vitest";
import { loadAll } from "@/lib/content";

describe("real site content (what the owner edits)", () => {
  const { home, services, media } = loadAll();

  it("has 13 services with unique, consecutive order numbers", () => {
    expect(services.map((s) => s.order)).toEqual(Array.from({ length: 13 }, (_, i) => i + 1));
  });

  it("has real text for every service (no placeholder left)", () => {
    for (const s of services) {
      expect(s.body, s.slug).not.toMatch(/TODO(content)/);
      expect(s.body.length, s.slug).toBeGreaterThan(200);
    }
  });

  it("lists every client logo in media.yaml with a readable alt", () => {
    expect(home.clients.logos.length).toBeGreaterThanOrEqual(30);
    for (const key of home.clients.logos) expect(media[key]?.alt.length).toBeGreaterThan(3);
  });

  it("has the four published statistics and four testimonials", () => {
    expect(home.stats.items).toHaveLength(4);
    expect(home.testimonials.items).toHaveLength(4);
  });

  it("has a drafted process with at least three steps", () => {
    expect(home.process.steps.length).toBeGreaterThanOrEqual(3);
  });
});
