"use client";

import Link from "next/link";
import { blogPostPublicPath } from "@/lib/public-paths";
import PageShell, { PageHero } from "@/components/site/PageShell";
import { demoBlogPosts } from "@/lib/mock/blog";
import { fmtDate } from "@/lib/mock/format";

export default function MockBlogList() {
  const posts = demoBlogPosts.filter((p) => p.status === "published");

  return (
    <PageShell title="Stories & Blog" description="Latest news from the field.">
      <PageHero eyebrow="Stories" title="Latest from the field." />
      <section className="container-wide py-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((p) => (
          <Link
            key={p.id}
            href={blogPostPublicPath(p.slug)}
            className="group rounded-3xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-lift"
          >
            <div className="aspect-[16/10] overflow-hidden">
              <img
                src={p.cover}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6">
              <p className="text-xs text-muted-foreground">{fmtDate(p.publishedAt)}</p>
              <h2 className="mt-2 font-serif text-2xl text-primary">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
            </div>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
