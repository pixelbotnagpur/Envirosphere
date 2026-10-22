// OKLCH → linear sRGB (Björn Ottosson's matrices) → WCAG relative luminance.
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

export function parseOklch(value: string): Oklch {
  const match = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/);
  if (!match) throw new Error(`Not a plain oklch() value: ${value}`);
  return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) };
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function luminance({ l: L, c: C, h }: Oklch): number {
  const hue = (h * Math.PI) / 180;
  const a = C * Math.cos(hue);
  const b = C * Math.sin(hue);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const r = clamp01(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = clamp01(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const bl = clamp01(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

export function contrast(a: Oklch, b: Oklch): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
