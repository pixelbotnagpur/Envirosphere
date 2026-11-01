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
    await expect(page.getByRole("link", { name: "Contact us" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Next Service/i })).toBeVisible();
  });

  test("about page lists the five offices from content", async ({ page }) => {
    await page.goto("/about/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "QCI NABET Accredited Consultant" })).toBeVisible();
    for (const city of ["Pune", "Mumbai", "Tarapur", "Nashik", "Nagpur"]) {
      await expect(page.getByRole("heading", { level: 3, name: city })).toBeVisible();
    }
  });

  test("why us page renders the pillars and the stats from content", async ({ page }) => {
    await page.goto("/why-us/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("QCI NABET Accredited Consultant (Cat A)").first()).toBeVisible();
    await expect(page.getByText("Ongoing projects")).toBeVisible();
  });

  test("careers page shows the general application while there are no openings", async ({ page }) => {
    await page.goto("/careers/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Current Vacancies")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send a general application" })).toBeVisible();
  });

  test("downloads page shows an honest empty state while there are no files", async ({ page }) => {
    await page.goto("/downloads/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("There are no documents to download yet.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Download Document/i })).toHaveCount(0);
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
    await expect(page.getByText("Head Office", { exact: true })).toBeVisible();
  });
});
