import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // export estatico nao tem o endpoint /_next/image; sem isso a logo 404
  images: { unoptimized: true },
};

export default nextConfig;
