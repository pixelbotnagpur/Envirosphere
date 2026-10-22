// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeTree } from "@tests/unit/helpers/tree";
import { LOGO_SVG } from "@tests/unit/helpers/fixtures";
import { ContentError } from "./read";
import { resolveMedia, toImageAsset, verifyAllMedia } from "./media";

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
    expect(resolved.height).toBeUndefined();
  });

  it("explains a zero-byte image in plain words", () => {
    const { publicDir } = makeTree({ "public/media/brand/logo.png": "" });
    const png = { logo: { src: "/media/brand/logo.png", alt: "Logo" } };
    expect(() => resolveMedia(png, "logo", publicDir)).toThrowError(ContentError);
    expect(() => resolveMedia(png, "logo", publicDir)).toThrowError(
      /^content\/media\.yaml → logo: \/media\/brand\/logo\.png is not a readable image \(/,
    );
  });

  it("explains an svg without any size information", () => {
    const { publicDir } = makeTree({
      "public/media/brand/logo.svg": '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
    });
    expect(() => resolveMedia(media, "logo", publicDir)).toThrowError(ContentError);
    expect(() => resolveMedia(media, "logo", publicDir)).toThrowError(
      /^content\/media\.yaml → logo: \/media\/brand\/logo\.svg is not a readable image \(/,
    );
  });

  it("does not probe images whose size is written in media.yaml", () => {
    const { publicDir } = makeTree({ "public/media/brand/logo.png": "" });
    const sized = { logo: { src: "/media/brand/logo.png", alt: "Logo", width: 10, height: 10 } };
    expect(resolveMedia(sized, "logo", publicDir)).toMatchObject({ width: 10, height: 10 });
  });

  it("catches a folder-name letter-case mismatch that would break on the live server", () => {
    const { publicDir } = makeTree({ "public/media/brand/logo.svg": LOGO_SVG });
    const wrongCase = { logo: { src: "/media/Brand/logo.svg", alt: "Logo" } };
    expect(() => resolveMedia(wrongCase, "logo", publicDir)).toThrowError(ContentError);
    // Case-insensitive disks (Windows/macOS) report a case mismatch; case-sensitive ones report not found.
    expect(() => resolveMedia(wrongCase, "logo", publicDir)).toThrowError(
      /logo.*(case does not match: write "\/media\/brand\/logo\.svg"|file not found)/,
    );
  });

  it("catches a file-name letter-case mismatch", () => {
    const { publicDir } = makeTree({ "public/media/brand/logo.svg": LOGO_SVG });
    const wrongCase = { logo: { src: "/media/brand/Logo.SVG", alt: "Logo" } };
    expect(() => resolveMedia(wrongCase, "logo", publicDir)).toThrowError(
      /case does not match: write "\/media\/brand\/logo\.svg"|file not found/,
    );
  });

  it("rejects a src that points at a folder", () => {
    const { publicDir } = makeTree({ "public/media/brand.png/inner.txt": "x" });
    const dir = { logo: { src: "/media/brand.png", alt: "Logo" } };
    expect(() => resolveMedia(dir, "logo", publicDir)).toThrowError(ContentError);
    expect(() => resolveMedia(dir, "logo", publicDir)).toThrowError(/logo.*folder/);
  });

  it("rejects a src that escapes public/", () => {
    const { publicDir } = makeTree({ "secret.txt": "x", "public/a.txt": "x" });
    const escape = { logo: { src: "/../secret.txt", alt: "Logo" } };
    expect(() => resolveMedia(escape, "logo", publicDir)).toThrowError(ContentError);
    expect(() => resolveMedia(escape, "logo", publicDir)).toThrowError(/logo.*outside/);
  });
});

describe("verifyAllMedia", () => {
  it("throws on the first missing file", () => {
    const { publicDir } = makeTree({ "public/other.txt": "x" });
    expect(() => verifyAllMedia(media, publicDir)).toThrowError(/logo: file not found/);
  });
});

describe("toImageAsset", () => {
  it("returns width and height when present", () => {
    const resolved = { key: "logo", src: "/media/brand/logo.svg", alt: "Logo", width: 40, height: 40 };
    expect(toImageAsset(resolved)).toEqual({
      src: "/media/brand/logo.svg",
      alt: "Logo",
      width: 40,
      height: 40,
    });
  });

  it("throws ContentError naming the key when dimensions are missing", () => {
    const resolved = { key: "brochure", src: "/media/docs/brochure.pdf", alt: "Brochure" };
    expect(() => toImageAsset(resolved)).toThrowError(ContentError);
    expect(() => toImageAsset(resolved)).toThrowError(
      /content\/media\.yaml → brochure: \/media\/docs\/brochure\.pdf is not an image with a known size/,
    );
  });
});
