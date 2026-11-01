// Assembles a clean `hostinger-dist/` folder: exactly what must be uploaded to Hostinger's Node.js app.
// Run with `pnpm package:hostinger` after `pnpm build`. Refuses to run if out/ is missing or fails check:out.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { checkOutDir } from "./check-out.mjs";
import { checkLaunchEnv, DUMMY_TURNSTILE_KEY, loadEnv } from "./check-launch.mjs";

const TEXT_FILE = /\.(html|js|mjs|css|txt|json)$/i;
const ENDPOINT_RE = /https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/g;

function walkText(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walkText(full);
    return TEXT_FILE.test(e.name) ? [readFileSync(full, "utf8")] : [];
  });
}

/**
 * NEXT_PUBLIC_* values are baked into the built files, so the built site itself is checked:
 * it must contain the real forms endpoint and the configured Turnstile site key.
 */
function bundleProblems(out, env) {
  const text = walkText(out).join("\n");
  const problems = [];
  const endpoints = [...new Set(text.match(ENDPOINT_RE) ?? [])];
  const configured = (env.NEXT_PUBLIC_FORMS_ENDPOINT ?? "").trim();
  if (endpoints.length === 0) {
    problems.push(
      'The built site does not contain the real forms endpoint (a "https://script.google.com/macros/s/.../exec" address), ' +
        'so the forms would not work. Set NEXT_PUBLIC_FORMS_ENDPOINT in .env.local, then run "pnpm build" again.',
    );
  } else if (configured && !endpoints.includes(configured)) {
    problems.push(
      'The built site uses a different forms endpoint than the one in your settings. Run "pnpm build" again with the current settings.',
    );
  }
  const key = (env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();
  if (key && !text.includes(key)) {
    problems.push(
      'The built site does not contain your Turnstile site key, so the bot check would be missing. Run "pnpm build" again with NEXT_PUBLIC_TURNSTILE_SITE_KEY set.',
    );
  }
  return problems;
}

/** Test-only values in the settings are refused even for dry runs. */
function testOnlyEnvProblems(env) {
  const problems = [];
  if ((env.NEXT_PUBLIC_FORMS_ENDPOINT ?? "").includes("/macros/s/e2e/")) problems.push("NEXT_PUBLIC_FORMS_ENDPOINT is the test endpoint.");
  if (DUMMY_TURNSTILE_KEY.test((env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim())) {
    problems.push("NEXT_PUBLIC_TURNSTILE_SITE_KEY is a Cloudflare dummy test key.");
  }
  return problems;
}

/**
 * Builds hostinger-dist next to `rootDir`. Returns the destination path; throws a friendly Error on problems.
 * `env` must be the same settings that produced out/ (default: process.env, then .env.local, then .env).
 * `allowMissingForms` is for dry runs only: it skips the forms/Turnstile checks (never the test-value checks).
 */
export function packageHostinger({
  rootDir = process.cwd(),
  outName = "out",
  destName = "hostinger-dist",
  env = loadEnv(rootDir),
  allowMissingForms = false,
  onWarn = () => {},
} = {}) {
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

  if (allowMissingForms) {
    const testOnly = testOnlyEnvProblems(env);
    if (testOnly.length > 0) {
      throw new Error(`Test-only values are never allowed, even with --allow-missing-forms. ${testOnly.join(" ")}`);
    }
    onWarn(
      "WARNING: --allow-missing-forms is on. The forms endpoint and the Turnstile bot check were NOT verified. " +
        "This folder is for a dry run only. Do NOT upload it for the live site.",
    );
  } else {
    const problems = [...checkLaunchEnv(env).problems, ...bundleProblems(out, env)];
    if (problems.length > 0) {
      throw new Error(
        "The launch settings are not ready, so no upload folder was made:\n" + problems.map((p) => `  - ${p}`).join("\n"),
      );
    }
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
    const dest = packageHostinger({
      allowMissingForms: process.argv.includes("--allow-missing-forms"),
      onWarn: (m) => console.warn(`\n!!! ${m}\n`),
    });
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
