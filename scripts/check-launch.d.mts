export function parseEnvFile(text: string): Record<string, string>;
export function checkLaunchEnv(env: Record<string, string | undefined>): { ok: boolean; problems: string[] };
export const DUMMY_TURNSTILE_KEY: RegExp;
export function loadEnv(cwd: string): Record<string, string>;
