"use client";

import Link from "next/link";
import { resolveMediaUrl } from "@/lib/campaign-media";
import { blogPostPublicPath } from "@/lib/public-paths";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  author?: string;
  tags?: string[];
  categoryName?: string | null;
  publishedAt?: string;
}

function clampText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function BlogCard({ post }: { post: BlogPost }) {
  const title = clampText(post.title, 90);
  const authorInitials = (post.author || "ET")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative overflow-hidden">
        {post.featuredImage ? (
          <img
            src={resolveMediaUrl(post.featuredImage) ?? post.featuredImage}
            alt={post.title}
            className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-56 w-full bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 h-0.5 w-16 rounded-full bg-purple-500" />

        {post.categoryName && (
          <span className="mb-2 inline-flex rounded-full bg-purple-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-purple-700">
            {post.categoryName}
          </span>
        )}

        <h2 className="text-xl font-bold leading-tight text-gray-900">
          <Link href={blogPostPublicPath(post.slug)} className="line-clamp-2 transition-colors duration-200 hover:text-purple-700">
            {title}
          </Link>
        </h2>

        {post.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
            {clampText(post.excerpt, 120)}
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
              {authorInitials || "ET"}
            </div>
            <span>{post.author || "Editorial Team"}</span>
            {post.publishedAt && (
              <>
                <span className="h-1 w-1 rounded-full bg-gray-300" />
                <span>{formatDate(post.publishedAt)}</span>
              </>
            )}
          </div>

          {(post.tags || []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(post.tags || []).slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full border border-purple-200 bg-purple-50 px-3 py-0.5 text-[11px] font-medium text-purple-700">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-gray-100 pt-3">
          <Link href={blogPostPublicPath(post.slug)} className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 transition-colors hover:text-purple-900">
            Read Article
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
