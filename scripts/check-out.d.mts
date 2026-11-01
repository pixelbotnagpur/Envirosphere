export const FORBIDDEN: { label: string; pattern: RegExp }[];
export function checkOutDir(dir: string): {
  ok: boolean;
  missing: boolean;
  problems: { file: string; label: string }[];
};
