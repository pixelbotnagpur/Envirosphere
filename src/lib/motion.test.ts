import { describe, expect, it } from "vitest";
import { staggerDelay } from "./motion";

describe("staggerDelay", () => {
  it("grows linearly for the first items", () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(2, 0.1)).toBeCloseTo(0.2);
  });

  it("is capped so long lists never make late items wait", () => {
    expect(staggerDelay(23, 0.08)).toBe(0.4);
    expect(staggerDelay(1000)).toBe(0.4);
  });

  it("honours a custom cap", () => {
    expect(staggerDelay(50, 0.1, 0.2)).toBe(0.2);
  });
});
