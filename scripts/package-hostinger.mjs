// Assembles a clean `hostinger-dist/` folder: exactly what must be uploaded to Hostinger's Node.js app.
// Run with `pnpm package:hostinger` after `pnpm build`. Refuses to run if out/ is missing or fails check:out.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { checkOutDir } from "./check-out.mjs";

/** Builds hostinger-dist next to `rootDir`. Returns the destination path; throws a friendly Error on problems. */
export function packageHostinger({ rootDir = process.cwd(), outName = "out", destName = "hostinger-dist" } = {}) {
  const out = path.join(rootDir, outName);
  const check = checkOutDir(out);
  if (check.missing) throw new Error(`The "${outName}" folder does not exist. Run "pnpm build" first.`);
  if (!check.ok) {
    const list = check.problems.slice(0, 5).map((p) => `${p.label} in ${p.file}`).join("; ");
    throw new Error(`"${outName}" contains test-only values and must NOT be uploaded (${list}). Rebuild with "pnpm build".`);
  }
  if (!existsSync(path.join(out, "index.html"))) {
    throw new Error(`"${outName}" has no index.html. Run "pnpm build" again.`);
  }

  const source = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));
  const dest = path.join(rootDir, destName);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(out, path.join(dest, "out"), { recursive: true });
  cpSync(path.join(rootDir, "server.mjs"), path.join(dest, "server.mjs"));
  const minimal = {
    name: source.name,
    version: source.version,
    private: true,
    type: "module",
    scripts: { start: "node server.mjs" },
    engines: source.engines,
  };
  writeFileSync(path.join(dest, "package.json"), JSON.stringify(minimal, null, 2) + "\n");
  return dest;
}

function listFiles(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))],
  );
}

function main() {
  try {
    const dest = packageHostinger();
    const files = listFiles(dest).map((f) => f.split(path.sep).join("/"));
    const top = files.filter((f) => !f.startsWith("out/"));
    console.log(`\npackage:hostinger OK. Upload the contents of "${path.basename(dest)}":`);
    for (const f of top) console.log(`  ${f}`);
    console.log(`  out/  (${files.length - top.length} files)\n`);
  } catch (err) {
    console.error(`\npackage:hostinger FAILED: ${err instanceof Error ? err.message : err}\n`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
