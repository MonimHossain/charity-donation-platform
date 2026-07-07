import {
  buildFaqSchemaJsonLd,
  parseCustomSchemaJson,
} from "@/lib/entity-seo-metadata";

const apiBase = () =>
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourimpactdev.com";

export async function fetchPublicBlogPost(slug: string) {
  try {
    const res = await fetch(`${apiBase()}/blog/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
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

  const scripts: object[] = [];
  const custom = parseCustomSchemaJson(post.seoSettings?.customSchemaJson);
  if (custom) scripts.push(custom);

  const pageUrl = `${appUrl.replace(/\/$/, "")}/blog/${slug}`;
  const faqSchema = buildFaqSchemaJsonLd(post.faqs || [], pageUrl);
  if (faqSchema) scripts.push(faqSchema);

  const schemaType = post.seoSettings?.schemaType?.trim() || "Article";
  if (!custom) {
    scripts.push({
      "@context": "https://schema.org",
      "@type": schemaType,
      headline: post.title,
      description: post.excerpt || post.seoSettings?.metaDescription,
      image: post.featuredImage,
      datePublished: post.publishedAt,
      author: { "@type": "Person", name: post.author || "Editorial Team" },
      mainEntityOfPage: pageUrl,
    });
  }

  return scripts;
}
