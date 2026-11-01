// Launch gate: fails with plain messages when the forms would not work (or would be unprotected)
// in the production build. Run before every production build: `pnpm check:launch`.
// Reads process.env first, then .env.local, then .env (the same order Next.js uses).
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DUMMY_TURNSTILE_KEY = /^[123]x0{15,}[A-Z]{2}$/;

/** Parses KEY=value lines (comments and blank lines ignored, optional surrounding quotes removed). */
export function parseEnvFile(text) {
  const out = {};
  for (const line of String(text).split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match || match[1] === undefined) continue;
    let value = match[2] ?? "";
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, "");
    out[match[1]] = value;
  }
  return out;
}

/** Pure check of an env object. Returns { ok, problems } where problems are plain-language lines. */
export function checkLaunchEnv(env) {
  const problems = [];
  const endpoint = (env.NEXT_PUBLIC_FORMS_ENDPOINT ?? "").trim();
  const siteKey = (env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();

  if (!endpoint) {
    problems.push(
      "NEXT_PUBLIC_FORMS_ENDPOINT is missing. Without it the contact and job forms cannot send anything. " +
        "Put the Apps Script Web App URL (ending in /exec) in .env.local (see integrations/google-sheets/SETUP.md, Step 6).",
    );
  } else if (endpoint.includes("/macros/s/e2e/")) {
    problems.push(
      "NEXT_PUBLIC_FORMS_ENDPOINT is the test endpoint (/macros/s/e2e/). Replace it with your real Apps Script Web App URL.",
    );
  } else if (!/^https:\/\//.test(endpoint)) {
    problems.push("NEXT_PUBLIC_FORMS_ENDPOINT must start with https://.");
  }

  if (!siteKey) {
    problems.push(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing. The bot check is a launch requirement: without it anyone can " +
        "flood the forms and the CV upload. Create the Turnstile widget and put its Site key in .env.local " +
        "(see integrations/google-sheets/SETUP.md, Step 7).",
    );
  } else if (DUMMY_TURNSTILE_KEY.test(siteKey)) {
    problems.push(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY is one of Cloudflare's dummy test keys. Use the real Site key from your Turnstile widget.",
    );
  }

  return { ok: problems.length === 0, problems };
}

function loadEnv(cwd) {
  const merged = {};
  for (const file of [".env", ".env.local"]) {
    const full = path.join(cwd, file);
    if (existsSync(full)) Object.assign(merged, parseEnvFile(readFileSync(full, "utf8")));
  }
  for (const key of ["NEXT_PUBLIC_FORMS_ENDPOINT", "NEXT_PUBLIC_TURNSTILE_SITE_KEY"]) {
    if (process.env[key] !== undefined) merged[key] = process.env[key];
  }
  return merged;
}

function main() {
  const result = checkLaunchEnv(loadEnv(process.cwd()));
  if (!result.ok) {
    console.error("\ncheck:launch FAILED. Do not build or upload the site for launch yet:\n");
    for (const p of result.problems) console.error(`  - ${p}\n`);
    process.exit(1);
  }
  console.log("check:launch OK: forms endpoint and Turnstile site key are set.");
  console.log("Reminder: TURNSTILE_SECRET must also be set in the Apps Script (SETUP.md, Step 4); this script cannot check that.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
