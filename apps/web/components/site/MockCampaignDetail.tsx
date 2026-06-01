"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/site/PageShell";
import QuickDonate from "@/components/home/QuickDonate";
import TrustBadges from "@/components/home/TrustBadges";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  AlertTriangle,
  Calendar,
  Users,
  Heart,
  Share2,
} from "lucide-react";
import { fmtMoney } from "@/lib/mock/format";
import { getRecentDonationsForCampaign } from "@/lib/mock/donations";
import { getCampaignBySlug, useCampaigns } from "@/lib/stores/campaignStore";

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
  const daysLeft = c.deadline
    ? Math.max(0, Math.ceil((+new Date(c.deadline) - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <PageShell title={`${c.title} — Donate`} description={c.summary.slice(0, 155)}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/85" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="container-wide pt-12 pb-16 lg:pt-16 lg:pb-20">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 min-w-0">
              {c.urgent && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" /> Urgent
                </span>
              )}
              <p className="mt-4 text-sm uppercase tracking-[0.25em] font-bold text-accent">{c.tag}</p>
              <h1 className="mt-3 font-serif text-4xl md:text-5xl lg:text-6xl text-primary-foreground">{c.title}</h1>
              <p className="mt-5 text-lg text-primary-foreground/90 max-w-xl">{c.summary}</p>
              <div className="mt-8 max-w-md rounded-2xl bg-card p-5 shadow-lift">
                <div className="flex justify-between text-sm font-semibold">
                  <span>{fmtMoney(c.raised, c.currency)} raised</span>
                  <span>{fmtMoney(c.goal, c.currency)} goal</span>
                </div>
                <Progress value={pct} className="mt-3 h-2" />
                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {c.donors.toLocaleString()} donors
                  </span>
                  <span>{pct}% funded</span>
                  {daysLeft !== null && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {daysLeft}d left
                    </span>
                  )}
                </div>
              </div>
            </div>
            <aside className="lg:col-span-5 lg:sticky lg:top-24">
              <QuickDonate campaign={c.slug} variant="dark" defaultAmount={50} />
            </aside>
          </div>
        </div>
      </section>

      <TrustBadges />

      <section className="container-wide py-16 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <h2 className="font-serif text-3xl text-primary">Why this matters</h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{c.description}</p>
          <div className="mt-8 flex gap-3">
            <Button asChild className="rounded-full bg-accent hover:bg-accent/90">
              <Link href={`/donate?cause=${slug}`}>
                Donate now <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full">
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
        </div>
        <div className="lg:col-span-4">
          <h3 className="font-serif text-xl text-primary flex items-center gap-2">
            <Heart className="w-5 h-5 text-accent" /> Recent supporters
          </h3>
          <ul className="mt-4 space-y-3">
            {recentDonations.map((d) => (
              <li key={d.id} className="text-sm border-b border-border pb-2">
                <span className="font-medium">{d.donorName}</span>
                <span className="text-muted-foreground"> · {fmtMoney(d.amount, d.currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PageShell>
  );
}
