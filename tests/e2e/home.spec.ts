import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("has every section and all 13 services", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.getByRole("heading", { level: 2 }).count()).toBeGreaterThanOrEqual(6);
    const serviceLinks = page.locator('a[href^="/services/"][href$="/"]').filter({ hasText: /^\d{3}/ });
    await expect(serviceLinks).toHaveCount(13);
  });

  test("scrolling the whole page raises no console errors or hydration warnings", async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (message) => {
      // Chromium logs network 404s for unbuilt inner pages (Plan 3) as console errors;
      // ignore those so we only catch true JavaScript exceptions and React hydration warnings.
      if (
        (message.type() === "error" || message.type() === "warning") &&
        !message.text().includes("Failed to load resource")
      ) {
        problems.push(message.text());
      }
    });
    page.on("pageerror", (error) => problems.push(error.message));
    await page.goto("/");
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    });
    expect(problems).toEqual([]);
  });

  test("content below the fold becomes visible after scrolling to it", async ({ page }) => {
    await page.goto("/");
    const contact = page.getByRole("heading", { level: 2 }).last();
    await contact.scrollIntoViewIfNeeded();
    await expect(contact).toBeVisible();
    await expect(page.locator("[data-reveal]").last()).toHaveCSS("opacity", /^(?:0\.99\d*|1)$/);
  });
});

test.describe("desktop hero", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the main call to action is inside the first screen", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /talk to our team/i })).toBeInViewport();
  });
});

test.describe("small phone", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("no horizontal scroll anywhere on the page", async ({ page }) => {
    await page.goto("/");
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
  });
});
