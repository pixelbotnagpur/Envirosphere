import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges conflicting tailwind utilities, last wins", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("keeps a type-scale token and a color token together", () => {
    expect(cn("text-h1", "text-primary")).toBe("text-h1 text-primary");
  });

  it("lets a later type-scale token replace an earlier one", () => {
    expect(cn("text-h1", "text-h3")).toBe("text-h3");
  });

  it.each([
    ["px-gutter", "px-4"],
    ["px-4", "px-gutter"],
    ["py-section", "py-8"],
    ["py-8", "py-section"],
    ["max-w-content", "max-w-3xl"],
    ["max-w-3xl", "max-w-content"],
    ["rounded-pill", "rounded-card"],
    ["rounded-control", "rounded-pill"],
    ["tracking-label", "tracking-wide"],
    ["tracking-wide", "tracking-label"],
    ["shadow-card", "shadow-none"],
    ["shadow-none", "shadow-card"],
    ["ease-out-expo", "ease-in"],
    ["ease-in", "ease-in-out-quart"],
  ])("lets the later of %s and %s win", (first, second) => {
    expect(cn(first, second)).toBe(second);
  });

  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});
