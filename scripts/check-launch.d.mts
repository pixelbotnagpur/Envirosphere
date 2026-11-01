export function parseEnvFile(text: string): Record<string, string>;
export function checkLaunchEnv(env: Record<string, string | undefined>): { ok: boolean; problems: string[] };
