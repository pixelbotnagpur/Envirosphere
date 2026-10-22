import { existsSync, readFileSync } from "node:fs";
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

export function resolveMedia(
  media: Media,
  key: string,
  publicRoot = PUBLIC_ROOT,
  usedIn = "content",
): ResolvedMedia {
  const item = media[key];
  if (!item) throw new ContentError(`${usedIn}: "${key}" is not listed in content/media.yaml`);
  const file = path.join(publicRoot, item.src);
  if (!existsSync(file)) {
    throw new ContentError(`content/media.yaml → ${key}: file not found at public${item.src}`);
  }
  const probed = item.width && item.height ? {} : probeSize(file);
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
