// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeTree } from "@tests/unit/helpers/tree";
import { LOGO_SVG } from "@tests/unit/helpers/fixtures";
import { ContentError } from "./read";
import { resolveMedia, verifyAllMedia } from "./media";

const media = { logo: { src: "/media/brand/logo.svg", alt: "Logo" } };

describe("resolveMedia", () => {
  it("returns src, alt and dimensions probed from the file", () => {
    const { publicDir } = makeTree({ "public/media/brand/logo.svg": LOGO_SVG });
    expect(resolveMedia(media, "logo", publicDir)).toEqual({
      key: "logo",
      src: "/media/brand/logo.svg",
      alt: "Logo",
      width: 40,
      height: 40,
    });
  });

  it("prefers dimensions written in media.yaml", () => {
    const { publicDir } = makeTree({ "public/media/brand/logo.svg": LOGO_SVG });
    const sized = { logo: { ...media.logo, width: 100, height: 50 } };
    expect(resolveMedia(sized, "logo", publicDir)).toMatchObject({ width: 100, height: 50 });
  });

  it("fails with a plain message when the key is not listed", () => {
    const { publicDir } = makeTree({ "public/media/brand/logo.svg": LOGO_SVG });
    expect(() => resolveMedia(media, "hero", publicDir, "content/pages/home.yaml → hero.image")).toThrowError(
      /content\/pages\/home\.yaml → hero\.image: "hero" is not listed in content\/media\.yaml/,
    );
  });

  it("fails when the file is not in public/", () => {
    const { publicDir } = makeTree({ "public/other.txt": "x" });
    expect(() => resolveMedia(media, "logo", publicDir)).toThrowError(ContentError);
    expect(() => resolveMedia(media, "logo", publicDir)).toThrowError(
      /content\/media\.yaml → logo: file not found at public\/media\/brand\/logo\.svg/,
    );
  });

  it("does not probe sizes for non-images (pdf, mp4)", () => {
    const { publicDir } = makeTree({ "public/media/docs/brochure.pdf": "%PDF" });
    const docs = { brochure: { src: "/media/docs/brochure.pdf", alt: "Brochure" } };
    const resolved = resolveMedia(docs, "brochure", publicDir);
    expect(resolved.width).toBeUndefined();
  });
});

describe("verifyAllMedia", () => {
  it("throws on the first missing file", () => {
    const { publicDir } = makeTree({ "public/other.txt": "x" });
    expect(() => verifyAllMedia(media, publicDir)).toThrowError(/logo: file not found/);
  });
});
