// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const layout = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");

describe("fonts (rule 31)", () => {
  it("imports exactly Manrope and Syne from next/font/google", () => {
    const match = layout.match(/import\s*\{([^}]+)\}\s*from\s*"next\/font\/google"/);
    expect(match).not.toBeNull();
    const names = match![1].split(",").map((n) => n.trim()).filter(Boolean).sort();
    expect(names).toEqual(["Manrope", "Syne"]);
  });

  it("loads Manrope in weights 300 and 400 only", () => {
    expect(layout).toMatch(/Manrope\(\{[^}]*weight:\s*\["300",\s*"400"\]/);
  });
});
