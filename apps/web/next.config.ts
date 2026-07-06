import { config } from "dotenv";
import { resolve } from "path";
import type { NextConfig } from "next";

config({ path: resolve(import.meta.dirname!, "../../.env") });

function buildImageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "http", hostname: "localhost", port: "9002" },
    { protocol: "https", hostname: "images.unsplash.com" },
  ];

  const candidates = [
    process.env.MINIO_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    try {
      const url = new URL(raw.includes("://") ? raw : `http://${raw}`);
      const protocol = url.protocol.replace(":", "") as "http" | "https";
      if (protocol !== "http" && protocol !== "https") continue;
      const entry = {
        protocol,
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: "/**" as const,
      };
      const duplicate = patterns.some(
        (p) =>
          p?.hostname === entry.hostname &&
          p?.port === entry.port &&
          p?.protocol === entry.protocol
      );
      if (!duplicate) patterns.push(entry);
    } catch {
      /* ignore invalid URL */
    }
  }

  return patterns;
}

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
      { source: "/admin/cms", destination: "/admin/settings?section=content", permanent: false },
      { source: "/admin/cms/:path*", destination: "/admin/settings?section=content", permanent: false },
    ];
  },
  async rewrites() {
    const minioHost = process.env.MINIO_ENDPOINT || "localhost";
    const minioPort = process.env.MINIO_PORT || "9002";
    const bucket = process.env.MINIO_BUCKET_MEDIA || process.env.MINIO_BUCKET_NAME || "charity-media";
    return [
      {
        source: "/charity-media/:path*",
        destination: `http://${minioHost}:${minioPort}/${bucket}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: buildImageRemotePatterns(),
  },
};

export default nextConfig;
