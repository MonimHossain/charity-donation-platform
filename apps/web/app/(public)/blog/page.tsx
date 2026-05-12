"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import BlogCard from "@/components/blog/BlogCard";
import { fetchBlogPosts } from "@/lib/api";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  author?: string;
  tags?: string[];
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
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadPosts(p: number, q?: string) {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(p), limit: "12", published: "true" };
      if (q) params.search = q;
      const data = await fetchBlogPosts(params);
      setPosts(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPosts(page); }, [page]);

  const handleSearch = () => { setPage(1); loadPosts(1, search); };

  const [featured, ...rest] = posts;

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
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading articles...
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50 p-12 text-center">
            <p className="text-lg text-gray-500">No articles have been published yet.</p>
            <p className="mt-2 text-sm text-gray-400">Check back soon for stories and updates.</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featured && page === 1 && (
              <div className="mb-10">
                <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
                  <div className="grid md:grid-cols-[1.1fr_1fr]">
                    <div className="relative min-h-[320px] overflow-hidden md:min-h-[400px]">
                      {featured.featuredImage ? (
                        <img src={featured.featuredImage} alt={featured.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
                    </div>
                    <div className="flex flex-col justify-center p-8 md:p-10">
                      <p className="text-sm font-medium uppercase tracking-[0.3em] text-purple-500">Featured Article</p>
                      <div className="mt-3 h-0.5 w-12 rounded-full bg-purple-500" />
                      <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl">
                        <Link href={`/blog/${featured.slug}`} className="transition-colors hover:text-purple-700">
                          {clampText(featured.title, 95)}
                        </Link>
                      </h2>
                      {featured.excerpt && (
                        <p className="mt-4 text-lg leading-relaxed text-gray-500">{clampText(featured.excerpt, 150)}</p>
                      )}
                      <div className="mt-6 flex items-center gap-3 text-sm text-gray-400">
                        {featured.author && <span>{featured.author}</span>}
                        {featured.publishedAt && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-gray-300" />
                            <span>{formatDate(featured.publishedAt)}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-6">
                        <Link href={`/blog/${featured.slug}`} className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-purple-700 transition-colors hover:text-purple-900">
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

            {/* Posts Grid */}
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-purple-500">Latest Posts</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">Newest articles</h2>
              </div>
              {total > 0 && (
                <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
              )}
            </div>

            {rest.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
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
