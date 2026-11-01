import { readdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/about/", "/services/", "/why-us/", "/careers/", "/contact/", "/gallery/", "/downloads/"];
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
