import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // plain HTML in out/ for Hostinger
  trailingSlash: true, // /about/ → about/index.html works on Apache/LiteSpeed
  images: { unoptimized: true }, // no image server on static hosting; Plan 5 pre-optimizes files
  reactStrictMode: true,
};

export default nextConfig;
