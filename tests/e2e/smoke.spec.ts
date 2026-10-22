import { expect, test } from "@playwright/test";

test("home renders the hero and the main menu", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const menuButton = page.getByRole("button", { name: "Open menu" });
  if (await menuButton.isVisible()) await menuButton.click();
  await expect(page.getByRole("link", { name: "Services" }).first()).toBeVisible();
});

test("content stays visible without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // toBeVisible() ignores opacity, and the SSR HTML carries an inline opacity:0 on
  // [data-reveal] elements. Only the <noscript> !important override makes them readable,
  // so assert the computed opacity explicitly.
  await expect(page.locator("[data-reveal]").first()).toHaveCSS("opacity", "1");
  await context.close();
});

test("skip link is the first tab stop and is not covered by the header", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();

  const box = await skip.boundingBox();
  expect(box).not.toBeNull();
  const topmostIsSkipLink = await page.evaluate(
    ({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      const link = document.querySelector('a[href="#main"]');
      return !!el && !!link && (el === link || link.contains(el));
    },
    { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
  );
  expect(topmostIsSkipLink).toBe(true);
});

test("home has no horizontal scroll", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
});

test("unknown pages show the 404 page", async ({ page }) => {
  const response = await page.goto("/does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("This page has moved or does not exist.")).toBeVisible();
});
