// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { duration, ease } from "@/lib/motion";
import { contrast, parseOklch } from "./helpers/oklch";

const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");

const tokens = new Map<string, string>();
for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
  // First definition wins so the @theme values are the ones tested (any later redefinition is ignored here; a separate test asserts --color-ring is defined only once).
  if (!tokens.has(match[1])) tokens.set(match[1], match[2].trim());
}

function resolve(name: string): string {
  const value = tokens.get(name);
  if (!value) throw new Error(`Token ${name} is not defined in globals.css`);
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  return ref ? resolve(ref[1]) : value;
}

const color = (name: string) => parseOklch(resolve(`--color-${name}`));

describe("semantic color pairs meet WCAG AA (4.5:1)", () => {
  const pairs: [string, string][] = [
    ["primary", "primary-foreground"],
    ["secondary", "secondary-foreground"],
    ["accent", "accent-foreground"],
    ["background", "foreground"],
    ["surface", "foreground"],
    ["background", "muted-foreground"],
    ["surface", "muted-foreground"],
    ["background", "destructive"],
    ["surface", "destructive"],
    ["primary", "secondary"],
  ];
  it.each(pairs)("%s vs %s", (a, b) => {
    expect(contrast(color(a), color(b))).toBeGreaterThanOrEqual(4.5);
  });
});

describe("focus ring meets WCAG 1.4.11 (3:1)", () => {
  it("ring vs background", () => {
    expect(contrast(color("ring"), color("background"))).toBeGreaterThanOrEqual(3);
  });
  it("ring vs surface", () => {
    expect(contrast(color("ring"), color("surface"))).toBeGreaterThanOrEqual(3);
  });
  it("ring vs secondary (the Forest outline on Sage)", () => {
    expect(contrast(color("ring"), color("secondary"))).toBeGreaterThanOrEqual(3);
  });
  it("ring vs accent (the Forest outline on Ochre)", () => {
    expect(contrast(color("ring"), color("accent"))).toBeGreaterThanOrEqual(3);
  });
  it("ring-offset vs primary (the Bone band on Forest sections)", () => {
    expect(contrast(color("ring-offset"), color("primary"))).toBeGreaterThanOrEqual(3);
  });
  it("the :focus-visible block uses both tokens (two-tone, WCAG C40)", () => {
    expect(css).toMatch(
      /:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-ring\)[^}]*box-shadow:\s*0 0 0 2px var\(--color-ring-offset\)/,
    );
  });
  it("--color-ring is defined exactly once (no per-section overrides)", () => {
    expect(css.match(/--color-ring\s*:/g)).toHaveLength(1);
  });
});

describe("palette roles exist", () => {
  it.each([
    "primary", "primary-foreground", "secondary", "secondary-foreground", "accent",
    "accent-foreground", "background", "foreground", "surface", "muted-foreground",
    "border", "ring", "ring-offset", "destructive",
  ])("--color-%s", (name) => {
    expect(() => color(name)).not.toThrow();
  });
});

describe("motion tokens mirror src/lib/motion.ts", () => {
  it("durations", () => {
    expect(tokens.get("--duration-fast")).toBe(`${duration.fast * 1000}ms`);
    expect(tokens.get("--duration-base")).toBe(`${duration.base * 1000}ms`);
    expect(tokens.get("--duration-slow")).toBe(`${duration.slow * 1000}ms`);
  });
  it("easings", () => {
    expect(tokens.get("--ease-out-expo")).toBe(`cubic-bezier(${ease.outExpo.join(", ")})`);
    expect(tokens.get("--ease-in-out-quart")).toBe(`cubic-bezier(${ease.inOutQuart.join(", ")})`);
  });
});

describe("fonts", () => {
  it("defines exactly the heading and body families", () => {
    const families = [...tokens.keys()].filter(
      (k) => k.startsWith("--font-") && k !== "--font-fraunces" && k !== "--font-manrope",
    );
    expect(families.sort()).toEqual(["--font-body", "--font-heading"]);
    expect(tokens.get("--font-heading")).toContain("var(--font-fraunces)");
    expect(tokens.get("--font-body")).toContain("var(--font-manrope)");
  });
});
