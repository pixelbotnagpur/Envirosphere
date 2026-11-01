import type { IncomingMessage, ServerResponse } from "node:http";

export const CONTENT_SECURITY_POLICY: string;
export const STRICT_TRANSPORT_SECURITY: string;
export const SECURITY_HEADERS: Record<string, string>;
export function contentTypeFor(file: string): string;
export function cacheControlFor(urlPath: string): string;
export function parseTarget(
  rawUrl: string,
): { segments: string[]; trailingSlash: boolean; urlPath: string; search: string } | null;
export function createHandler(options: {
  root: string;
  env?: Record<string, string | undefined>;
  log?: (line: string) => void;
}): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
