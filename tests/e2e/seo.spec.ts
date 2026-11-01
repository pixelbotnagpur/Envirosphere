import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/about/", "/services/", "/why-us/", "/careers/", "/contact/", "/gallery/", "/downloads/"];
// /downloads/ is left out of the sitemap while content/downloads.yaml is empty (a list holds only "[]").
const HAS_DOWNLOADS = readFileSync(path.join(process.cwd(), "content", "downloads.yaml"), "utf8")
  .split(/\r?\n/)
  .some((line) => line.trimStart().startsWith("- id:"));
// Every service route, derived from content/services/*.md so a new service is covered automatically.
const SERVICE_SLUGS = readdirSync(path.join(process.cwd(), "content", "services"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""));

for (const route of [...ROUTES, ...SERVICE_SLUGS.map((s) => `/services/${s}/`)]) {
  test(`SEO head of ${route}: one canonical, og:url = canonical, single brand suffix, raster og:image`, async ({ page, baseURL }) => {
    await page.goto(route);
    const canonicals = await page.locator('link[rel="canonical"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute("href")),
    );
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0]).toMatch(/^https:\/\/.+\/$/);
    expect(new URL(canonicals[0]!).pathname).toBe(route);

    const ogUrls = await page.locator('meta[property="og:url"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute("content")),
    );
    expect(ogUrls).toEqual(canonicals);

    const title = await page.title();
    expect(title.split("| Envirosphere").length - 1).toBeLessThanOrEqual(1);
    expect(title.length).toBeGreaterThan(0);
    if (route !== "/") expect(title).toMatch(/\| Envirosphere$/);

    const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(og).toMatch(/og-image\.jpg$/);
    const res = await page.request.get(new URL(new URL(og!).pathname, baseURL).toString());
    expect(res.ok()).toBe(true);
  });
}

test("sitemap lists /downloads/ only when content/downloads.yaml has entries", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.ok()).toBe(true);
  const xml = await res.text();
  expect(xml.includes("/downloads/")).toBe(HAS_DOWNLOADS);
});

test("the main menu has no Downloads link while there are no downloads", async ({ page }) => {
  await page.goto("/");
  const link = page.locator('header a[href="/downloads/"]');
  await expect(link).toHaveCount(HAS_DOWNLOADS ? 1 : 0);
});
