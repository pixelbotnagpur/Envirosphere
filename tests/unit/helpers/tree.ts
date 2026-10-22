import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const roots: string[] = [];

/** Removes every temp tree made by makeTree; registered once in tests/setup.ts. */
export function cleanupTrees() {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
}

/** Writes `files` (relative paths) into a fresh temp dir; use `content`/`publicDir` as roots. */
export function makeTree(files: Record<string, string>) {
  const root = mkdtempSync(path.join(os.tmpdir(), "envirosphere-"));
  roots.push(root);
  for (const [relative, text] of Object.entries(files)) {
    const file = path.join(root, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
  return { root, content: path.join(root, "content"), publicDir: path.join(root, "public") };
}
