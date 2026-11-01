import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    // Builds into .next-e2e (see NEXT_DIST_DIR in next.config.ts) and serves that folder with the real
    // server.mjs (the same server Hostinger runs), so the dummy endpoint below never touches the real
    // out/ that gets uploaded. `next build` is called directly: the postbuild guard (check:out)
    // belongs to `pnpm build` only. /health is the readiness probe.
    command: "pnpm content:check && pnpm exec next build && node server.mjs",
    url: "http://localhost:4174/health",
    // Never reuse a running server: a stale one could serve old build output.
    reuseExistingServer: false,
    timeout: 180_000,
    // NEXT_PUBLIC_* values are baked in at build time. A dummy endpoint makes submitForm call
    // fetch(), which tests/e2e/forms.spec.ts intercepts; no Turnstile key keeps the widget off.
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      SITE_ROOT: ".next-e2e",
      PORT: "4174",
      NEXT_PUBLIC_FORMS_ENDPOINT: "https://script.google.com/macros/s/e2e/exec",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
    },
  },
  use: { baseURL: "http://localhost:4174" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
