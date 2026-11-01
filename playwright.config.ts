import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    // Builds into .next-e2e (see NEXT_DIST_DIR in next.config.ts) and serves that folder, so the
    // dummy endpoint below never touches the real out/ that gets uploaded. `next build` is called
    // directly: the postbuild guard (check:out) belongs to `pnpm build` only.
    command: "pnpm content:check && pnpm exec next build && pnpm exec serve .next-e2e -l 4174",
    url: "http://localhost:4174",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // NEXT_PUBLIC_* values are baked in at build time. A dummy endpoint makes submitForm call
    // fetch(), which tests/e2e/forms.spec.ts intercepts; no Turnstile key keeps the widget off.
    env: {
      NEXT_DIST_DIR: ".next-e2e",
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
