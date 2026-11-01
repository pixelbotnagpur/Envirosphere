import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

// Builds the social-sharing image (1200x630 JPEG) from a real operational photo.
// Source: public/media/gallery/g22.png (ecological quadrat survey, forest). Re-running overwrites the output.
// Usage: pnpm exec tsx scripts/make-og-image.ts
const SOURCE = "public/media/gallery/g22.png";
const OUTPUT = "public/media/brand/og-image.jpg";
const WIDTH = 1200;
const HEIGHT = 630;

async function main() {
  if (!existsSync(SOURCE)) throw new Error(`Source photo not found: ${SOURCE}`);
  const { width = 0, height = 0 } = await sharp(SOURCE).metadata();
  // Crop a band with the target aspect ratio around the surveyor, then scale to 1200x630.
  const bandHeight = Math.round((width * HEIGHT) / WIDTH);
  const top = Math.min(Math.max(0, Math.round(height * 0.18)), height - bandHeight);
  mkdirSync(path.dirname(OUTPUT), { recursive: true });
  await sharp(SOURCE)
    .extract({ left: 0, top, width, height: bandHeight })
    .resize(WIDTH, HEIGHT, { kernel: "lanczos3" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(OUTPUT);
  console.log(`Wrote ${OUTPUT} (${WIDTH}x${HEIGHT})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
