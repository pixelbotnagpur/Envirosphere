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

const REAL = "https://script.google.com/macros/s/AKfycbyREAL123/exec";
const KEY = "0x4AAAAAAAreal_site_key";
const ENV = { NEXT_PUBLIC_FORMS_ENDPOINT: REAL, NEXT_PUBLIC_TURNSTILE_SITE_KEY: KEY };
const BUNDLE = { "out/index.html": "<html/>", "out/_next/static/a.js": `x="${REAL}";y="${KEY}"` };

const list = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? list(path.join(dir, e.name)).map((f) => `${e.name}/${f}`) : [e.name],
  );

describe("packageHostinger", () => {
  it("assembles hostinger-dist with out/, server.mjs and a minimal package.json only", () => {
    const dir = project("ok", BUNDLE);
    const dest = packageHostinger({ rootDir: dir, env: ENV });
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
    const dir = project("again", { ...BUNDLE, "hostinger-dist/stale.txt": "old" });
    const dest = packageHostinger({ rootDir: dir, env: ENV });
    expect(list(dest)).not.toContain("stale.txt");
  });

  it("refuses when out/ is missing", () => {
    const dir = project("missing", {});
    expect(() => packageHostinger({ rootDir: dir, env: ENV })).toThrow(/pnpm build/);
  });

  it("refuses when check:out finds test-only values", () => {
    const dir = project("dirty", { "out/index.html": "https://script.google.com/macros/s/e2e/exec" });
    expect(() => packageHostinger({ rootDir: dir, env: ENV })).toThrow(/test-only/);
  });

  it("refuses when out/ has no index.html", () => {
    const dir = project("empty", { "out/robots.txt": "x" });
    expect(() => packageHostinger({ rootDir: dir, env: ENV })).toThrow(/index\.html/);
  });

  it("fails when the built site has no real forms endpoint", () => {
    const dir = project("noep", { "out/index.html": "<html/>", "out/a.js": `y="${KEY}"` });
    expect(() => packageHostinger({ rootDir: dir, env: ENV })).toThrow(/forms endpoint/);
  });

  it("fails when the built site uses the e2e endpoint", () => {
    const dir = project("e2eep", { "out/index.html": "<html/>", "out/a.js": `x="https://script.google.com/macros/s/e2e/exec";y="${KEY}"` });
    expect(() => packageHostinger({ rootDir: dir, env: ENV })).toThrow(/test-only/);
  });

  it("fails when the bundle was built with a different endpoint than the settings", () => {
    const dir = project("otherep", { "out/index.html": "<html/>", "out/a.js": `x="https://script.google.com/macros/s/OLD/exec";y="${KEY}"` });
    expect(() => packageHostinger({ rootDir: dir, env: ENV })).toThrow(/different forms endpoint/);
  });

  it("fails when the Turnstile key is not set", () => {
    const dir = project("nokey", BUNDLE);
    expect(() => packageHostinger({ rootDir: dir, env: { NEXT_PUBLIC_FORMS_ENDPOINT: REAL } })).toThrow(/TURNSTILE_SITE_KEY is missing/);
  });

  it("fails when the Turnstile key is not in the built site", () => {
    const dir = project("keynotbuilt", { "out/index.html": "<html/>", "out/a.js": `x="${REAL}"` });
    expect(() => packageHostinger({ rootDir: dir, env: ENV })).toThrow(/Turnstile site key/);
  });

  it("--allow-missing-forms skips the checks with a loud warning", () => {
    const dir = project("dry", { "out/index.html": "<html/>" });
    const warnings: string[] = [];
    packageHostinger({ rootDir: dir, env: {}, allowMissingForms: true, onWarn: (m) => warnings.push(m) });
    expect(warnings.join(" ")).toMatch(/WARNING.*dry run/);
  });

  it("--allow-missing-forms still refuses test-only values", () => {
    const dir = project("drytest", { "out/index.html": "<html/>" });
    expect(() =>
      packageHostinger({ rootDir: dir, env: { NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" }, allowMissingForms: true }),
    ).toThrow(/Test-only/);
    const dirty = project("drytest2", { "out/index.html": "https://script.google.com/macros/s/e2e/exec" });
    expect(() => packageHostinger({ rootDir: dirty, env: {}, allowMissingForms: true })).toThrow(/test-only/);
  });
});
