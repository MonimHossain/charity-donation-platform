import type { Metadata } from "next";
import {
  buildMetadataFromEntitySeo,
  resolveEntitySeoForDisplay,
} from "@/lib/entity-seo-metadata";
import { buildBlogPostSchemaScripts, fetchPublicBlogPost } from "@/lib/blog-post-schema";
import { blogPostPublicPath } from "@/lib/public-paths";
import BlogPostPage from "@/components/blog/BlogPostPage";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourimpactdev.com";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPublicBlogPost(slug, { noStore: true });
  if (!post) {
    return { title: "Blog post" };
  }

  const canonicalPath = blogPostPublicPath(post.slug || slug);
  const seo = resolveEntitySeoForDisplay(
    post.seoSettings,
    {
      title: post.title,
      description: post.excerpt,
      excerpt: post.excerpt,
      image: post.featuredImage,
      tags: post.tags,
      canonicalPath,
    },
    { metaTitle: post.metaTitle, metaDescription: post.metaDescription }
  );

  return buildMetadataFromEntitySeo(seo, appUrl, {
    title: post.title,
    description: post.excerpt,
    canonicalPath,
  });
}

export default async function RootBlogPostPage({ params }: PageProps) {
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
      <BlogPostPage />
    </>
  );
}
