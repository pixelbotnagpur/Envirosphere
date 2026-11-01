import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Shrinks the pictures in public/media: resizes to the width each role needs and re-encodes as WebP.
// Safe to re-run: files that are already small WebP are skipped, and an output that is newer than its
// source is never overwritten unless you pass --force. The script never deletes anything; the old
// JPG/PNG sources it lists must be removed by hand (git keeps them recoverable).
// Usage: pnpm optimize:images [--dry] [--force]

export const MEDIA_ROOT = "public/media";
/** Files above this size are always converted; smaller WebP files are left alone. */
export const SIZE_THRESHOLD = 150 * 1024;
export const WIDE_MAX_WIDTH = 2000; // full-bleed pictures (hero, banners, service pictures)
export const CARD_MAX_WIDTH = 1200; // cards, gallery tiles, portraits
export const OG_MAX_BYTES = 200 * 1024;
export const WEBP_QUALITY = 80;
export const WEBP_EFFORT = 5;

const RASTER = new Set([".png", ".jpg", ".jpeg", ".webp"]);

/** Path relative to public/media with forward slashes, e.g. "gallery/g01.jpg". */
export function relMediaPath(file: string, root = MEDIA_ROOT): string {
  return path.relative(root, file).split(path.sep).join("/");
}

export function isRaster(rel: string): boolean {
  return RASTER.has(path.extname(rel).toLowerCase());
}

export function isOgImage(rel: string): boolean {
  return rel.startsWith("brand/og-image.");
}

/** Widest the picture may be, by the folder it lives in. Never used to upscale. */
export function maxWidthFor(rel: string): number {
  const folder = rel.split("/")[0];
  return folder === "images" || folder === "photos" ? WIDE_MAX_WIDTH : CARD_MAX_WIDTH;
}

/** Width and height after fitting inside maxWidth; a smaller picture keeps its own size. */
export function targetSize(
  width: number,
  height: number,
  maxWidth: number,
): { width: number; height: number } {
  if (width <= maxWidth) return { width, height };
  return { width: maxWidth, height: Math.round((height * maxWidth) / width) };
}

export function webpPathFor(file: string): string {
  return file.slice(0, file.length - path.extname(file).length) + ".webp";
}

export interface SkipInput {
  rel: string;
  size: number;
  hasAlpha: boolean;
}

/** Returns the reason a file is left untouched, or null when it should be converted. */
export function skipReason({ rel, size, hasAlpha }: SkipInput): string | null {
  const ext = path.extname(rel).toLowerCase();
  if (!isRaster(rel)) return "not a raster image";
  if (isOgImage(rel)) return null; // handled by the og-image rule, not converted to WebP
  const isLogo = rel.startsWith("brand/") || rel.startsWith("clients/");
  if (isLogo && hasAlpha) return "logo that needs transparency";
  if (ext === ".webp" && size <= SIZE_THRESHOLD) return "already small WebP";
  return null;
}

/** Output is only replaced when it is missing or older than the source (or --force). */
export function shouldWrite(
  outExists: boolean,
  outMtimeMs: number,
  inMtimeMs: number,
  force: boolean,
): boolean {
  return force || !outExists || outMtimeMs < inMtimeMs;
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
  );
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;

async function main() {
  const args = new Set(process.argv.slice(2));
  const dry = args.has("--dry");
  const force = args.has("--force");
  if (!existsSync(MEDIA_ROOT))
    throw new Error(`${MEDIA_ROOT} not found; run from the project root`);

  let before = 0;
  let after = 0;
  const replaced: string[] = [];

  for (const file of walk(MEDIA_ROOT).sort()) {
    const rel = relMediaPath(file);
    if (!isRaster(rel)) continue;
    const size = statSync(file).size;
    const meta = await sharp(file).metadata();
    const stats = await sharp(file).stats();
    const hasAlpha = Boolean(meta.hasAlpha) && !stats.isOpaque;
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;

    if (isOgImage(rel)) {
      // Social crawlers want JPEG: only re-encode when it is over the size budget.
      if (size <= OG_MAX_BYTES) {
        console.log(`keep  ${rel} (${kb(size)}, within og-image budget)`);
        continue;
      }
      if (dry) {
        console.log(`would re-encode ${rel} (${kb(size)})`);
        continue;
      }
      const tmp = `${file}.tmp`;
      await sharp(file)
        .resize({ width: Math.min(width, CARD_MAX_WIDTH), withoutEnlargement: true })
        .jpeg({ quality: 78, mozjpeg: true })
        .toFile(tmp);
      renameSync(tmp, file);
      console.log(`jpeg  ${rel}: ${kb(size)} -> ${kb(statSync(file).size)}`);
      continue;
    }

    const reason = skipReason({ rel, size, hasAlpha });
    if (reason) {
      console.log(`skip  ${rel} (${reason})`);
      continue;
    }

    const out = webpPathFor(file);
    const sameFile = path.resolve(out) === path.resolve(file);
    const outExists = existsSync(out);
    if (
      !sameFile &&
      !shouldWrite(outExists, outExists ? statSync(out).mtimeMs : 0, statSync(file).mtimeMs, force)
    ) {
      console.log(`skip  ${rel} (output is newer; use --force)`);
      continue;
    }

    const target = targetSize(width, height, maxWidthFor(rel));
    if (dry) {
      console.log(
        `would convert ${rel} (${width}x${height}, ${kb(size)}) -> ${target.width}x${target.height} webp`,
      );
      continue;
    }

    mkdirSync(path.dirname(out), { recursive: true });
    const tmp = `${out}.tmp`;
    let pipeline = sharp(file).resize({ width: target.width, withoutEnlargement: true });
    if (meta.hasAlpha && stats.isOpaque) pipeline = pipeline.removeAlpha();
    await pipeline.webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT }).toFile(tmp);
    const outSize = statSync(tmp).size;
    if (sameFile && outSize >= size) {
      // Re-encoding an oversize WebP did not help: keep the original rather than make it worse.
      console.log(`keep  ${rel} (re-encode would not shrink it)`);
      continue;
    }
    renameSync(tmp, out);
    before += size;
    after += outSize;
    if (!sameFile) replaced.push(`public/media/${rel}`);
    console.log(
      `webp  ${rel}: ${kb(size)} -> ${relMediaPath(out)} ${kb(outSize)} (${target.width}x${target.height})`,
    );
  }

  console.log(`\nConverted total: ${kb(before)} -> ${kb(after)}`);
  if (replaced.length) {
    console.log(
      "\nSources that now have a WebP twin. Point content/media.yaml at the .webp files, then remove these:",
    );
    for (const file of replaced) console.log(`  ${file}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
