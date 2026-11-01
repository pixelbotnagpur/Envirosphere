import { act, renderHook } from "@testing-library/react";
import { motionValue } from "motion/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  HIDE_AFTER,
  MIN_DELTA,
  nextScrollState,
  useScrollHidden,
  type ScrollDirectionState,
} from "./use-scroll-direction";

const y = motionValue(0);
vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useScroll: () => ({ scrollY: y }),
}));

const start: ScrollDirectionState = { hidden: false, lastY: 0 };

describe("nextScrollState", () => {
  it("stays visible near the top however fast you scroll down", () => {
    expect(nextScrollState(start, HIDE_AFTER - 1).hidden).toBe(false);
  });
  it("hides on a downward move past the threshold", () => {
    expect(nextScrollState(start, HIDE_AFTER + 200).hidden).toBe(true);
  });
  it("shows again on an upward move", () => {
    const hidden = { hidden: true, lastY: 600 };
    expect(nextScrollState(hidden, 600 - MIN_DELTA).hidden).toBe(false);
  });
  it("ignores moves smaller than the minimum delta", () => {
    const hidden = { hidden: true, lastY: 600 };
    expect(nextScrollState(hidden, 600 - (MIN_DELTA - 1))).toBe(hidden);
    const shown = { hidden: false, lastY: 600 };
    expect(nextScrollState(shown, 600 + (MIN_DELTA - 1))).toBe(shown);
  });
  it("accumulates slow scrolling because lastY only moves on counted steps", () => {
    let s: ScrollDirectionState = { hidden: false, lastY: 300 };
    for (let i = 1; i <= 10; i++) s = nextScrollState(s, 300 + i * 2);
    expect(s.hidden).toBe(true);
  });
  it("shows when scrolling back to the top", () => {
    expect(nextScrollState({ hidden: true, lastY: 500 }, 0)).toEqual({ hidden: false, lastY: 0 });
  });
  it("honours custom threshold and delta", () => {
    expect(nextScrollState(start, 50, { threshold: 40, delta: 10 }).hidden).toBe(true);
    const near = { hidden: false, lastY: 42 };
    expect(nextScrollState(near, 45, { threshold: 40, delta: 10 })).toBe(near);
  });
});

describe("useScrollHidden", () => {
  beforeEach(() => y.set(0));

  it("hides on scroll down, shows on scroll up", () => {
    const { result } = renderHook(() => useScrollHidden());
    expect(result.current).toBe(false);
    act(() => y.set(600));
    expect(result.current).toBe(true);
    act(() => y.set(400));
    expect(result.current).toBe(false);
  });
  it("stays false when disabled (menu open or reduced motion)", () => {
    const { result } = renderHook(() => useScrollHidden(false));
    act(() => y.set(900));
    expect(result.current).toBe(false);
  });
});
