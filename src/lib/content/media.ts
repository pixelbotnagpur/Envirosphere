import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import type { Media } from "../validators/content";
import { ContentError, PUBLIC_ROOT } from "./read";

export interface ResolvedMedia {
  key: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"]);

function probeSize(file: string): { width?: number; height?: number } {
  if (!IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase())) return {};
  const { width, height } = imageSize(readFileSync(file));
  return { width, height };
}

/**
 * existsSync ignores letter case on Windows/macOS but the live (Linux) server does not.
 * Walks every path segment under publicRoot and returns the src spelled exactly as on disk.
 */
function exactCaseSrc(publicRoot: string, file: string): string {
  const segments = path.relative(publicRoot, file).split(path.sep);
  let dir = publicRoot;
  const actual: string[] = [];
  for (const segment of segments) {
    const names = readdirSync(dir);
    const onDisk = names.includes(segment)
      ? segment
      : names.find((name) => name.toLowerCase() === segment.toLowerCase());
    if (!onDisk) break;
    actual.push(onDisk);
    dir = path.join(dir, onDisk);
  }
  return `/${actual.join("/")}`;
}

export function resolveMedia(
  media: Media,
  key: string,
  publicRoot = PUBLIC_ROOT,
  usedIn = "content",
): ResolvedMedia {
  const item = media[key];
  if (!item) throw new ContentError(`${usedIn}: "${key}" is not listed in content/media.yaml`);
  const file = path.join(publicRoot, item.src);
  if (path.relative(publicRoot, file).startsWith("..")) {
    throw new ContentError(
      `content/media.yaml → ${key}: ${item.src} points outside the public folder; media files must live in public/media`,
    );
  }
  if (!existsSync(file)) {
    throw new ContentError(`content/media.yaml → ${key}: file not found at public${item.src}`);
  }
  if (statSync(file).isDirectory()) {
    throw new ContentError(
      `content/media.yaml → ${key}: ${item.src} is a folder, not a file; point it at a file inside it`,
    );
  }
  const expectedSrc = exactCaseSrc(publicRoot, file);
  if (expectedSrc !== item.src) {
    throw new ContentError(
      `content/media.yaml → ${key}: file name case does not match: write "${expectedSrc}" (letter case matters on the live server)`,
    );
  }
  let probed: { width?: number; height?: number } = {};
  if (!(item.width && item.height)) {
    try {
      probed = probeSize(file);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new ContentError(
        `content/media.yaml → ${key}: ${item.src} is not a readable image (${reason})`,
      );
    }
  }
  return {
    key,
    src: item.src,
    alt: item.alt,
    width: item.width ?? probed.width,
    height: item.height ?? probed.height,
  };
}

export function verifyAllMedia(media: Media, publicRoot = PUBLIC_ROOT): void {
  for (const key of Object.keys(media)) resolveMedia(media, key, publicRoot);
}
