import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import type { ZodType } from "zod";

export const CONTENT_ROOT = path.join(process.cwd(), "content");
export const PUBLIC_ROOT = path.join(process.cwd(), "public");

/** A problem the site owner can fix by editing a file in content/. Messages are plain language. */
export class ContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentError";
  }
}

function formatPath(segments: PropertyKey[]): string {
  return segments.reduce<string>((out, segment) => {
    if (typeof segment === "number") return `${out}[${segment}]`;
    return out ? `${out}.${String(segment)}` : String(segment);
  }, "");
}

export function validate<T>(schema: ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const lines = result.error.issues.map(
    (issue) => `${label}${issue.path.length ? ` → ${formatPath(issue.path)}` : ""}: ${issue.message}`,
  );
  throw new ContentError(lines.join("\n"));
}

function readText(root: string, relPath: string, label: string): string {
  const file = path.join(root, relPath);
  if (!existsSync(file)) throw new ContentError(`${label}: file is missing`);
  return readFileSync(file, "utf8");
}

function parseYaml(text: string, label: string): unknown {
  try {
    return parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message.split("\n")[0] : "unknown problem";
    throw new ContentError(`${label}: could not read the file (${reason})`);
  }
}

export function readYamlFile<T>(relPath: string, schema: ZodType<T>, root = CONTENT_ROOT): T {
  const label = `content/${relPath}`;
  return validate(schema, parseYaml(readText(root, relPath, label), label), label);
}

export function readMarkdownFile<T>(
  relPath: string,
  schema: ZodType<T>,
  root = CONTENT_ROOT,
): { data: T; body: string } {
  const label = `content/${relPath}`;
  const text = readText(root, relPath, label);
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new ContentError(`${label}: the file must start with a front matter block between two --- lines`);
  }
  return { data: validate(schema, parseYaml(match[1], label), label), body: match[2].trim() };
}
