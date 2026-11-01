// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  CARD_MAX_WIDTH,
  SIZE_THRESHOLD,
  WIDE_MAX_WIDTH,
  maxWidthFor,
  relMediaPath,
  shouldWrite,
  skipReason,
  targetSize,
  webpPathFor,
} from "../../scripts/optimize-images";

describe("maxWidthFor", () => {
  it("lets full-bleed folders be wide and everything else card-sized", () => {
    expect(maxWidthFor("images/hero-eco-architecture.jpg")).toBe(WIDE_MAX_WIDTH);
    expect(maxWidthFor("photos/hands-soil-sapling.jpg")).toBe(WIDE_MAX_WIDTH);
    expect(maxWidthFor("gallery/g01.jpg")).toBe(CARD_MAX_WIDTH);
    expect(maxWidthFor("clients/perkins.webp")).toBe(CARD_MAX_WIDTH);
  });
});

describe("targetSize", () => {
  it("never upscales a smaller picture", () => {
    expect(targetSize(736, 1000, 1200)).toEqual({ width: 736, height: 1000 });
    expect(targetSize(2000, 1000, 2000)).toEqual({ width: 2000, height: 1000 });
  });
  it("keeps the aspect ratio when shrinking", () => {
    expect(targetSize(2400, 1600, 2000)).toEqual({ width: 2000, height: 1333 });
  });
});

describe("skipReason", () => {
  it("skips small WebP files", () => {
    expect(skipReason({ rel: "clients/lg.webp", size: 5000, hasAlpha: false })).toBe(
      "already small WebP",
    );
  });
  it("converts a WebP that is over the threshold", () => {
    expect(
      skipReason({ rel: "images/a.webp", size: SIZE_THRESHOLD + 1, hasAlpha: false }),
    ).toBeNull();
  });
  it("converts large and small JPG/PNG photos", () => {
    expect(skipReason({ rel: "gallery/g08.png", size: 1_300_000, hasAlpha: false })).toBeNull();
    expect(skipReason({ rel: "photos/a.jpg", size: 40_000, hasAlpha: false })).toBeNull();
  });
  it("leaves logos that need transparency alone", () => {
    expect(skipReason({ rel: "brand/mark.png", size: 9000, hasAlpha: true })).toBe(
      "logo that needs transparency",
    );
  });
  it("ignores SVG and other non-raster files", () => {
    expect(skipReason({ rel: "brand/logo.svg", size: 247, hasAlpha: false })).toBe(
      "not a raster image",
    );
  });
});

describe("shouldWrite", () => {
  it("writes when missing, or when the source is newer", () => {
    expect(shouldWrite(false, 0, 100, false)).toBe(true);
    expect(shouldWrite(true, 50, 100, false)).toBe(true);
  });
  it("keeps a newer output unless forced", () => {
    expect(shouldWrite(true, 200, 100, false)).toBe(false);
    expect(shouldWrite(true, 200, 100, true)).toBe(true);
  });
});

describe("path helpers", () => {
  it("swaps the extension for .webp", () => {
    expect(webpPathFor("public/media/gallery/g08.png")).toBe("public/media/gallery/g08.webp");
  });
  it("makes media-relative paths with forward slashes", () => {
    expect(relMediaPath("public/media/gallery/g08.png")).toBe("gallery/g08.png");
  });
});
