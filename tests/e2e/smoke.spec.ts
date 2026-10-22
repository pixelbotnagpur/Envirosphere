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
  await context.close();
});

test("unknown pages show the 404 page", async ({ page }) => {
  await page.goto("/does-not-exist/");
  await expect(page.getByText("This page has moved or does not exist.")).toBeVisible();
});
