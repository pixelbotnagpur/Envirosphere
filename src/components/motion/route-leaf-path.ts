/** Fraction of the curve box height that the S-curve swings above and below the centre line. */
export const CURVE_AMPLITUDE = 0.3;

/** Coordinate space of the decorative line. The SVG stretches it to the viewport width. */
export const CURVE_VIEWBOX = { width: 1000, height: 100 } as const;

export interface CurvePoint {
  /** 0..1 across the width. */
  x: number;
  /** Offset from the centre line as a fraction of the box height (negative is up). */
  y: number;
  /** Tangent direction in degrees, as drawn on screen for a box of the given aspect ratio. */
  angle: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Point on the gentle S-curve (one sine period, like a river bend) at `progress` 0..1 across the width.
 * `aspect` is the box width divided by its height, needed because the tangent angle depends on how the
 * normalised curve is stretched on screen.
 */
export function curvePoint(progress: number, aspect: number): CurvePoint {
  const t = clamp01(progress);
  const phase = t * Math.PI * 2;
  const y = -CURVE_AMPLITUDE * Math.sin(phase);
  const slope = (-CURVE_AMPLITUDE * Math.PI * 2 * Math.cos(phase)) / Math.max(aspect, 0.0001);
  return { x: t, y, angle: (Math.atan(slope) * 180) / Math.PI };
}

/** SVG path data (a smooth polyline) for the curve in {@link CURVE_VIEWBOX} coordinates. */
export function curvePathD(samples = 64): string {
  const { width, height } = CURVE_VIEWBOX;
  const parts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const p = curvePoint(i / samples, 1);
    const cmd = i === 0 ? "M" : "L";
    parts.push(`${cmd}${round(p.x * width)} ${round(height / 2 + p.y * height)}`);
  }
  return parts.join(" ");
}

const round = (n: number) => Math.round(n * 100) / 100;
