"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fetchBlogPosts } from "@/lib/api";
import { blogPostPublicPath } from "@/lib/public-paths";
import { resolveMediaUrl } from "@/lib/campaign-media";
import { imageAltFromSrc } from "@/lib/utils";

interface StoryPost {
  slug: string;
  title: string;
  excerpt?: string;
  featuredImage?: string;
  publishedAt?: string;
  categoryName?: string | null;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Stories() {
  const [posts, setPosts] = useState<StoryPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchBlogPosts({ limit: "3", page: "1" })
      .then((data) => {
        if (cancelled) return;
        setPosts(data.items || []);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || posts.length === 0) return null;

  return (
    <section className="container-wide py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-accent-deep font-semibold">
            Stories & Insight
          </p>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl text-primary text-balance">
            Latest from the field.
          </h2>
        </div>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
        >
          All stories <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            href={blogPostPublicPath(post.slug)}
            key={post.slug}
            className="group rounded-3xl bg-card border border-border p-2 hover:shadow-lift transition-all"
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-secondary">
              {post.featuredImage ? (
                <img
                  src={resolveMediaUrl(post.featuredImage) ?? post.featuredImage}
                  alt={imageAltFromSrc(resolveMediaUrl(post.featuredImage) ?? post.featuredImage)}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary" />
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
                {post.publishedAt && post.categoryName && (
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                )}
                {post.categoryName && (
                  <span className="text-accent-deep font-semibold uppercase tracking-wider">
                    {post.categoryName}
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-serif text-xl text-primary leading-snug group-hover:text-primary-glow transition-colors">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
