// Mirrors the --duration-* and --ease-* tokens in globals.css (tests/unit/tokens.test.ts enforces this).
export const duration = {
  fast: 0.15,
  base: 0.4,
  slow: 0.9,
  /** The route-curtain sprout drawing; the curtain stays up at least this long (from the click). */
  travel: 0.6,
  transition: { cover: 0.3, reveal: 0.35 },
} as const;

/** Longest the route-transition curtain may stay up if navigation never completes. */
export const TRANSITION_SAFETY_MS = 2500;

type Bezier = [number, number, number, number];
export const ease: Record<"outExpo" | "inOutQuart", Bezier> = {
  outExpo: [0.16, 1, 0.3, 1],
  inOutQuart: [0.76, 0, 0.24, 1],
};

export const lenisOptions = { lerp: 0.08, smoothWheel: true } as const;

/** Per-item reveal delay in seconds. Capped so the last items of a long list do not wait for seconds. */
export function staggerDelay(index: number, step = 0.08, max = 0.4): number {
  return Math.min(index * step, max);
}
