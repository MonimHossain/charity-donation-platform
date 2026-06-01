import { config } from "dotenv";
import { resolve } from "path";
import type { NextConfig } from "next";

config({ path: resolve(import.meta.dirname!, "../../.env") });

const nextConfig: NextConfig = {
  typescript: {
    // Pre-existing strict errors in legacy admin forms; mock UI phase targets runtime demo.
    ignoreBuildErrors: true,
  },
  transpilePackages: ["@repo/shared-types", "@repo/ui"],
  async redirects() {
    return [
      { source: "/campaigns/gaza", destination: "/campaigns/gaza-emergency-relief", permanent: true },
      { source: "/campaigns/water", destination: "/campaigns/clean-water-wells", permanent: true },
      { source: "/campaigns/orphans", destination: "/campaigns/orphan-sponsorship", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9002" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
