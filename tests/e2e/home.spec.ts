import { expect, test, type Locator, type Page } from "@playwright/test";

test.describe("home page", () => {
  test("has every section and all 13 services", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.getByRole("heading", { level: 2 }).count()).toBeGreaterThanOrEqual(6);
    const serviceLinks = page.locator('a[href^="/services/"][href$="/"]').filter({ hasText: /^\d{3}/ });
    await expect(serviceLinks).toHaveCount(13);
  });

  test("scrolling the whole page raises no console errors or hydration warnings", async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (message) => {
      // Chromium logs network 404s for unbuilt inner pages (Plan 3) as console errors;
      // ignore those so we only catch true JavaScript exceptions and React hydration warnings.
      if (
        (message.type() === "error" || message.type() === "warning") &&
        !message.text().includes("Failed to load resource")
      ) {
        problems.push(message.text());
      }
    });
    page.on("pageerror", (error) => problems.push(error.message));
    await page.goto("/");
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    });
    expect(problems).toEqual([]);
  });

  test("content below the fold becomes visible after scrolling to it", async ({ page }) => {
    await page.goto("/");
    const contact = page.getByRole("heading", { level: 2 }).last();
    await contact.scrollIntoViewIfNeeded();
    await expect(contact).toBeVisible();
    await expect(page.locator("[data-reveal]").last()).toHaveCSS("opacity", /^(?:0\.99\d*|1)$/);
  });
});

test.describe("desktop hero", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the main call to action is inside the first screen", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /talk to our team/i })).toBeInViewport();
  });
});

test.describe("small phone", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("no horizontal scroll anywhere on the page", async ({ page }) => {
    await page.goto("/");
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
  });
});

const ROWS = 'a[href^="/services/"][href$="/"]';

test.describe("What we offer: service rows", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  // Hover needs a mouse: phones are touch (see the unit test for touch).
  test.skip(({ isMobile }) => isMobile, "no hover on touch devices");

  const rows = (page: Page) => page.locator(ROWS).filter({ hasText: /^\d{3}/ });
  const scaleY = async (fill: Locator) =>
    fill.evaluate((el) => {
      const t = getComputedStyle(el).transform;
      return t === "none" ? 1 : new DOMMatrixReadOnly(t).d;
    });

  test("has only the numbered rows: no photo cards above them", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section").filter({ has: rows(page).first() });
    await expect(section.locator("[data-card-grid], [data-card]")).toHaveCount(0);
  });

  test("every row is one line of five columns, left to right: number, title, picture, description, arrow", async ({
    page,
  }) => {
    await page.goto("/");
    const first = rows(page).first();
    await first.scrollIntoViewIfNeeded();
    const xs: number[] = [];
    for (const col of ["number", "title", "image", "description", "arrow"]) {
      const box = await first.locator(`[data-col=${col}]`).boundingBox();
      expect(box, col).not.toBeNull();
      xs.push(box!.x);
    }
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    // The picture is small and sits inside the row's own box.
    const row = (await first.boundingBox())!;
    const pic = (await first.locator("[data-col=image]").boundingBox())!;
    expect(pic.width).toBeGreaterThan(128);
    expect(pic.width).toBeLessThan(200);
    expect(pic.y).toBeGreaterThanOrEqual(row.y);
    expect(pic.y + pic.height).toBeLessThanOrEqual(row.y + row.height);
    await expect(first.locator("[data-col=image] img, [data-col=image] [data-placeholder]")).toHaveCount(1);
  });

  // How much of the picture is still hidden from the right edge, in percent (100 = hidden, 0 = fully shown).
  const hiddenPercent = (cell: Locator) =>
    cell.evaluate((el) => {
      const match = getComputedStyle(el).clipPath.match(/inset\(\S+ ([\d.]+)%/);
      return match ? parseFloat(match[1]) : 0;
    });
  const docTop = (el: Locator) => el.evaluate((node) => node.getBoundingClientRect().top + window.scrollY);

  test("the picture is hidden until hover, then revealed with square corners and no rotation", async ({ page }) => {
    await page.goto("/");
    const first = rows(page).first();
    await first.scrollIntoViewIfNeeded();
    const cell = first.locator("[data-col=image]");
    expect(await hiddenPercent(cell)).toBe(100);
    expect(await cell.evaluate((el) => getComputedStyle(el).borderRadius)).toBe("0px");

    await first.hover();
    await expect.poll(() => hiddenPercent(cell), { message: "picture should be revealed" }).toBe(0);
    // The picture box itself never turns or scales: only the clip opens (and the photo inside settles).
    const transform = await cell.evaluate((el) => getComputedStyle(el).transform);
    expect(transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);

    await page.mouse.move(2, 2);
    await expect.poll(() => hiddenPercent(cell)).toBe(100);
  });

  test("hovering fills the row with Forest and fades the other rows, with no layout shift", async ({ page }) => {
    await page.goto("/");
    const list = rows(page);
    const first = list.first();
    await first.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const fill = first.locator("[data-row-fill]");
    const before = (await first.boundingBox())!;
    const titleBefore = (await first.locator("[data-col=title]").boundingBox())!;
    const rowTop = await docTop(first);
    const nextTop = await docTop(list.nth(1));
    expect(await scaleY(fill)).toBeLessThan(0.05);

    await first.hover();
    await expect.poll(() => scaleY(fill), { message: "Forest fill should rise" }).toBeGreaterThan(0.98);
    await expect(first).toHaveAttribute("data-state", "hover");
    await expect(list.nth(2)).toHaveAttribute("data-state", "dim");
    await expect
      .poll(async () => Number(await list.nth(2).evaluate((el) => getComputedStyle(el).opacity)))
      .toBeLessThan(0.6);
    await expect
      .poll(async () => (await first.locator("[data-col=title]").boundingBox())!.x)
      .toBeGreaterThan(titleBefore.x + 4);
    // The row never grows or shrinks: nothing moves on the page.
    expect((await first.boundingBox())!.height).toBeCloseTo(before.height, 0);
    expect(await docTop(first)).toBeCloseTo(rowTop, 0);
    expect(await docTop(list.nth(1))).toBeCloseTo(nextTop, 0);

    await page.mouse.move(2, 2);
    await expect.poll(() => scaleY(fill)).toBeLessThan(0.05);
    await expect(first).toHaveAttribute("data-state", "rest");
  });

  test("moving to another row hands the fill over", async ({ page }) => {
    await page.goto("/");
    const list = rows(page);
    await list.first().scrollIntoViewIfNeeded();
    await list.first().hover();
    await expect(list.first()).toHaveAttribute("data-state", "hover");
    await list.nth(3).hover();
    await expect(list.nth(3)).toHaveAttribute("data-state", "hover");
    await expect(list.first()).toHaveAttribute("data-state", "dim");
    await expect.poll(() => scaleY(list.first().locator("[data-row-fill]"))).toBeLessThan(0.05);
    await expect.poll(() => scaleY(list.nth(3).locator("[data-row-fill]"))).toBeGreaterThan(0.98);
  });

  test("keyboard focus lights the row too", async ({ page }) => {
    await page.goto("/");
    const first = rows(page).first();
    await first.focus();
    await expect(first).toHaveAttribute("data-state", "hover");
    await expect.poll(() => scaleY(first.locator("[data-row-fill]"))).toBeGreaterThan(0.98);
  });

  test("with reduced motion the row still lights up (just without the animation)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const first = rows(page).first();
    await first.scrollIntoViewIfNeeded();
    await first.hover();
    await expect.poll(() => scaleY(first.locator("[data-row-fill]"))).toBeGreaterThan(0.98);
  });
});

test.describe("What we offer on a small phone", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("number, title and arrow fit in each row: no overlap, nothing off screen, no picture", async ({ page }) => {
    await page.goto("/");
    const list = page.locator(ROWS).filter({ hasText: /^\d{3}/ });
    const count = await list.count();
    for (let i = 0; i < count; i += 1) {
      const row = list.nth(i);
      await row.scrollIntoViewIfNeeded();
      const number = (await row.locator("[data-col=number]").boundingBox())!;
      const title = (await row.locator("[data-col=title]").boundingBox())!;
      const arrow = (await row.locator("[data-col=arrow]").boundingBox())!;
      expect(number.x + number.width, `row ${i + 1}: number meets title`).toBeLessThanOrEqual(title.x + 1);
      expect(title.x + title.width, `row ${i + 1}: title meets arrow`).toBeLessThanOrEqual(arrow.x + 1);
      expect(arrow.x + arrow.width, `row ${i + 1}: arrow on screen`).toBeLessThanOrEqual(375);
      expect(await row.locator("[data-col=image]").boundingBox(), `row ${i + 1}: no picture on phones`).toBeNull();
    }
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
  });
});

const stageOf = (page: Page) => page.locator("[data-stage]");
const windowOf = (page: Page) => page.locator("[data-window]");
// Percent of the title still hidden from the top (100 = hidden, 0 = fully shown); 0 when there is no mask.
const hiddenFromTop = (page: Page) =>
  page.locator("[data-reveal-title]").evaluate((el) => {
    const match = getComputedStyle(el).clipPath.match(/inset\(([\d.]+)%/);
    return match ? parseFloat(match[1]) : 0;
  });
const scrollTo = (page: Page, y: number) => page.evaluate((top) => window.scrollTo(0, top), y);
const docTop = (el: Locator) => el.evaluate((node) => node.getBoundingClientRect().top + window.scrollY);

test.describe("pinned photo before What we offer", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.skip(({ isMobile }) => isMobile, "geometry is asserted at desktop size; the phone has its own test");

  test("the photo is full screen and sticks to the top, the title is revealed by scrolling, then Services slides over it", async ({
    page,
  }) => {
    await page.goto("/");
    const vh = 900;
    const start = await docTop(stageOf(page));
    const stageRect = async () => stageOf(page).evaluate((el) => el.getBoundingClientRect().toJSON());

    // Before it arrives: not stuck yet, title hidden.
    await scrollTo(page, start - vh / 2);
    await expect.poll(async () => (await stageRect()).top).toBeGreaterThan(vh / 2 - 5);
    expect(await hiddenFromTop(page)).toBeGreaterThan(95);

    // Touches the top: it is exactly one screen tall and the mask is still closed.
    await scrollTo(page, start);
    await expect.poll(async () => Math.abs((await stageRect()).top)).toBeLessThan(2);
    const rect = await stageRect();
    expect(rect.height).toBeCloseTo(vh, 0);
    expect(rect.width).toBeCloseTo(1440, 0);
    expect(await hiddenFromTop(page)).toBeGreaterThan(90);

    // Once shown, the big title sits in the middle of the screen and is bigger than a section heading.
    await scrollTo(page, start + vh * 0.9);
    await expect.poll(() => hiddenFromTop(page)).toBeLessThan(2);
    const titleBox = (await page.locator("[data-reveal-title]").boundingBox())!;
    expect(titleBox.x + titleBox.width / 2).toBeCloseTo(720, -1);
    expect(titleBox.y + titleBox.height / 2).toBeCloseTo(450, -2);
    const titleSize = await page.locator("[data-reveal-title]").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(titleSize).toBeGreaterThan(100);
    await scrollTo(page, start);

    // While it stays pinned the title reveals.
    await scrollTo(page, start + vh * 0.4);
    await expect.poll(async () => Math.abs((await stageRect()).top)).toBeLessThan(2);
    await expect.poll(() => hiddenFromTop(page)).toBeLessThan(70);
    await scrollTo(page, start + vh * 0.9);
    await expect.poll(() => hiddenFromTop(page)).toBeLessThan(2);
    expect(Math.abs((await stageRect()).top)).toBeLessThan(2);

    // Services scrolls up over the pinned photo.
    await scrollTo(page, start + vh * 1.5);
    await expect.poll(async () => (await windowOf(page).boundingBox())!.y).toBeLessThan(vh * 0.6);
    expect(Math.abs((await stageRect()).top)).toBeLessThan(2);
    const overlapped = await page.evaluate(() => {
      const hit = document.elementFromPoint(window.innerWidth / 2, window.innerHeight * 0.95);
      return !!hit?.closest("[data-window]");
    });
    expect(overlapped).toBe(true);

    // Later the photo is completely behind it.
    await scrollTo(page, start + vh * 3);
    await expect
      .poll(() =>
        page.evaluate(() => !!document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)?.closest("[data-window]")),
      )
      .toBe(true);
  });

  test("the Services section under it has no small title, just its heading, intro and the All services button", async ({
    page,
  }) => {
    await page.goto("/");
    const win = windowOf(page);
    await expect(win.getByText(/what we offer/i)).toHaveCount(0);
    await expect(win.getByRole("heading", { level: 2 })).toHaveCount(1);
    await expect(win.getByRole("link", { name: "All services" })).toHaveCount(1);
  });

  test("with reduced motion it is a plain photo band with the title already shown", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const stage = stageOf(page);
    await stage.scrollIntoViewIfNeeded();
    expect(await stage.evaluate((el) => getComputedStyle(el).position)).toBe("static");
    expect(await page.locator("[data-runway]").evaluate((el) => getComputedStyle(el).display)).toBe("none");
    await expect.poll(() => hiddenFromTop(page)).toBe(0);
  });
});

test.describe("pinned photo on a small phone", () => {
  test.use({ viewport: { width: 375, height: 700 } });

  test("fills the screen, fits the width and the big title does not overflow", async ({ page }) => {
    await page.goto("/");
    const stage = stageOf(page);
    const box = (await stage.boundingBox())!;
    expect(box.height).toBeCloseTo(700, -1);
    expect(box.width).toBeLessThanOrEqual(375);
    const title = await page.locator("[data-reveal-title]").evaluate((el) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth,
    }));
    expect(title.scroll).toBeLessThanOrEqual(title.client + 1);
    const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
  });
});

const bg = (el: Locator) => el.evaluate((node) => getComputedStyle(node).backgroundColor);
// Percent hidden from the top of a clip-path mask (100 = closed, 0 = open or no mask).
const maskClosed = (el: Locator) =>
  el.evaluate((node) => {
    const match = getComputedStyle(node).clipPath.match(/inset\(([\d.]+)%/);
    return match ? parseFloat(match[1]) : 0;
  });

test.describe("In numbers: dark Forest section", () => {
  test("the section is the same dark green as the footer and the cards stay readable on it", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section").filter({ has: page.locator("[data-card-grid]").getByText("Clients", { exact: true }) });
    await expect(section).toHaveCount(1);
    const footerBg = await bg(page.locator("footer"));
    expect(await bg(section)).toBe(footerBg);
    const card = section.locator("[data-card] > div > div").first();
    expect(await bg(card)).not.toBe(footerBg);
    const color = await section.evaluate((node) => getComputedStyle(node).color);
    expect(color).not.toBe(await page.locator("body").evaluate((node) => getComputedStyle(node).color));
  });
});

test.describe("Field work: bento grid", () => {
  const tiles = (page: Page) => page.locator("[data-bento] [data-tile]");
  const rect = async (el: Locator) => (await el.boundingBox())!;

  test("at desktop width the tiles have different sizes, line up on short rows and fill the grid", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const grid = page.locator("[data-bento]");
    await grid.scrollIntoViewIfNeeded();
    await expect(tiles(page)).toHaveCount(5);
    const boxes = [];
    for (let i = 0; i < 5; i += 1) boxes.push(await rect(tiles(page).nth(i)));
    const [a, b, c, d, cta] = boxes;
    // Big, medium and two small shapes.
    expect(a.width).toBeGreaterThan(b.width + 20);
    expect(b.width).toBeGreaterThan(c.width + 20);
    expect(a.height).toBeGreaterThan(c.height * 1.8);
    // Edges line up: the tall tiles are the same height, and the two small ones together make up that height.
    expect(b.height).toBeCloseTo(a.height, 0);
    expect(c.height + 16 + d.height).toBeCloseTo(a.height, 0);
    expect(c.x).toBeCloseTo(d.x, 0);
    expect(d.y).toBeCloseTo(c.y + c.height + 16, 0);
    expect(a.y).toBeCloseTo(b.y, 0);
    expect(a.y).toBeCloseTo(c.y, 0);
    // The last tile is the wide gallery link under the others, the full width of the grid.
    const g = await rect(grid);
    expect(cta.width).toBeCloseTo(g.width, 0);
    expect(cta.x).toBeCloseTo(g.x, 0);
    expect(cta.y).toBeCloseTo(a.y + a.height + 16, 0);
    expect(cta.height).toBeLessThan(a.height / 3);
    // No overlaps, and together the tiles cover the whole grid except the gaps.
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const x = Math.min(boxes[i].x + boxes[i].width, boxes[j].x + boxes[j].width) - Math.max(boxes[i].x, boxes[j].x);
        const y = Math.min(boxes[i].y + boxes[i].height, boxes[j].y + boxes[j].height) - Math.max(boxes[i].y, boxes[j].y);
        expect(x > 1 && y > 1, `tiles ${i + 1} and ${j + 1} overlap`).toBe(false);
      }
    }
    const covered = boxes.reduce((sum, box) => sum + box.width * box.height, 0);
    expect(covered / (g.width * g.height)).toBeGreaterThan(0.93);
    // Each photo tile shows its photo and caption inside its own box.
    for (let i = 0; i < 4; i += 1) {
      const tile = tiles(page).nth(i);
      const t = await rect(tile);
      const img = await rect(tile.locator("img"));
      expect(img.x).toBeGreaterThanOrEqual(t.x - 1);
      expect(img.x + img.width).toBeLessThanOrEqual(t.x + t.width + 1);
      await expect(tile.locator("p")).toBeVisible();
    }
  });

  test("the gallery tile is a link to the gallery and nothing else sits below the grid", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const link = page.locator("[data-bento] [data-cta-tile] a");
    await expect(link).toHaveAttribute("href", "/gallery/");
    const section = page.locator("section").filter({ has: page.locator("[data-bento]") });
    const links = await section.locator("a").evaluateAll((els) =>
      els.map((el) => ({ href: el.getAttribute("href"), insideGrid: !!el.closest("[data-bento]") })),
    );
    expect(links.filter((l) => !l.insideGrid)).toHaveLength(1);
  });

  test("on a tablet the first tile is tall and the last runs the full width", async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1000 });
    await page.goto("/");
    await page.locator("[data-bento]").scrollIntoViewIfNeeded();
    const [a, b, , d] = [await rect(tiles(page).nth(0)), await rect(tiles(page).nth(1)), await rect(tiles(page).nth(2)), await rect(tiles(page).nth(3))];
    expect(a.height).toBeGreaterThan(b.height * 1.8);
    expect(d.width).toBeGreaterThan(a.width * 1.9);
    const cta = await rect(tiles(page).nth(4));
    expect(cta.width).toBeCloseTo(d.width, 0);
    expect(cta.y).toBeGreaterThan(d.y + d.height - 1);
  });

  test("on a phone the tiles stack in one column", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await page.locator("[data-bento]").scrollIntoViewIfNeeded();
    const boxes = [];
    for (let i = 0; i < 5; i += 1) boxes.push(await rect(tiles(page).nth(i)));
    for (const box of boxes) expect(box.width).toBeCloseTo(boxes[0].width, 0);
    for (let i = 1; i < boxes.length; i += 1) expect(boxes[i].y).toBeGreaterThan(boxes[i - 1].y + boxes[i - 1].height - 1);
    const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
  });
});

test.describe("How we work: picture on the left, highlighted step on the right", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.skip(({ isMobile }) => isMobile, "pinned layout is for desktop-size screens");

  const processSection = (page: Page) => page.locator("section").filter({ has: page.locator("[data-process-stage], [data-process-image]") });

  test("each step reveals its picture through a mask and lights its card as you scroll", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-process-stage]").waitFor({ state: "attached" });
    const section = processSection(page);
    const top = await docTop(section);
    const height = (await section.boundingBox())!.height;
    const range = height - 900;
    const frames = page.locator("[data-process-image]");
    const cards = page.locator("[data-process-step]");
    await expect(frames).toHaveCount(4);

    const openCount = async () => {
      let open = 0;
      for (let i = 0; i < 4; i += 1) if ((await maskClosed(frames.nth(i))) < 1) open += 1;
      return open;
    };
    const activeIndex = async () => {
      for (let i = 0; i < 4; i += 1) if ((await cards.nth(i).getAttribute("data-active")) === "true") return i;
      return -1;
    };
    const stepAt = async (p: number, expected: number) => {
      await scrollTo(page, top + range * p);
      await expect.poll(activeIndex, { message: `step at ${p}` }).toBe(expected);
      await expect.poll(openCount, { message: `pictures open at step ${expected}` }).toBe(expected + 1);
    };

    await stepAt(0.08, 0);
    // The picture is on the left of the card list, and both fit on screen (nothing clipped by the pinned stage).
    const stage = (await page.locator("[data-process-stage]").boundingBox())!;
    const firstCard = (await cards.nth(0).boundingBox())!;
    const lastCard = (await cards.nth(3).boundingBox())!;
    expect(stage.x + stage.width).toBeLessThanOrEqual(firstCard.x);
    expect(stage.y).toBeGreaterThanOrEqual(0);
    expect(stage.y + stage.height).toBeLessThanOrEqual(900);
    expect(lastCard.y + lastCard.height).toBeLessThanOrEqual(900);

    // The pictures are only revealed by their mask: nothing zooms, scales or turns.
    for (let i = 0; i < 4; i += 1) {
      const frameTransform = await frames.nth(i).evaluate((el) => getComputedStyle(el).transform);
      const imgTransform = await frames.nth(i).locator("img").evaluate((el) => getComputedStyle(el).transform);
      expect(frameTransform, `frame ${i + 1}`).toBe("none");
      expect(imgTransform, `picture ${i + 1}`).toBe("none");
    }

    await stepAt(0.35, 1);
    for (let i = 0; i < 4; i += 1) {
      expect(await frames.nth(i).locator("img").evaluate((el) => getComputedStyle(el).transform), `picture ${i + 1} after step 2`).toBe("none");
    }
    // Active card is highlighted: different border colour and full opacity, the others are dimmed.
    const border = (i: number) => cards.nth(i).evaluate((el) => getComputedStyle(el).borderColor);
    expect(await border(1)).not.toBe(await border(0));
    await expect
      .poll(async () => Number(await cards.nth(0).evaluate((el) => getComputedStyle(el).opacity)))
      .toBeLessThan(0.7);
    await stepAt(0.6, 2);
    await stepAt(0.95, 3);
    // Scrolling back closes the later pictures again.
    await stepAt(0.08, 0);
  });

  test("on a short desktop window it falls back to a plain list so nothing is clipped", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 });
    await page.goto("/");
    const frames = page.locator("[data-process-image]");
    await expect(frames).toHaveCount(4);
    await expect(page.locator("[data-process-stage]")).toHaveCount(0);
    await frames.nth(0).scrollIntoViewIfNeeded();
    await expect.poll(() => maskClosed(frames.nth(0))).toBeLessThan(1);
  });

  test("with reduced motion the pictures are simply shown", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const frames = page.locator("[data-process-image]");
    await frames.nth(2).scrollIntoViewIfNeeded();
    for (let i = 0; i < 4; i += 1) expect(await maskClosed(frames.nth(i))).toBe(0);
  });
});

test.describe("Client testimonials slider", () => {
  const slides = (page: Page) => page.locator("[data-slide]");
  const activeSlide = (page: Page) => page.locator('[data-slide][data-active="true"]');
  const quote = async (page: Page) => (await activeSlide(page).locator("blockquote").innerText()).trim();
  const region = (page: Page) => page.getByRole("group", { name: /clients' words/i });
  const next = (page: Page) => page.getByRole("button", { name: "Next testimonial" });
  const prev = (page: Page) => page.getByRole("button", { name: "Previous testimonial" });
  const settled = async (page: Page) => {
    await expect(activeSlide(page)).toHaveCount(1);
    await expect.poll(async () => Number(await activeSlide(page).evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0.99);
  };

  test.describe("on a desktop", () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test.skip(({ isMobile }) => isMobile, "desktop size and mouse");

    test("shows one testimonial at a time and the next button moves through them all, then round", async ({ page }) => {
      await page.goto("/");
      await region(page).scrollIntoViewIfNeeded();
      const count = await slides(page).count();
      expect(count).toBeGreaterThanOrEqual(2);
      await settled(page);
      const seen = [await quote(page)];
      // Only the active one is visible: the others are fully transparent.
      for (let i = 0; i < count; i += 1) {
        const opacity = Number(await slides(page).nth(i).evaluate((el) => getComputedStyle(el).opacity));
        expect(opacity > 0.9 ? 1 : 0, `slide ${i + 1}`).toBe(i === 0 ? 1 : 0);
      }
      for (let i = 1; i < count; i += 1) {
        await next(page).click();
        await settled(page);
        seen.push(await quote(page));
      }
      expect(new Set(seen).size).toBe(count);
      await next(page).click();
      await settled(page);
      expect(await quote(page)).toBe(seen[0]);
      await prev(page).click();
      await settled(page);
      expect(await quote(page)).toBe(seen[count - 1]);
    });

    test("the section keeps the same height whichever testimonial is showing", async ({ page }) => {
      await page.goto("/");
      await region(page).scrollIntoViewIfNeeded();
      const heightOf = async () => (await region(page).boundingBox())!.height;
      const first = await heightOf();
      const count = await slides(page).count();
      for (let i = 1; i < count; i += 1) {
        await next(page).click();
        await settled(page);
        expect(await heightOf()).toBeCloseTo(first, 0);
      }
    });

    test("works with the arrow keys and with the bars", async ({ page }) => {
      await page.goto("/");
      await region(page).scrollIntoViewIfNeeded();
      await settled(page);
      const first = await quote(page);
      await region(page).focus();
      await page.keyboard.press("ArrowRight");
      await settled(page);
      const second = await quote(page);
      expect(second).not.toBe(first);
      await page.keyboard.press("ArrowLeft");
      await settled(page);
      expect(await quote(page)).toBe(first);
      const bars = page.getByRole("button", { name: /^Testimonial \d+ of \d+$/ });
      await bars.nth(2).click();
      await settled(page);
      await expect(bars.nth(2)).toHaveAttribute("aria-current", "true");
      await expect(page.getByText(/^03 \/ \d\d$/)).toBeVisible();
    });

    test("dragging the quote sideways moves to the next or previous one", async ({ page }) => {
      await page.goto("/");
      await region(page).scrollIntoViewIfNeeded();
      await settled(page);
      const first = await quote(page);
      const box = (await activeSlide(page).boundingBox())!;
      const y = box.y + box.height / 2;
      await page.mouse.move(box.x + box.width * 0.7, y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.3, y, { steps: 12 });
      await page.mouse.up();
      await settled(page);
      expect(await quote(page)).not.toBe(first);
      await page.mouse.move(box.x + box.width * 0.3, y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.7, y, { steps: 12 });
      await page.mouse.up();
      await settled(page);
      expect(await quote(page)).toBe(first);
    });

    test("with reduced motion the slider still works", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await region(page).scrollIntoViewIfNeeded();
      await settled(page);
      const first = await quote(page);
      await next(page).click();
      await settled(page);
      expect(await quote(page)).not.toBe(first);
    });
  });

  test.describe("on a small phone", () => {
    test.use({ viewport: { width: 375, height: 800 } });

    test("fits the screen, has comfortable buttons and still moves on", async ({ page }) => {
      await page.goto("/");
      await region(page).scrollIntoViewIfNeeded();
      await settled(page);
      for (const button of [prev(page), next(page)]) {
        const box = (await button.boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x + box.width).toBeLessThanOrEqual(375);
      }
      const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
      expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
      const first = await quote(page);
      await next(page).click();
      await settled(page);
      expect(await quote(page)).not.toBe(first);
    });
  });
});
