"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/site/PageShell";
import { getBlogBySlug } from "@/lib/mock/blog";
import { fmtDate } from "@/lib/mock/format";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function MockBlogPost({ slug }: { slug: string }) {
  const router = useRouter();
  const post = getBlogBySlug(slug);

  if (!post) {
    router.replace("/blog");
    return null;
  }

  return (
    <PageShell title={post.title} description={post.excerpt}>
      <article className="container-prose py-16">
        <Button variant="ghost" asChild className="mb-8 -ml-2">
          <Link href="/blog">
            <ArrowLeft className="w-4 h-4" /> All stories
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          {fmtDate(post.publishedAt)} · {post.author}
        </p>
        <h1 className="mt-4 font-serif text-4xl md:text-5xl text-primary">{post.title}</h1>
        <div className="mt-8 aspect-[21/9] rounded-3xl overflow-hidden">
          <img src={post.cover} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="mt-10 prose prose-lg max-w-none text-foreground/90 whitespace-pre-wrap">
          {post.body ?? post.excerpt}
        </div>
      </article>
    </PageShell>
  );
}
