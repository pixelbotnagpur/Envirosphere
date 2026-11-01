import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // plain HTML in out/ for Hostinger
  trailingSlash: true, // /about/ → about/index.html works on Apache/LiteSpeed
  images: { unoptimized: true }, // no image server on static hosting; Plan 5 pre-optimizes files
  reactStrictMode: true,
  // The e2e build sets NEXT_DIST_DIR so its dummy-endpoint output never overwrites the real out/.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
