import { describe, expect, it } from "vitest";
import { shouldIntercept, type ClickLike } from "./page-transition-utils";

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
