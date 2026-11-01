import { expect, test } from "@playwright/test";

/** The server contract: elapsed ms measured by the browser, never an absolute timestamp. */
function expectFillMsContract(postData: string | null) {
  const body = JSON.parse(postData ?? "{}") as Record<string, unknown>;
  expect(Number.isInteger(body.fillMs)).toBe(true);
  expect(body.fillMs as number).toBeGreaterThanOrEqual(3000);
  expect(body).not.toHaveProperty("formLoadedAt");
}

test.describe("consultation inquiry form", () => {
  test("submits inquiry successfully and displays confirmation state", async ({ page }) => {
    // Intercept form submission endpoint
    const requests: (string | null)[] = [];
    await page.route("**/macros/s/**/exec", async (route) => {
      requests.push(route.request().postData());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Inquiry successfully recorded in Google Sheets.",
        }),
      });
    });

    await page.goto("/contact/");

    // Fill form fields
    await page.locator('#inquiry-name').fill("Anand Mahajan");
    await page.locator('#inquiry-org').fill("Godavari Paper Mills");
    await page.locator('#inquiry-email').fill("anand@godavaripaper.com");
    await page.locator('#inquiry-phone').fill("+91 98602 20550");
    await page.locator('#inquiry-service').selectOption({ index: 1 });
    await page.locator('#inquiry-message').fill(
      "We need an immediate water audit and wastewater ZLD feasibility study for our Nanded unit.",
    );

    // The form refuses submissions faster than 3 s, as a real visitor would be
    await page.waitForTimeout(3200);
    await page.getByRole("button", { name: "Submit Inquiry" }).click();

    // Verify confirmation view
    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Inquiry Received" })).toBeVisible();
    expect(requests).toHaveLength(1);
    expectFillMsContract(requests[0]);
  });

  test("shows inline error when submitted empty", async ({ page }) => {
    await page.goto("/contact/");
    await page.getByRole("button", { name: "Submit Inquiry" }).click();
    await expect(page.getByText("Name must be at least 2 characters")).toBeVisible();
  });
});

test.describe("career application modal", () => {
  test("opens application modal and accepts CV upload", async ({ page }) => {
    // Intercept form submission endpoint
    const requests: (string | null)[] = [];
    await page.route("**/macros/s/**/exec", async (route) => {
      requests.push(route.request().postData());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Application and CV stored in Drive.",
        }),
      });
    });

    await page.goto("/careers/");

    // content/jobs.yaml is empty, so the page offers a general application; with openings it is "Apply with CV".
    const applyButton = page.getByRole("button", { name: /Send a general application|Apply with CV/i }).first();
    await applyButton.click();

    // Verify modal is open
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Fill application fields
    await dialog.locator('#app-name').fill("Sunil Joshi");
    await dialog.locator('#app-email').fill("sunil.j@gmail.com");
    await dialog.locator('#app-phone').fill("+91 98220 12345");
    await dialog.locator('#app-cover').fill("A short introduction for the general application.");

    // Upload dummy CV
    await dialog.locator('input[type="file"]').setInputFiles({
      name: "Sunil_Joshi_Resume.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("dummy pdf content"),
    });

    await expect(dialog.getByText("Sunil_Joshi_Resume.pdf")).toBeVisible();

    await page.waitForTimeout(3200);
    await dialog.getByRole("button", { name: "Submit Application" }).click();

    // Verify confirmation
    await expect(dialog.getByRole("status")).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Application Submitted" })).toBeVisible();
    expect(requests).toHaveLength(1);
    expectFillMsContract(requests[0]);
  });
});
