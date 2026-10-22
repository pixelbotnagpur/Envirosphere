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
  it("no bold-ish font weights (body weight ≤ 400)", () => {
    expect(offenders(/font-(medium|semibold|bold|extrabold|black)\b/)).toEqual([]);
  });

  it("no sparkle icons or emoji", () => {
    expect(offenders(/Sparkle|WandSparkles|✨/)).toEqual([]);
  });

  it("no raw hex colors in components or pages (tokens only)", () => {
    expect(offenders(/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/, /\.tsx?$/)).toEqual([]);
  });

  it("no arbitrary pixel values in classes", () => {
    expect(offenders(/\[\d+(\.\d+)?px\]/, /\.tsx?$/)).toEqual([]);
  });

  it("no component-level focus styles (the base two-tone ring must not be overridden)", () => {
    expect(offenders(/focus(-visible)?:(ring|shadow|outline)/, /\.tsx?$/)).toEqual([]);
  });

  it("no framer-motion imports", () => {
    expect(offenders(/from\s+"framer-motion"/)).toEqual([]);
  });

  it("no server-only features that break the static export", () => {
    expect(offenders(/"use server"|from\s+"next\/headers"|NextResponse/)).toEqual([]);
  });
});
