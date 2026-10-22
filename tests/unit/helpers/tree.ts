import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/** Writes `files` (relative paths) into a fresh temp dir; use `content`/`publicDir` as roots. */
export function makeTree(files: Record<string, string>) {
  const root = mkdtempSync(path.join(os.tmpdir(), "envirosphere-"));
  for (const [relative, text] of Object.entries(files)) {
    const file = path.join(root, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
  return { root, content: path.join(root, "content"), publicDir: path.join(root, "public") };
}
