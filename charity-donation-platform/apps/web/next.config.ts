import { config } from "dotenv";
import { resolve } from "path";
import type { NextConfig } from "next";

config({ path: resolve(import.meta.dirname!, "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/shared-types", "@repo/ui"],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9002" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
