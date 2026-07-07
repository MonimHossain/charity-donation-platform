import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(
  /\/$/,
  ""
);

const STATIC_PATHS = [
  "/",
  "/blog",
  "/donate",
  "/contact",
  "/campaigns",
  "/about",
  "/zakat",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.8,
  }));

  try {
    const [campaignsRes, blogRes] = await Promise.all([
      fetch(`${apiBase}/campaigns`, { next: { revalidate: 3600 } }),
      fetch(`${apiBase}/blog?status=published&limit=500`, { next: { revalidate: 3600 } }),
    ]);

    if (campaignsRes.ok) {
      const campaigns = await campaignsRes.json();
      const list = Array.isArray(campaigns) ? campaigns : campaigns?.items ?? [];
      for (const c of list) {
        if (!c?.slug) continue;
        entries.push({
          url: `${siteUrl}/campaigns/${c.slug}`,
          lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }

    if (blogRes.ok) {
      const blogData = await blogRes.json();
      const posts = Array.isArray(blogData) ? blogData : blogData?.items ?? [];
      for (const p of posts) {
        if (!p?.slug) continue;
        entries.push({
          url: `${siteUrl}/blog/${p.slug}`,
          lastModified: p.updatedAt || p.publishedAt ? new Date(p.updatedAt || p.publishedAt) : now,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  } catch {
    /* static routes only */
  }

  return entries;
}
