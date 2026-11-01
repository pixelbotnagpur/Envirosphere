import { expect, test } from "@playwright/test";

/**
 * Cards that sit in the same visual row of a card grid must have the same height, whatever the
 * owner-edited copy length. Grids carry `data-card-grid`, their cards `data-card`.
 */
const WIDTHS = [375, 768, 1024, 1440];
const PAGES: { path: string; minGrids: number }[] = [
  { path: "/", minGrids: 3 },
  { path: "/services/", minGrids: 1 },
  { path: "/why-us/", minGrids: 2 },
  { path: "/about/", minGrids: 1 },
  { path: "/gallery/", minGrids: 1 },
  { path: "/downloads/", minGrids: 0 },
  { path: "/careers/", minGrids: 0 },
  { path: "/contact/", minGrids: 0 },
];

interface RowReport {
  grid: number;
  top: number;
  heights: number[];
}

test.describe("card heights", () => {
  test.skip(({ isMobile }) => isMobile, "viewport widths are set explicitly; run once on desktop");

  for (const { path, minGrids } of PAGES) {
    for (const width of WIDTHS) {
      test(`${path} cards share a height per row at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        const result = await page.evaluate(() => {
          const grids = Array.from(document.querySelectorAll<HTMLElement>("[data-card-grid]"));
          const rows: { grid: number; top: number; heights: number[] }[] = [];
          grids.forEach((grid, gridIndex) => {
            const cards = Array.from(grid.querySelectorAll<HTMLElement>(":scope > [data-card]"));
            // offsetTop/offsetHeight ignore the Reveal transform, so rows group reliably.
            const byTop = new Map<number, number[]>();
            for (const card of cards) {
              const top = Math.round(card.offsetTop);
              byTop.set(top, [...(byTop.get(top) ?? []), card.offsetHeight]);
            }
            for (const [top, heights] of byTop) rows.push({ grid: gridIndex, top, heights });
          });
          return { gridCount: grids.length, rows };
        });
        expect(result.gridCount).toBeGreaterThanOrEqual(minGrids);
        const uneven = (result.rows as RowReport[]).filter(
          (row) => Math.max(...row.heights) - Math.min(...row.heights) > 1,
        );
        expect(uneven, `uneven rows: ${JSON.stringify(uneven)}`).toEqual([]);
      });
    }
  }
});
