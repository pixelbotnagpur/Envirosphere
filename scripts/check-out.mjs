// Guards the production build: out/ must never contain test-only values.
// Run by `pnpm build` (postbuild) and on its own with `pnpm check:out [dir]`.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const TEXT_FILE = /\.(html|js|mjs|css|txt|json|xml|map|webmanifest)$/i;

/** Values that must never ship: the e2e dummy endpoint and Cloudflare's public dummy Turnstile keys. */
export const FORBIDDEN = [
  {
    label: "the e2e dummy forms endpoint (/macros/s/e2e/)",
    pattern: /\/macros\/s\/e2e\//,
  },
  {
    label: "a Cloudflare dummy Turnstile test key (1x000..AA / 2x000..AB / 3x000..FF)",
    pattern: /[123]x0{15,}[A-Z]{2}\b/,
  },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

/**
 * Scans a built site directory. Returns { ok, missing, problems } where each problem is
 * { file, label } (file is relative to dir, with forward slashes).
 */
export function checkOutDir(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return { ok: false, missing: true, problems: [] };
  }
  const problems = [];
  for (const file of walk(dir)) {
    if (!TEXT_FILE.test(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const { label, pattern } of FORBIDDEN) {
      if (pattern.test(text)) {
        problems.push({ file: path.relative(dir, file).split(path.sep).join("/"), label });
      }
    }
  }
  return { ok: problems.length === 0, missing: false, problems };
}

function main() {
  const dir = process.argv[2] ?? "out";
  const result = checkOutDir(dir);
  if (result.missing) {
    console.error(`\ncheck:out FAILED: the folder "${dir}" does not exist. Run "pnpm build" first.\n`);
    process.exit(1);
  }
  if (!result.ok) {
    console.error(`\ncheck:out FAILED: "${dir}" contains test-only values and must NOT be uploaded.`);
    for (const p of result.problems.slice(0, 10)) console.error(`  - ${p.label} in ${p.file}`);
    console.error(
      "\nFix: remove any test values from the environment (the shell and .env.local), then run \"pnpm build\" again.\n" +
        "Only the Playwright run uses the dummy endpoint, and it builds into .next-e2e, never out/.\n",
    );
    process.exit(1);
  }
  console.log(`check:out OK: no test-only values found in "${dir}".`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
