import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "pnpm build && pnpm preview",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // NEXT_PUBLIC_* values are baked in at build time. A dummy endpoint makes submitForm call
    // fetch(), which tests/e2e/forms.spec.ts intercepts; no Turnstile key keeps the widget off.
    env: {
      NEXT_PUBLIC_FORMS_ENDPOINT: "https://script.google.com/macros/s/e2e/exec",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
    },
  },
  use: { baseURL: "http://localhost:4173" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
