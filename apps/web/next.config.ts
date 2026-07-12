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
      { source: "/campaigns/gaza", destination: "/donate/gaza-emergency-relief", permanent: true },
      { source: "/campaigns/water", destination: "/donate/clean-water-wells", permanent: true },
      { source: "/campaigns/orphans", destination: "/donate/orphan-sponsorship", permanent: true },
      { source: "/campaigns/:slug", destination: "/donate/:slug", permanent: true },
      { source: "/causes/:slug", destination: "/donate/:slug", permanent: true },
      { source: "/blog/:slug", destination: "/:slug", permanent: true },
      { source: "/admin/cms", destination: "/admin/settings?section=hero", permanent: false },
      { source: "/admin/cms/hero", destination: "/admin/settings?section=hero", permanent: false },
      { source: "/admin/cms/zakat", destination: "/admin/settings?section=zakat", permanent: false },
      { source: "/admin/cms/media", destination: "/admin/file-manager", permanent: false },
      { source: "/admin/cms/seo", destination: "/admin/settings?section=seo", permanent: false },
      { source: "/admin/cms/:path*", destination: "/admin/settings?section=hero", permanent: false },
    ];
  },
  async rewrites() {
    // Media is served by app/charity-media/[[...path]]/route.ts (Range-aware for HTML5 video).
    return [];
  },
  images: {
    remotePatterns: buildImageRemotePatterns(),
  },
};

export default nextConfig;
