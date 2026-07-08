import type { Metadata } from "next";
import {
  buildMetadataFromEntitySeo,
  resolveEntitySeoForDisplay,
} from "@/lib/entity-seo-metadata";
import { buildBlogPostSchemaScripts, fetchPublicBlogPost } from "@/lib/blog-post-schema";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourimpactdev.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPublicBlogPost(slug, { noStore: true });
  if (!post) {
    return { title: "Blog post" };
  }

  const seo = resolveEntitySeoForDisplay(
    post.seoSettings,
    {
      title: post.title,
      description: post.excerpt,
      excerpt: post.excerpt,
      image: post.featuredImage,
      tags: post.tags,
      canonicalPath: `/blog/${post.slug}`,
    },
    { metaTitle: post.metaTitle, metaDescription: post.metaDescription }
  );

  return buildMetadataFromEntitySeo(seo, appUrl, {
    title: post.title,
    description: post.excerpt,
    canonicalPath: `/blog/${post.slug}`,
  });
}

export default async function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scripts = await buildBlogPostSchemaScripts(slug);

  return (
    <>
      {scripts.map((schema, index) => (
        <script
          key={`blog-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {children}
    </>
  );
}
