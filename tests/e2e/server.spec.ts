import { expect, test } from "@playwright/test";

// These run against the real server.mjs (not a generic static server), so they cover what Hostinger runs.

test("/about redirects to /about/ with a permanent redirect", async ({ request }) => {
  const res = await request.get("/about", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()["location"]).toBe("/about/");
});

test("unknown path returns a real 404 status with the 404 page", async ({ request }) => {
  const res = await request.get("/definitely-not-here/");
  expect(res.status()).toBe(404);
  expect(res.headers()["content-type"]).toContain("text/html");
  expect(await res.text()).toContain("<html");
});

test("home sends the security headers", async ({ request }) => {
  const res = await request.get("/");
  expect(res.status()).toBe(200);
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("default-src 'self'");
  expect(h["strict-transport-security"]).toMatch(/^max-age=\d+$/);
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["cache-control"]).toBe("no-cache");
});

test("hashed _next/static assets are immutable", async ({ request }) => {
  const html = await (await request.get("/")).text();
  const asset = /\/_next\/static\/[^"')\s]+\.(?:js|css)/.exec(html)?.[0];
  expect(asset).toBeTruthy();
  const res = await request.get(asset!);
  expect(res.status()).toBe(200);
  expect(res.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
});

test("/health answers ok", async ({ request }) => {
  const res = await request.get("/health");
  expect(res.status()).toBe(200);
  expect(await res.text()).toBe("ok");
});
