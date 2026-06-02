"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usePublishedDonationPages } from "@/lib/data/featured-donation-pages";
import { Button } from "@/components/ui/button";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=70";

export default function FeaturedDonationPages() {
  const { data, isLoading } = usePublishedDonationPages(50);
  const pages = (data ?? []) as Array<any>;

  return (
    <section className="container-wide py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-accent-deep font-semibold">Donation Pages</p>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl text-primary text-balance">
            Choose how you want to <span className="underline-brush">give</span>.
          </h2>
        </div>
        <p className="text-muted-foreground max-w-md">
          Quick, focused donation pages for specific giving types (Fidya, Kaffarah, Ramadan nights and more).
        </p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <article
              key={p.id}
              className="group relative rounded-3xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-lift transition-all duration-500 flex flex-col"
            >
              <Link href={`/donation/${p.slug}`} className="block">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={p.image || FALLBACK_IMAGE}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
                    <p className="text-xs uppercase tracking-widest text-primary-foreground/80 font-semibold">
                      {p.category || "General"}
                    </p>
                    <h3 className="font-serif text-2xl leading-tight">{p.title}</h3>
                  </div>
                </div>
              </Link>

              <div className="p-6 flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {p.shortDescription || "—"}
                </p>
                <div className="mt-5">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Link href={`/donation/${p.slug}`}>
                      Open page <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
          {pages.length === 0 && (
            <p className="text-muted-foreground">No published donation pages yet.</p>
          )}
        </div>
      )}
    </section>
  );
}

