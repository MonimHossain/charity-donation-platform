import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { demoBlogPosts } from "@/lib/mock/blog";
import { fmtDate } from "@/lib/mock/format";

const posts = demoBlogPosts
  .filter((p) => p.status === "published")
  .slice(0, 3)
  .map((p) => ({
    slug: p.slug,
    title: p.title,
    date: fmtDate(p.publishedAt),
    category: "Stories",
    excerpt: p.excerpt,
    image: p.cover,
  }));

const Stories = () => (
  <section className="container-wide py-24">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
      <div className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.25em] text-accent-deep font-semibold">Stories & Insight</p>
        <h2 className="mt-3 font-serif text-4xl md:text-5xl text-primary text-balance">Latest from the field.</h2>
      </div>
      <Link href="/blog" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
        All stories <ArrowRight className="w-4 h-4" />
      </Link>
    </div>

    <div className="grid md:grid-cols-3 gap-6">
      {posts.map((p) => (
        <Link href={`/blog/${p.slug}`} key={p.slug} className="group rounded-3xl bg-card border border-border p-2 hover:shadow-lift transition-all">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-secondary">
            <img src={p.image} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{p.date}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <span className="text-accent-deep font-semibold uppercase tracking-wider">{p.category}</span>
            </div>
            <h3 className="mt-3 font-serif text-xl text-primary leading-snug group-hover:text-primary-glow transition-colors">{p.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
          </div>
        </Link>
      ))}
    </div>
  </section>
);

export default Stories;
