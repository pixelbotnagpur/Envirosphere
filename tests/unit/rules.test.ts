// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.join(process.cwd(), "src");
const files = (readdirSync(root, { recursive: true }) as string[])
  .filter((f) => /\.(ts|tsx|css)$/.test(f) && !/\.test\./.test(f))
  .map((f) => ({ file: f, text: readFileSync(path.join(root, f), "utf8") }));

const offenders = (pattern: RegExp, only?: RegExp) =>
  files
    .filter(({ file }) => (only ? only.test(file) : true))
    .filter(({ text }) => pattern.test(text))
    .map(({ file }) => file);

describe("project rules are enforced in src/", () => {
  it("scans a meaningful number of source files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("no bold-ish font weights (body weight ≤ 400)", () => {
    expect(offenders(/font-(medium|semibold|bold|extrabold|black)\b/)).toEqual([]);
    expect(offenders(/font-\[\d+\]/)).toEqual([]);
    expect(offenders(/font-\[weight:/)).toEqual([]);
    expect(offenders(/fontWeight/)).toEqual([]);
  });

  it("no heavy font-weight declarations in our CSS", () => {
    // Tailwind's preflight (b, strong) lives in node_modules, not in src/**/*.css.
    expect(offenders(/font-weight:\s*(?:[5-9]00|bold|bolder)\b/, /\.css$/)).toEqual([]);
  });

  it("no sparkle icons or emoji (any casing)", () => {
    expect(offenders(/sparkle|✨/i)).toEqual([]);
  });

  it("no raw hex colors in components or pages (tokens only)", () => {
    expect(offenders(/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/, /\.tsx?$/)).toEqual([]);
  });

  it("no color functions in components or pages (tokens only)", () => {
    expect(offenders(/\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/, /\.tsx?$/)).toEqual([]);
    expect(offenders(/\bcolor\(/, /\.tsx?$/)).toEqual([]);
  });

  it("no primitive palette utilities in components (use semantic tokens)", () => {
    expect(
      offenders(
        /\b(?:bg|text|border|ring|outline|fill|stroke|from|to|via|decoration|divide|accent|caret|shadow)-(?:forest|bone|sand|linen|sage|ochre|lichen|clay|bark)-\d/,
        /\.tsx$/,
      ),
    ).toEqual([]);
  });

  it("no arbitrary pixel values in classes", () => {
    expect(offenders(/\[\d+(\.\d+)?px\]/, /\.tsx?$/)).toEqual([]);
  });

  it("no component-level focus styles (the base two-tone ring must not be overridden)", () => {
    expect(
      offenders(/\b(?:focus|focus-visible|focus-within):-?(?:ring|shadow|outline)/, /\.tsx?$/),
    ).toEqual([]);
    expect(offenders(/\boutline-(?:none|hidden|0)\b/, /\.tsx?$/)).toEqual([]);
  });

  it("no font-mono (exactly two font families)", () => {
    expect(offenders(/(?<![\w-])font-mono\b/, /\.tsx?$/)).toEqual([]);
  });

  it("no Tailwind default radius utilities (use rounded-control|card|pill)", () => {
    expect(
      offenders(
        /(?<![\w-])rounded(?:-[trblse]{1,2})?-(?:xs|sm|md|lg|xl|2xl|3xl|4xl|full)\b/,
        /\.tsx?$/,
      ),
    ).toEqual([]);
  });

  it("no Tailwind default shadow utilities (use shadow-card)", () => {
    expect(
      offenders(/(?<![\w-])shadow-(?:2xs|xs|sm|md|lg|xl|2xl|inner)\b/, /\.tsx$/),
    ).toEqual([]);
  });

  it("no Tailwind default text-size utilities (use text-mega|display|h1..h4|lead|base|sm|label|micro)", () => {
    expect(
      offenders(/(?<![\w-])text-(?:xs|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/, /\.tsx$/),
    ).toEqual([]);
  });

  it("no dead classes that Tailwind never generates for our tokens", () => {
    expect(offenders(/(?<![\w-])bg-muted\b/, /\.tsx$/)).toEqual([]);
    expect(offenders(/(?<![\w-])duration-base\b/, /\.tsx$/)).toEqual([]);
    expect(offenders(/bg-destructive\/5\b|border-destructive\/30\b/, /\.tsx$/)).toEqual([]);
  });

  it("ui and motion never import content, sections or app (rule 70)", () => {
    const forbidden = ["lib/content", "components/sections", "app"].map((d) => path.join(root, d));
    const bad: string[] = [];
    for (const { file, text } of files) {
      const normalised = file.replace(/\\/g, "/");
      if (!/^components\/(ui|motion)\//.test(normalised)) continue;
      for (const m of text.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
        const spec = m[1];
        const target = spec.startsWith("@/")
          ? path.join(root, spec.slice(2))
          : spec.startsWith(".")
            ? path.resolve(root, path.dirname(file), spec)
            : null;
        if (!target) continue;
        if (forbidden.some((f) => target === f || target.startsWith(f + path.sep))) {
          bad.push(`${normalised} -> ${spec}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("no framer-motion imports", () => {
    expect(offenders(/from\s+"framer-motion"/)).toEqual([]);
  });

  it("no server-only features that break the static export", () => {
    expect(offenders(/"use server"|from\s+"next\/headers"|NextResponse/)).toEqual([]);
  });
});
