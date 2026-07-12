import {
  buildEntitySchemaScripts,
  resolveEntitySeoForDisplay,
} from "@/lib/entity-seo-metadata";
import { blogPostPublicPath } from "@/lib/public-paths";

const apiBase = () =>
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourimpactdev.com";

export async function fetchPublicBlogPost(slug: string, options?: { noStore?: boolean }) {
  try {
    const res = await fetch(`${apiBase()}/blog/${encodeURIComponent(slug)}`, {
      ...(options?.noStore ? { cache: "no-store" as const } : { next: { revalidate: 60 } }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function buildBlogPostSchemaScripts(slug: string): Promise<object[]> {
  const post = await fetchPublicBlogPost(slug);
  if (!post) return [];

  const pageUrl = `${appUrl.replace(/\/$/, "")}${blogPostPublicPath(slug)}`;
  const schemaType = post.seoSettings?.schemaType?.trim() || "Article";
  const seo = resolveEntitySeoForDisplay(
    post.seoSettings,
    {
      title: post.title,
      description: post.excerpt,
      excerpt: post.excerpt,
      image: post.featuredImage,
      tags: post.tags,
      canonicalPath: blogPostPublicPath(slug),
    },
    { metaTitle: post.metaTitle, metaDescription: post.metaDescription }
  );

  return buildEntitySchemaScripts({
    seoSettings: post.seoSettings,
    faqs: post.faqs || [],
    pageUrl,
    defaultSchema: {
      "@type": schemaType,
      headline: seo.metaTitle || post.title,
      description: seo.metaDescription || post.excerpt,
      image: post.featuredImage,
      datePublished: post.publishedAt,
      author: { "@type": "Person", name: post.author || "Editorial Team" },
      mainEntityOfPage: pageUrl,
    },
  });
}
