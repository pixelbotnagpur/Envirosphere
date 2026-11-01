import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const fromRoot = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@tests": fromRoot("./tests"), "@": fromRoot("./src") } },
  test: {
    environment: "jsdom",
    globals: true,
    // Form tests type character by character; the default 5s flakes when the whole suite runs in parallel.
    testTimeout: 15_000,
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
  },
});
