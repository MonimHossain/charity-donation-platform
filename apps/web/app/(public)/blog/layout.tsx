import type { Metadata } from "next";

const apiBase = () =>
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

async function fetchBlogSeo() {
  try {
    const res = await fetch(`${apiBase()}/cms/seo?pagePath=${encodeURIComponent("/blog")}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await fetchBlogSeo();
  return {
    title: seo?.metaTitle || "Blog",
    description: seo?.metaDescription || "Stories and updates from our charity.",
    openGraph: {
      title: seo?.ogTitle || seo?.metaTitle || "Blog",
      description: seo?.ogDescription || seo?.metaDescription,
      images: seo?.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
    robots: seo?.noIndex ? { index: false, follow: false } : undefined,
  };
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
