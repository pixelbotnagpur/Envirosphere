import { describe, expect, it } from "vitest";
import { CURVE_VIEWBOX, curvePathD, curvePoint } from "./route-leaf-path";

describe("curvePoint", () => {
  it("starts at the left edge and ends at the right edge on the centre line", () => {
    const a = curvePoint(0, 4);
    const b = curvePoint(1, 4);
    expect(a.x).toBe(0);
    expect(b.x).toBe(1);
    expect(a.y).toBeCloseTo(0, 6);
    expect(b.y).toBeCloseTo(0, 6);
  });

  it("moves strictly left to right", () => {
    let prev = -1;
    for (let i = 0; i <= 50; i++) {
      const { x } = curvePoint(i / 50, 3);
      expect(x).toBeGreaterThan(prev);
      prev = x;
    }
  });

  it("is an S: dips one way in the first half and the other way in the second", () => {
    expect(curvePoint(0.25, 3).y).toBeLessThan(0);
    expect(curvePoint(0.75, 3).y).toBeGreaterThan(0);
  });

  it("is flat-ish at the crest and steepest at the crossings", () => {
    expect(curvePoint(0.25, 3).angle).toBeCloseTo(0, 6);
    expect(Math.abs(curvePoint(0, 3).angle)).toBeGreaterThan(Math.abs(curvePoint(0.1, 3).angle));
  });

  it("clamps progress outside 0..1", () => {
    expect(curvePoint(-1, 3).x).toBe(0);
    expect(curvePoint(2, 3).x).toBe(1);
  });

  it("gives a shallower angle on a wider aspect ratio", () => {
    expect(Math.abs(curvePoint(0, 9).angle)).toBeLessThan(Math.abs(curvePoint(0, 2).angle));
  });
});

describe("curvePathD", () => {
  it("builds a polyline from edge to edge of the viewBox", () => {
    const d = curvePathD(8);
    const pts = d.split(/[ML]/).filter(Boolean).map((p) => p.trim().split(" ").map(Number));
    expect(pts).toHaveLength(9);
    expect(pts[0][0]).toBe(0);
    expect(pts[8][0]).toBe(CURVE_VIEWBOX.width);
    for (const [, y] of pts) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(CURVE_VIEWBOX.height);
    }
  });
});
