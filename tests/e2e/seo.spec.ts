import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/about/", "/services/", "/why-us/", "/careers/", "/contact/", "/gallery/", "/downloads/"];
const SERVICE_SAMPLE = ["environmental-clearance", "water-wastewater-treatment"];

for (const route of [...ROUTES, ...SERVICE_SAMPLE.map((s) => `/services/${s}/`)]) {
  test(`SEO head of ${route}: one canonical, single brand suffix, raster og:image`, async ({ page, baseURL }) => {
    await page.goto(route);
    const canonicals = await page.locator('link[rel="canonical"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute("href")),
    );
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0]).toMatch(/^https:\/\/.+\/$/);
    expect(new URL(canonicals[0]!).pathname).toBe(route);

    const title = await page.title();
    expect(title.split("| Envirosphere").length - 1).toBeLessThanOrEqual(1);
    if (route !== "/") expect(title).toMatch(/\| Envirosphere$/);

    const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(og).toMatch(/og-image\.jpg$/);
    const res = await page.request.get(new URL(new URL(og!).pathname, baseURL).toString());
    expect(res.ok()).toBe(true);
  });
}
