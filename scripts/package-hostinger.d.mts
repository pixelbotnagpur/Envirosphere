export function packageHostinger(options?: {
  rootDir?: string;
  outName?: string;
  destName?: string;
  env?: Record<string, string | undefined>;
  allowMissingForms?: boolean;
  onWarn?: (message: string) => void;
}): string;
