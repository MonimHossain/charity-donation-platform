"use client";

import { USE_MOCK_DATA } from "@/lib/config";
import MockBlogList from "./MockBlogList";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import BlogCard from "@/components/blog/BlogCard";
import { fetchBlogPosts, fetchBlogCategories } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/campaign-media";
import { cn } from "@/lib/utils";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  author?: string;
  tags?: string[];
  categoryId?: string | null;
  categoryName?: string | null;
  isFeatured?: boolean;
  publishedAt?: string;
  createdAt?: string;
}

function clampText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function BlogListingPage() {
  if (USE_MOCK_DATA) return <MockBlogList />;
  return <BlogListingPageApi />;
}

function BlogListingPageApi() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : data.items || []))
      .catch(() => setCategories([]));
  }, []);

  async function loadPosts(p: number, q?: string, categoryId?: string | null) {
    setLoading(true);
    try {
      const sharedParams: Record<string, string> = {};
      if (q) sharedParams.search = q;
      if (categoryId) sharedParams.categoryId = categoryId;

      let featured: BlogPost | null = null;
      if (p === 1) {
        const featuredData = await fetchBlogPosts({
          ...sharedParams,
          featured: "true",
          limit: "1",
          page: "1",
        });
        featured = featuredData.items?.[0] ?? null;
      }

      const listParams: Record<string, string> = {
        ...sharedParams,
        page: String(p),
        limit: "12",
      };
      if (featured?.id) listParams.excludeId = featured.id;

      const data = await fetchBlogPosts(listParams);
      setFeaturedPost(p === 1 ? featured : null);
      setPosts(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setFeaturedPost(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts(page, search, selectedCategoryId);
  }, [page, selectedCategoryId]);

  const handleSearch = () => {
    setPage(1);
    loadPosts(1, search, selectedCategoryId);
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 to-white">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 py-16 lg:py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="container mx-auto max-w-6xl px-4 relative">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-purple-300">Our Blog</p>
          <div className="mt-3 h-0.5 w-12 rounded-full bg-lime-400" />
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Stories & Updates
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-purple-200">
            Read about our latest campaigns, impact stories, and guidance from our editorial team.
          </p>

          <div className="mt-8 flex max-w-md gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                placeholder="Search articles..."
                className="h-11 w-full rounded-full border border-purple-500/30 bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-purple-300 outline-none backdrop-blur-sm transition-all focus:border-purple-400 focus:bg-white/15 focus:ring-2 focus:ring-purple-400/20"
              />
            </div>
            <button onClick={handleSearch} className="h-11 rounded-full bg-lime-400 px-6 text-sm font-semibold text-purple-900 transition-colors hover:bg-lime-300">
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-12">
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCategoryChange(null)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                selectedCategoryId === null
                  ? "bg-purple-600 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-700"
              )}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryChange(category.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  selectedCategoryId === category.id
                    ? "bg-purple-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-700"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading articles...
          </div>
        ) : posts.length === 0 && !featuredPost ? (
          <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50 p-12 text-center">
            <p className="text-lg text-gray-500">No articles have been published yet.</p>
            <p className="mt-2 text-sm text-gray-400">Check back soon for stories and updates.</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && page === 1 && (
              <div className="mb-10">
                <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
                  <div className="grid md:grid-cols-[1.1fr_1fr]">
                    <div className="relative min-h-[320px] overflow-hidden md:min-h-[400px]">
                      {featuredPost.featuredImage ? (
                        <img src={resolveMediaUrl(featuredPost.featuredImage) ?? featuredPost.featuredImage} alt={featuredPost.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
                    </div>
                    <div className="flex flex-col justify-center p-8 md:p-10">
                      <p className="text-sm font-medium uppercase tracking-[0.3em] text-purple-500">Featured Article</p>
                      <div className="mt-3 h-0.5 w-12 rounded-full bg-purple-500" />
                      <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl">
                        <Link href={`/blog/${featuredPost.slug}`} className="transition-colors hover:text-purple-700">
                          {clampText(featuredPost.title, 95)}
                        </Link>
                      </h2>
                      {featuredPost.excerpt && (
                        <p className="mt-4 text-lg leading-relaxed text-gray-500">{clampText(featuredPost.excerpt, 150)}</p>
                      )}
                      <div className="mt-6 flex items-center gap-3 text-sm text-gray-400">
                        {featuredPost.categoryName && (
                          <>
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-purple-700">
                              {featuredPost.categoryName}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-gray-300" />
                          </>
                        )}
                        {featuredPost.author && <span>{featuredPost.author}</span>}
                        {featuredPost.publishedAt && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-gray-300" />
                            <span>{formatDate(featuredPost.publishedAt)}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-6">
                        <Link href={`/blog/${featuredPost.slug}`} className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-purple-700 transition-colors hover:text-purple-900">
                          Read Article
                          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            )}

            {(posts.length > 0 || featuredPost) && (
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.3em] text-purple-500">Latest Posts</p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-900">Newest articles</h2>
                </div>
                {total > 0 && (
                  <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
                )}
              </div>
            )}

            {posts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            ) : page > 1 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            ) : null}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-purple-50 hover:text-purple-700 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) p = i + 1;
                  else if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                        p === page ? "bg-purple-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-purple-50"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-purple-50 hover:text-purple-700 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
