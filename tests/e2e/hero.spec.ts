import { expect, test } from "@playwright/test";

const viewports = [
  { name: "small phone 375x667", width: 375, height: 667 },
  { name: "phone landscape 740x360", width: 740, height: 360 },
];

for (const vp of viewports) {
  test(`hero is not clipped and its CTA is reachable at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");

    const hero = page.locator("main section").first();
    const cta = hero.getByRole("link").first();
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toBeVisible();

    // The hero must not hide overflowing content behind overflow:hidden.
    const heroState = await hero.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        overflowY: style.overflowY,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      };
    });
    if (heroState.overflowY === "hidden") {
      expect(heroState.scrollHeight).toBeLessThanOrEqual(heroState.clientHeight);
    }

    // The CTA lies inside the document and the element at its centre is the CTA itself (not covered).
    const result = await cta.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const docHeight = document.documentElement.scrollHeight;
      const top = r.top + window.scrollY;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return {
        insideDocument: r.left >= 0 && r.right <= window.innerWidth && top >= 0 && top + r.height <= docHeight,
        covered: !(hit && (hit === el || el.contains(hit))),
      };
    });
    expect(result.insideDocument).toBe(true);
    expect(result.covered).toBe(false);

    await cta.click({ trial: true });

    const noSideScroll = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(noSideScroll).toBe(true);
  });
}
