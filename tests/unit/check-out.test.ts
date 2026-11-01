// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { checkOutDir } from "../../scripts/check-out.mjs";

const root = mkdtempSync(path.join(os.tmpdir(), "check-out-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

function fixture(name: string, files: Record<string, string>) {
  const dir = path.join(root, name);
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

describe("checkOutDir", () => {
  it("passes a clean build, including the real Turnstile script URL", () => {
    const dir = fixture("clean", {
      "index.html": "<html>https://script.google.com/macros/s/AKfycbxREAL/exec</html>",
      "_next/static/a.js": 'load("https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit")',
    });
    expect(checkOutDir(dir)).toEqual({ ok: true, missing: false, problems: [] });
  });

  it("fails when the e2e dummy endpoint is baked in, naming the file", () => {
    const dir = fixture("e2e", {
      "index.html": "<html></html>",
      "_next/static/chunks/x.js": 'fetch("https://script.google.com/macros/s/e2e/exec")',
    });
    const r = checkOutDir(dir);
    expect(r.ok).toBe(false);
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0]?.file).toBe("_next/static/chunks/x.js");
    expect(r.problems[0]?.label).toContain("/macros/s/e2e/");
  });

  it("fails on Cloudflare's dummy Turnstile test keys (site and secret forms)", () => {
    for (const key of ["1x00000000000000000000AA", "2x00000000000000000000AB", "3x00000000000000000000FF", "1x0000000000000000000000000000000AA"]) {
      const dir = fixture("key-" + key.slice(0, 2) + key.length, { "a.js": `sitekey:"${key}"` });
      expect(checkOutDir(dir).ok, key).toBe(false);
    }
  });

  it("ignores binary files and reports a missing folder", () => {
    const dir = fixture("bin", { "photo.jpg": "/macros/s/e2e/", "index.html": "ok" });
    expect(checkOutDir(dir).ok).toBe(true);
    expect(checkOutDir(path.join(root, "nope"))).toEqual({ ok: false, missing: true, problems: [] });
  });
});
