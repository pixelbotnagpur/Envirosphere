// @vitest-environment node
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { packageHostinger } from "../../scripts/package-hostinger.mjs";

const tmp = mkdtempSync(path.join(os.tmpdir(), "pkg-host-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

function project(name: string, files: Record<string, string>) {
  const dir = path.join(tmp, name);
  const all: Record<string, string> = {
    "package.json": JSON.stringify({ name: "envirosphere", version: "1.2.3", engines: { node: ">=24" }, dependencies: { next: "1" } }),
    "server.mjs": "// server",
    ...files,
  };
  for (const [rel, content] of Object.entries(all)) {
    const full = path.join(dir, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

const list = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? list(path.join(dir, e.name)).map((f) => `${e.name}/${f}`) : [e.name],
  );

describe("packageHostinger", () => {
  it("assembles hostinger-dist with out/, server.mjs and a minimal package.json only", () => {
    const dir = project("ok", { "out/index.html": "<html/>", "out/_next/static/a.js": "1" });
    const dest = packageHostinger({ rootDir: dir });
    expect(list(dest).sort()).toEqual(["out/_next/static/a.js", "out/index.html", "package.json", "server.mjs"]);
    const pkg = JSON.parse(readFileSync(path.join(dest, "package.json"), "utf8"));
    expect(pkg).toEqual({
      name: "envirosphere",
      version: "1.2.3",
      private: true,
      type: "module",
      scripts: { start: "node server.mjs" },
      engines: { node: ">=24" },
    });
  });

  it("replaces a previous hostinger-dist instead of mixing old files in", () => {
    const dir = project("again", { "out/index.html": "<html/>", "hostinger-dist/stale.txt": "old" });
    const dest = packageHostinger({ rootDir: dir });
    expect(list(dest)).not.toContain("stale.txt");
  });

  it("refuses when out/ is missing", () => {
    const dir = project("missing", {});
    expect(() => packageHostinger({ rootDir: dir })).toThrow(/pnpm build/);
  });

  it("refuses when check:out finds test-only values", () => {
    const dir = project("dirty", { "out/index.html": "https://script.google.com/macros/s/e2e/exec" });
    expect(() => packageHostinger({ rootDir: dir })).toThrow(/test-only/);
  });

  it("refuses when out/ has no index.html", () => {
    const dir = project("empty", { "out/robots.txt": "x" });
    expect(() => packageHostinger({ rootDir: dir })).toThrow(/index\.html/);
  });
});
