import { describe, expect, it } from "vitest";
import { revealWaitMs, shouldIntercept, type ClickLike } from "./page-transition-utils";

const here = "https://example.test/about/";

const click = (over: Partial<ClickLike> = {}): ClickLike => ({
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  defaultPrevented: false,
  ...over,
});

function link(attrs: Record<string, string>, parent?: HTMLElement): HTMLAnchorElement {
  const a = document.createElement("a");
  for (const [k, v] of Object.entries(attrs)) a.setAttribute(k, v);
  (parent ?? document.body).appendChild(a);
  return a;
}

describe("shouldIntercept", () => {
  it("takes over a plain internal navigation", () => {
    expect(shouldIntercept(click(), link({ href: "/services/" }), here)).toBe(true);
  });

  it("skips already-handled clicks and non-primary buttons", () => {
    const a = link({ href: "/services/" });
    expect(shouldIntercept(click({ defaultPrevented: true }), a, here)).toBe(false);
    expect(shouldIntercept(click({ button: 1 }), a, here)).toBe(false);
    expect(shouldIntercept(click({ button: 2 }), a, here)).toBe(false);
  });

  it.each(["metaKey", "ctrlKey", "shiftKey", "altKey"] as const)("skips %s clicks", (key) => {
    expect(shouldIntercept(click({ [key]: true }), link({ href: "/services/" }), here)).toBe(false);
  });

  it("skips new-tab targets but allows _self", () => {
    expect(shouldIntercept(click(), link({ href: "/x/", target: "_blank" }), here)).toBe(false);
    expect(shouldIntercept(click(), link({ href: "/x/", target: "_self" }), here)).toBe(true);
  });

  it("skips downloads and opted-out links", () => {
    expect(shouldIntercept(click(), link({ href: "/a.pdf", download: "" }), here)).toBe(false);
    expect(shouldIntercept(click(), link({ href: "/x/", "data-no-transition": "" }), here)).toBe(false);
  });

  it("skips external, protocol-relative, mailto and tel links", () => {
    expect(shouldIntercept(click(), link({ href: "https://other.test/x/" }), here)).toBe(false);
    expect(shouldIntercept(click(), link({ href: "//other.test/x/" }), here)).toBe(false);
    expect(shouldIntercept(click(), link({ href: "mailto:a@b.test" }), here)).toBe(false);
    expect(shouldIntercept(click(), link({ href: "tel:+910000" }), here)).toBe(false);
  });

  it("skips hash-only, same-page and cross-page hash links", () => {
    expect(shouldIntercept(click(), link({ href: "#main" }), here)).toBe(false);
    expect(shouldIntercept(click(), link({ href: "/about/" }), here)).toBe(false);
    expect(shouldIntercept(click(), link({ href: "/about/#team" }), here)).toBe(false);
    expect(shouldIntercept(click(), link({ href: "/about/?a=1" }), here)).toBe(false);
    expect(shouldIntercept(click(), link({ href: "/contact/#form" }), here)).toBe(false);
  });

  it("treats a slashless link to the current page as the same page", () => {
    expect(shouldIntercept(click(), link({ href: "/about" }), "https://example.test/about/")).toBe(false);
    expect(shouldIntercept(click(), link({ href: "/about/" }), "https://example.test/about")).toBe(false);
    expect(shouldIntercept(click(), link({ href: "/about/team" }), "https://example.test/about/")).toBe(true);
  });

  it("skips anchors without an href", () => {
    expect(shouldIntercept(click(), link({}), here)).toBe(false);
  });

  it("skips links inside a dialog", () => {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    document.body.appendChild(dialog);
    expect(shouldIntercept(click(), link({ href: "/x/" }, dialog), here)).toBe(false);
  });
});

describe("revealWaitMs", () => {
  it.each([
    // elapsed, travel, safetyLeft, expected
    [550, 900, 2000, 350], // route ready right after the cover: wait out the rest of the trip
    [900, 900, 2000, 0], // exactly done
    [1400, 900, 1500, 0], // slow route: leaf already waiting at the end
    [100, 900, 2000, 800], // very early
    [0, 900, 2000, 900], // never more than the whole trip
    [100, 900, 500, 250], // capped below the safety timeout
    [100, 900, 200, 0], // nothing left before safety: reveal now
  ])("elapsed %i, travel %i, safety left %i -> %i", (elapsed, travel, safety, expected) => {
    expect(revealWaitMs(elapsed, travel, safety)).toBe(expected);
  });

  it("never reaches the safety timeout", () => {
    for (let elapsed = 0; elapsed <= 3000; elapsed += 100) {
      for (const left of [0, 300, 1000, 2500]) {
        expect(revealWaitMs(elapsed, 900, left)).toBeLessThan(Math.max(left, 1));
      }
    }
  });
});
