import { expect, test } from "@playwright/test";

test.describe("inner pages", () => {
  test("services directory renders all 13 services with working detail links", async ({ page }) => {
    await page.goto("/services/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const serviceCards = page.locator('main ol a[href^="/services/"][href$="/"]');
    await expect(serviceCards).toHaveCount(13);
  });

  test("service detail page renders metadata, scope, and navigation", async ({ page }) => {
    await page.goto("/services/environmental-clearance/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Environmental Clearance (EIA)");
    await expect(page.getByText("Scope & Engineering Methodology")).toBeVisible();
    await expect(page.getByRole("link", { name: /Next Service/i })).toBeVisible();
  });

  test("about page renders company profile and 5 branch offices", async ({ page }) => {
    await page.goto("/about/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("QCI NABET Category A Credentials")).toBeVisible();
    await expect(page.getByText("Five Strategic Regional Offices")).toBeVisible();
  });

  test("why us page renders competitive pillars", async ({ page }) => {
    await page.goto("/why-us/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("QCI NABET Category A Certified")).toBeVisible();
  });

  test("careers page renders openings and application channels", async ({ page }) => {
    await page.goto("/careers/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Current Vacancies")).toBeVisible();
  });

  test("downloads page renders official resources", async ({ page }) => {
    await page.goto("/downloads/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /Download Document/i }).first()).toBeVisible();
  });

  test("gallery page renders project and monitoring photo grid", async ({ page }) => {
    await page.goto("/gallery/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const images = page.locator("figure img");
    expect(await images.count()).toBeGreaterThanOrEqual(1);
  });

  test("contact page renders consultation form and office directory", async ({ page }) => {
    await page.goto("/contact/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/Full Name/i)).toBeVisible();
    await expect(page.getByLabel(/Service of Interest/i)).toBeVisible();
    await expect(page.getByText("Corporate Headquarters")).toBeVisible();
  });
});
