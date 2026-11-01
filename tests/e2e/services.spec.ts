import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { readContent, type ServicesContent } from "./helpers/content";

const detailCta = readContent<ServicesContent>("pages/services.yaml").serviceDetail.contact.primaryCta.label;

/** Reads a service file straight from content/services so the test follows the owner's edits. */
function readService(slug: string) {
  const raw = readFileSync(path.join(process.cwd(), "content", "services", `${slug}.md`), "utf8").replace(/\r\n/g, "\n");
  const [, front, body] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
  const title = /^title:\s*(.+)$/m.exec(front)?.[1].trim() ?? "";
  const firstParagraph = body.trim().split("\n\n")[0].replace(/[*_`#]/g, "").slice(0, 60).trim();
  return { title, firstParagraph };
}

const FIRST = "environmental-clearance"; // order 1: has a next service, no previous
const LAST = "water-audit"; // order 13: has a previous service, no next

for (const slug of [FIRST, LAST]) {
  test(`service page ${slug} shows its own title and the Markdown text`, async ({ page }) => {
    const { title, firstParagraph } = readService(slug);
    await page.goto(`/services/${slug}/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByText(firstParagraph, { exact: false }).first()).toBeVisible();
    await expect(page.getByText("TODO(content)")).toHaveCount(0);
    await expect(page.getByRole("link", { name: detailCta })).toBeVisible();
  });
}

test("first service links to the next one and has no previous link", async ({ page }) => {
  await page.goto(`/services/${FIRST}/`);
  await expect(page.locator('a[rel="prev"]')).toHaveCount(0);
  const next = page.locator('a[rel="next"]');
  await expect(next).toHaveCount(1);
  const href = await next.getAttribute("href");
  await next.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator('a[rel="prev"]')).toHaveAttribute("href", `/services/${FIRST}/`);
});

test("last service links back to the previous one and has no next link", async ({ page }) => {
  await page.goto(`/services/${LAST}/`);
  await expect(page.locator('a[rel="next"]')).toHaveCount(0);
  const prev = page.locator('a[rel="prev"]');
  await expect(prev).toHaveCount(1);
  const href = await prev.getAttribute("href");
  await prev.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("service body renders no bold text and no raw HTML tags", async ({ page }) => {
  await page.goto("/services/esg-audit/");
  const weights = await page.locator("main h3, main li, main p").evaluateAll((els) =>
    els.map((el) => Number(getComputedStyle(el).fontWeight)),
  );
  expect(weights.length).toBeGreaterThan(5);
  expect(Math.max(...weights)).toBeLessThanOrEqual(400);
});
