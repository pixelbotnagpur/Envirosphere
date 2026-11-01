// @vitest-environment node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

// Image weight budget for public/media. Run `pnpm optimize:images` when this fails.
const MEDIA_ROOT = path.resolve("public/media");
const RASTER_BUDGET = 400 * 1024;
const TOTAL_BUDGET = 6 * 1024 * 1024;
const RASTER = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);

/** Files allowed to exceed RASTER_BUDGET, keyed by path under public/media, with the reason. */
const RASTER_EXCEPTIONS: Record<string, string> = {};

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
  );
}

const files = walk(MEDIA_ROOT).map((file) => ({
  rel: path.relative(MEDIA_ROOT, file).split(path.sep).join("/"),
  size: statSync(file).size,
}));

describe("media weight budget", () => {
  it("keeps every raster image under 400 KB unless documented", () => {
    const heavy = files
      .filter(
        ({ rel, size }) => RASTER.has(path.extname(rel).toLowerCase()) && size > RASTER_BUDGET,
      )
      .filter(({ rel }) => !(rel in RASTER_EXCEPTIONS))
      .map(({ rel, size }) => `${rel} (${Math.round(size / 1024)} KB)`);
    expect(heavy, "run pnpm optimize:images, or document an exception with a reason").toEqual([]);
  });

  it("documents a reason for every exception, and the file still exists", () => {
    for (const [rel, reason] of Object.entries(RASTER_EXCEPTIONS)) {
      expect(reason.trim().length, rel).toBeGreaterThan(10);
      expect(
        files.some((file) => file.rel === rel),
        `${rel} no longer exists; remove the exception`,
      ).toBe(true);
    }
  });

  it("keeps public/media under 6 MB in total", () => {
    const total = files.reduce((sum, { size }) => sum + size, 0);
    expect(total, `public/media is ${(total / 1024 / 1024).toFixed(1)} MB`).toBeLessThanOrEqual(
      TOTAL_BUDGET,
    );
  });

  it("only references files that exist from content/media.yaml", () => {
    const media = parse(readFileSync("content/media.yaml", "utf8")) as Record<
      string,
      { src: string }
    >;
    const missing = Object.entries(media)
      .filter(([, { src }]) => !existsSync(path.join("public", src)))
      .map(([key, { src }]) => `${key} -> ${src}`);
    expect(missing).toEqual([]);
  });
});
