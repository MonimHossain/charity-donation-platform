"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QuickDonate from "@/components/home/QuickDonate";
import TrustBadges from "@/components/home/TrustBadges";
import PageShell from "@/components/site/PageShell";
import { ArrowRight, AlertTriangle, Heart, Share2, Users } from "lucide-react";
import { fmtMoney } from "@/lib/mock/format";
import { getRecentDonationsForCampaign } from "@/lib/mock/donations";
import { getCampaignBySlug, useCampaigns } from "@/lib/stores/campaignStore";
import { Button } from "@/components/ui/button";

function donorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export default function MockCampaignDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const all = useCampaigns();
  const c = getCampaignBySlug(slug) ?? all.find((x) => x.slug === slug);

  useEffect(() => {
    if (!c) router.replace("/appeals");
  }, [c, router]);

  if (!c) return null;

  const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
  const recentDonations = getRecentDonationsForCampaign(c.id, 6);
  const related = all.filter((x) => x.slug !== slug).slice(0, 3);

  return (
    <PageShell title={`${c.title} — Donate`} description={c.summary.slice(0, 155)}>
      <section className="bg-background">
        <div className="container-wide pt-8 pb-16 lg:pt-12 lg:pb-20">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-7 xl:col-span-8 min-w-0">
              <div className="mb-6 rounded-3xl overflow-hidden border border-border shadow-lift aspect-[16/9] bg-muted">
                <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
              </div>
              {c.urgent && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" /> Urgent
                </span>
              )}
              <p className="mt-4 text-sm uppercase tracking-[0.25em] font-bold text-accent-deep">
                {c.tag}
              </p>
              <h1 className="mt-3 font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-primary">
                {c.title}
              </h1>
              <p className="mt-5 text-lg max-w-xl font-medium leading-relaxed text-muted-foreground">
                {c.summary}
              </p>
              <div className="mt-8 max-w-md rounded-2xl bg-card text-primary p-5 border border-border shadow-lift">
                <div className="flex items-end justify-between text-sm font-semibold">
                  <div>
                    <p className="text-primary/70 text-[11px] uppercase tracking-widest">Raised</p>
                    <p className="font-serif text-2xl mt-0.5">{fmtMoney(c.raised, c.currency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary/70 text-[11px] uppercase tracking-widest">Goal</p>
                    <p className="font-serif text-2xl mt-0.5">{fmtMoney(c.goal, c.currency)}</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-primary/15 overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-primary/80">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> {c.donors.toLocaleString()} donors
                  </span>
                  <span className="font-semibold text-accent">{pct}% funded</span>
                </div>
              </div>
            </div>
            <aside className="lg:col-span-5 xl:col-span-4">
              <QuickDonate campaign={c.slug} defaultAmount={50} />
            </aside>
            <div className="lg:col-span-12 min-w-0">
              <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">
                Campaign overview
              </p>
              <div className="mt-4 rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft">
                <div className="space-y-7 text-foreground">
                  <p className="text-base md:text-lg text-foreground/85 leading-relaxed whitespace-pre-line">
                    {c.description}
                  </p>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="h-12 px-8 text-base rounded-full bg-accent text-accent-foreground hover:bg-accent-deep shadow-soft hover:shadow-glow"
                >
                  <Link href={`/donate?cause=${slug}`}>
                    Donate now <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 px-8 text-base rounded-full bg-primary-foreground/95"
                >
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {recentDonations.length > 0 && (
        <section className="bg-secondary/30 border-y border-border">
          <div className="container-wide py-16">
            <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">Recent donations</p>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl text-primary">
              Join {c.donors.toLocaleString()} donors who already gave
            </h2>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentDonations.map((d) => (
                <div
                  key={d.id}
                  className="rounded-2xl bg-card border border-border p-5 hover:shadow-soft transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                        {donorInitials(d.donorName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{d.donorName}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">
                          {d.frequency} · {new Date(d.createdAt).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    </div>
                    <p className="font-serif text-xl text-primary whitespace-nowrap">
                      {fmtMoney(d.amount, d.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-wide py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-10 lg:p-14 text-center">
          <Heart className="w-10 h-10 text-accent mx-auto" />
          <h2 className="mt-4 font-serif text-3xl md:text-4xl">
            Your gift makes a real difference today.
          </h2>
          <Button
            asChild
            className="mt-6 h-12 max-w-full px-6 sm:px-8 text-base rounded-full bg-accent text-accent-foreground hover:bg-accent-deep shadow-soft"
          >
            <Link
              href={`/donate?cause=${slug}`}
              title={`Donate to ${c.title}`}
              className="inline-flex max-w-full items-center gap-2 overflow-hidden"
            >
              <span className="min-w-0 truncate">Donate to {c.title}</span>
            </Link>
          </Button>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-wide pb-20">
          <h2 className="font-serif text-2xl text-primary mb-6">Other ways you can help</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/causes/${r.slug}`}
                className="group rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative h-32 overflow-hidden">
                  <img src={r.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
                  <h3 className="absolute bottom-3 left-4 right-4 text-primary-foreground font-serif text-lg leading-tight">
                    {r.title}
                  </h3>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground line-clamp-2">{r.summary}</p>
                  <p className="mt-3 text-accent-deep font-semibold text-sm flex items-center gap-1">
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <TrustBadges />
    </PageShell>
  );
}
