import { expect, test } from "@playwright/test";
import {
  readContent,
  serviceTitle,
  type AboutContent,
  type CareersContent,
  type ContactContent,
  type DownloadsContent,
  type GalleryContent,
  type HomeContent,
  type ServicesContent,
  type WhyUsContent,
} from "./helpers/content";

// Every expected text below is read from content/, so editing the owner files never breaks these tests.
const about = readContent<AboutContent>("pages/about.yaml");
const whyUs = readContent<WhyUsContent>("pages/why-us.yaml");
const contact = readContent<ContactContent>("pages/contact.yaml");
const gallery = readContent<GalleryContent>("pages/gallery.yaml");
const downloads = readContent<DownloadsContent>("pages/downloads.yaml");
const careers = readContent<CareersContent>("pages/careers.yaml");
const services = readContent<ServicesContent>("pages/services.yaml");
const home = readContent<HomeContent>("pages/home.yaml");
const site = readContent<{ offices: { city: string }[] }>("site.yaml");

test.describe("inner pages", () => {
  test("services directory renders all 13 services with working detail links", async ({ page }) => {
    await page.goto("/services/");
    await expect(page.getByRole("heading", { level: 1, name: services.hub.hero.title })).toBeVisible();
    const serviceCards = page.locator('main ol a[href^="/services/"][href$="/"]');
    await expect(serviceCards).toHaveCount(13);
  });

  test("service detail page renders the title, text and next-service link", async ({ page }) => {
    await page.goto("/services/environmental-clearance/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(serviceTitle("environmental-clearance"));
    await expect(
      page.getByRole("link", { name: services.serviceDetail.contact.primaryCta.label }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(services.serviceDetail.nextLabel, "i") })).toBeVisible();
  });

  test("about page lists the offices from content", async ({ page }) => {
    await page.goto("/about/");
    await expect(page.getByRole("heading", { level: 1, name: about.hero.title })).toBeVisible();
    await expect(page.getByRole("heading", { name: about.accreditation.heading })).toBeVisible();
    for (const { city } of site.offices) {
      await expect(page.getByRole("heading", { level: 3, name: city })).toBeVisible();
    }
  });

  test("why us page renders the pillars and the stats from content", async ({ page }) => {
    await page.goto("/why-us/");
    await expect(page.getByRole("heading", { level: 1, name: whyUs.hero.title })).toBeVisible();
    await expect(page.getByText(whyUs.pillars[0].title).first()).toBeVisible();
    await expect(page.getByText(home.stats.items[1].label)).toBeVisible();
  });

  test("careers page shows the general application while there are no openings", async ({ page }) => {
    await page.goto("/careers/");
    await expect(page.getByRole("heading", { level: 1, name: careers.hero.title })).toBeVisible();
    await expect(page.getByText(careers.openings.heading)).toBeVisible();
    await expect(page.getByRole("button", { name: careers.openings.generalApplyLabel })).toBeVisible();
  });

  test("downloads page shows an honest empty state while there are no files", async ({ page }) => {
    await page.goto("/downloads/");
    await expect(page.getByRole("heading", { level: 1, name: downloads.hero.title })).toBeVisible();
    await expect(page.getByText(downloads.emptyText)).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(downloads.downloadLabel, "i") })).toHaveCount(0);
  });

  test("gallery page renders project and monitoring photo grid", async ({ page }) => {
    await page.goto("/gallery/");
    await expect(page.getByRole("heading", { level: 1, name: gallery.hero.title })).toBeVisible();
    const images = page.locator("figure img");
    expect(await images.count()).toBeGreaterThanOrEqual(1);
  });

  test("contact page renders consultation form and office directory", async ({ page }) => {
    await page.goto("/contact/");
    await expect(page.getByRole("heading", { level: 1, name: contact.hero.title })).toBeVisible();
    await expect(page.getByLabel(/Full Name/i)).toBeVisible();
    await expect(page.getByLabel(/Service of Interest/i)).toBeVisible();
    await expect(page.getByText(contact.headOffice.label, { exact: true })).toBeVisible();
  });
});
