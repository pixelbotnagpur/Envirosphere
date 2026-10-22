import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

// One-time migration helper. Downloads from the current live site, resizes, and registers the
// files in content/media.yaml. Re-running is safe: existing outputs and entries are skipped
// (use --force to redo the files).
const BASE = "https://envirosphere.co.in/assets/uploads/media-uploader/";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

interface Asset {
  key: string;
  remote: string;
  out: string;
  alt: string;
  width: number;
  quality: number;
}

const logo = (slug: string, remote: string, name: string): Asset => ({
  key: `client-${slug}`,
  remote,
  out: `public/media/clients/${slug}.webp`,
  alt: `${name} logo`,
  width: 480,
  quality: 82,
});

const assets: Asset[] = [
  logo("perkins", "perkins1753712651.png", "Perkins"),
  logo("philips", "philips1753712677.png", "Philips"),
  logo("si-group", "si-group1753712698.png", "SI Group"),
  logo("sunshield-chemicals", "sunshield-chemicals1753712719.png", "Sunshield Chemicals"),
  logo("xsio-logistics-parks", "xsio-logistics-parks1753712753.png", "XSIO Logistics Parks"),
  logo("fine-orgokem", "1-fine-orgokem1753710657.png", "Fine Orgokem"),
  logo("itc-limited", "3-itc-limited1753711056.png", "ITC Limited"),
  logo("indian-phosphate", "4-indian-phosphate1753711133.png", "Indian Phosphate"),
  logo("magarpatta-city", "6-magarpatta-city1753711306.png", "Magarpatta City"),
  logo("nxtra-by-airtel", "7-nxtra-by-airtel1753711362.png", "Nxtra by Airtel"),
  logo("estelle", "8-estelle1753711426.png", "Estelle"),
  logo("emerson", "9-emerson1753711479.png", "Emerson"),
  logo("shapoorji-pallonji", "10-shapoorji-pallonji1753711521.png", "Shapoorji Pallonji"),
  logo("jsw", "11-jsw1753711570.png", "JSW"),
  logo("nanded-city", "12-nanded-city1753711602.png", "Nanded City"),
  logo("jll", "13-jll1753711636.png", "JLL"),
  logo("rama-phosphates", "14-rama-phospates1753711680.png", "Rama Phosphates"),
  logo("marquardt", "15-marquardt1753711730.png", "Marquardt"),
  logo("haier", "16-haier1753711783.png", "Haier"),
  logo("anuh-pharma", "17-anuh-pharma-ltd1753711824.png", "Anuh Pharma Ltd"),
  logo("lg", "18-lg1753711886.png", "LG"),
  logo("zanvar", "20-zanvar1753711936.png", "Zanvar"),
  logo("aarti-drugs", "aarti-drugs-ltd1753711991.png", "Aarti Drugs Ltd"),
  logo("alchemo-industries", "alchemo-industries1753712074.png", "Alchemo Industries"),
  logo("aquapharma", "aquapharma1753712108.png", "Aquapharma"),
  logo("armacell", "armacell1753712142.png", "Armacell"),
  logo("bajaj", "bajaj1753712178.png", "Bajaj"),
  logo("bloom-engineering", "bloom-engineering1753712209.png", "Bloom Engineering"),
  logo("flint-group", "flint-group1753712269.png", "Flint Group"),
  logo("fullife", "fullife1753712298.png", "Fullife"),
  logo("hengtong", "hengtong1753712334.png", "Hengtong"),
  logo("horizon-industrial-parks", "horizon-industrial-parks1753712361.png", "Horizon Industrial Parks"),
  logo("indospace", "indospace1753712395.png", "Indospace"),
  logo("john-deere", "john-deere1753712441.png", "John Deere"),
  logo("kirloskar-oil-engines", "kirloskar-oil-engines1753712479.png", "Kirloskar Oil Engines"),
  logo("lignopura-agrotech", "lignopura-agrotech1753712505.png", "Lignopura Agrotech"),
  logo("ngl-fine-chem", "ngl-fine-chem-ltd1753712534.png", "NGL Fine-Chem Ltd"),
  logo("noble-hospitals", "noble-hospitals1753712561.png", "Noble Hospitals"),
  logo("paladin-paints", "paladin-paints1753712626.png", "Paladin Paints"),
  {
    key: "about-photo",
    remote: "sustainable-living-environmentalist-hand-holding-green-earth1652834526.jpg",
    out: "public/media/images/about.webp",
    alt: "A hand holding a small green model of the Earth",
    width: 1600,
    quality: 78,
  },
];

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "image/*,*/*" } });
  if (response.ok) return Buffer.from(await response.arrayBuffer());
  // The host's firewall can reject non-browser clients; retry through a real browser stack.
  const { request } = await import("@playwright/test");
  const context = await request.newContext({ extraHTTPHeaders: { "User-Agent": USER_AGENT } });
  try {
    const retry = await context.get(url);
    if (!retry.ok()) throw new Error(`${retry.status()} for ${url}`);
    return Buffer.from(await retry.body());
  } finally {
    await context.dispose();
  }
}

const force = process.argv.includes("--force");
const mediaFile = "content/media.yaml";
let mediaText = readFileSync(mediaFile, "utf8");

for (const asset of assets) {
  if (force || !existsSync(asset.out)) {
    const source = await download(BASE + asset.remote);
    mkdirSync(path.dirname(asset.out), { recursive: true });
    await sharp(source)
      .resize({ width: asset.width, withoutEnlargement: true })
      .webp({ quality: asset.quality })
      .toFile(asset.out);
    console.log(`saved ${asset.out}`);
  }
  if (!new RegExp(`^${asset.key}:`, "m").test(mediaText)) {
    const entry = `\n${asset.key}:\n  src: /${asset.out.replace(/^public\//, "")}\n  alt: ${asset.alt}\n`;
    appendFileSync(mediaFile, entry);
    mediaText += entry;
  }
}
writeFileSync(mediaFile, mediaText.replace(/\n{3,}/g, "\n\n"));
console.log(`done: ${assets.length} assets`);
