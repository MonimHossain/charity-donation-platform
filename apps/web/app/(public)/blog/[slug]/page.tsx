"use client";

import { USE_MOCK_DATA } from "@/lib/config";
import MockBlogPost from "./MockBlogPost";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Calendar, Clock, User, ChevronRight, Share2, Copy, Check } from "lucide-react";
import BlogContentRenderer from "@/components/blog/BlogContentRenderer";
import { BlogPostFaqs } from "@/components/blog/BlogPostFaqs";
import type { EntityFaqItem } from "@repo/shared-types";
import { fetchBlogPostBySlug, subscribeNewsletter } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/campaign-media";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  author?: string;
  tags?: string[];
  status?: string;
  metaTitle?: string;
  metaDescription?: string;
  seoSettings?: Record<string, unknown>;
  faqs?: EntityFaqItem[];
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function readingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) ?? "";
  if (USE_MOCK_DATA) return <MockBlogPost slug={slug} />;
  return <BlogDetailPageApi slug={slug} />;
}

function BlogDetailPageApi({ slug }: { slug: string }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchBlogPostBySlug(slug)
      .then((data) => { setPost(data); setNotFound(false); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubscribe = async () => {
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      await subscribeNewsletter(email);
      toast.success("Subscribed successfully!");
      setEmail("");
    } catch {
      toast.error("Failed to subscribe");
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading article...
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-gray-900">Article Not Found</h1>
        <p className="mt-2 text-gray-500">The article you're looking for doesn't exist or has been removed.</p>
        <Link href="/blog" className="mt-6 rounded-full bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors">
          Back to Blog
        </Link>
      </div>
    );
  }

  const minutes = readingTime(post.content);
  const authorInitials = (post.author || "ET")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const relatedTopics = (post.tags || []).slice(0, 5);
  const breadcrumbTitle = post.title.length > 38 ? `${post.title.slice(0, 38).trimEnd()}...` : post.title;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-white">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 py-12 lg:py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-purple-300">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-purple-400/70">{breadcrumbTitle}</span>
          </nav>

          <div className="mt-6">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-purple-300">Blog</p>
            <div className="mt-3 h-0.5 w-12 rounded-full bg-lime-400" />
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl max-w-5xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 max-w-4xl text-lg leading-relaxed text-purple-200">{post.excerpt}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
                  {authorInitials}
                </div>
                <span className="text-sm font-medium text-purple-200">{post.author || "Editorial Team"}</span>
              </div>
              {post.publishedAt && (
                <div className="flex items-center gap-1.5 text-sm text-purple-300">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.publishedAt)}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-purple-300">
                <Clock className="h-3.5 w-3.5" />
                {minutes} min read
              </div>
            </div>

            {(post.tags || []).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(post.tags || []).map((tag) => (
                  <span key={tag} className="rounded-full border border-purple-500/30 bg-purple-800/40 px-3 py-1 text-xs font-medium text-purple-200">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content Area */}
      <section className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          {/* Main Content */}
          <article className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            {post.featuredImage && (
              <img
                src={resolveMediaUrl(post.featuredImage) ?? post.featuredImage}
                alt={post.title}
                className="h-80 w-full rounded-xl object-cover mb-8"
              />
            )}
            <BlogContentRenderer content={post.content} />
            <BlogPostFaqs faqs={post.faqs || []} />
          </article>

          {/* Sidebar — sticks below site nav while reading the article */}
          <aside className="w-full lg:self-start">
            <div className="space-y-6 lg:sticky lg:top-20 lg:z-10 lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
            {/* Share Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-purple-600">Share</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-purple-50 hover:text-purple-700"
                  title="Share on X"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-purple-50 hover:text-purple-700"
                  title="Share on Facebook"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(post.title + " " + (typeof window !== "undefined" ? window.location.href : ""))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-purple-50 hover:text-purple-700"
                  title="Share on WhatsApp"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </a>
                <button
                  onClick={handleCopyLink}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-purple-50 hover:text-purple-700"
                  title="Copy link"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Related Topics */}
            {relatedTopics.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-purple-600">Related Topics</p>
                <ul className="mt-4 space-y-3">
                  {relatedTopics.map((tag) => (
                    <li key={tag} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Newsletter */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-purple-600">Stay Updated</p>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Subscribe to our newsletter for latest updates, stories, and insights.
              </p>
              <div className="mt-4 space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubscribe(); }}
                />
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="flex h-10 w-full items-center justify-center rounded-lg bg-purple-600 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
                >
                  {subscribing ? "Subscribing..." : "Subscribe"}
                </button>
              </div>
            </div>

            {/* Back to Blog */}
            <Link
              href="/blog"
              className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 text-sm font-medium text-purple-700 shadow-sm transition-colors hover:bg-purple-50"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
              </svg>
              Back to all articles
            </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
