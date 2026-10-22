// Mirrors the --duration-* and --ease-* tokens in globals.css (tests/unit/tokens.test.ts enforces this).
export const duration = { fast: 0.15, base: 0.4, slow: 0.9 } as const;

type Bezier = [number, number, number, number];
export const ease: Record<"outExpo" | "inOutQuart", Bezier> = {
  outExpo: [0.16, 1, 0.3, 1],
  inOutQuart: [0.76, 0, 0.24, 1],
};

export const lenisOptions = { lerp: 0.1, smoothWheel: true } as const;
