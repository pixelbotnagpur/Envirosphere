import { expect, test, type Page } from "@playwright/test";

const panel = (page: Page) => page.locator("[data-page-transition]");

/** Loads a page and waits for hydration, so the click handler is attached before the test clicks. */
async function open(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

/** Internal link that is visible at the current viewport (desktop nav or mobile menu). */
async function internalLink(page: Page, href: string) {
  const menu = page.locator("button[aria-controls='mobile-nav']");
  if (await menu.isVisible()) await menu.click();
  return page.locator(`a[href='${href}']:visible`).first();
}

test.describe("route curtain", () => {
  test("covers, navigates, reveals, and lands on main at the top", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      // Same exemption as home.spec.ts: the static host answers some RSC prefetch URLs with 404.
      if (m.type() === "error" && !m.text().includes("Failed to load resource")) errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));

    await open(page, "/");
    await expect(panel(page)).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 0));

    const link = await internalLink(page, "/services/");
    await link.click();

    await expect(panel(page)).toHaveCount(1);
    await expect(page).toHaveURL(/\/services\/$/);
    await expect(panel(page)).toHaveCount(0, { timeout: 5000 });

    await expect(page.locator("main#main")).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator("[data-route-announcer]")).not.toBeEmpty();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
  });

  test("browser back and forward work without the curtain", async ({ page }) => {
    await open(page, "/");
    const link = await internalLink(page, "/services/");
    await link.click();
    await expect(page).toHaveURL(/\/services\/$/);
    await expect(panel(page)).toHaveCount(0, { timeout: 5000 });

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(panel(page)).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(/\/services\/$/);
    await expect(panel(page)).toHaveCount(0);
  });

  test("modifier-click does not trigger the curtain", async ({ page, context }) => {
    await open(page, "/");
    const link = await internalLink(page, "/services/");
    const popup = context.waitForEvent("page");
    await link.click({ modifiers: ["Control"] });
    await popup.catch(() => null);
    await expect(panel(page)).toHaveCount(0);
  });
});

test.describe("route curtain with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("navigates immediately without a panel", async ({ page }) => {
    await open(page, "/");
    const link = await internalLink(page, "/services/");
    await link.click();
    await expect(page).toHaveURL(/\/services\/$/);
    await expect(panel(page)).toHaveCount(0);
  });
});
