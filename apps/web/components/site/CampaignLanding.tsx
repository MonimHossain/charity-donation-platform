"use client";

import Link from "next/link";
import PageShell from "@/components/site/PageShell";
import { statValueSmClass } from "@/lib/home-buttons";
import QuickDonate from "@/components/home/QuickDonate";
import TrustBadges from "@/components/home/TrustBadges";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { useCurrency } from "@/lib/currency";
import { imageAltFromSrc } from "@/lib/utils";

export interface CampaignLandingProps {
  slug: string;
  title: string;
  eyebrow: string;
  urgent?: boolean;
  hero: string;
  intro: string;
  stats: Array<{ value: string; label: string }>;
  bullets: string[];
  raised: number;
  goal: number;
}

export default function CampaignLanding({
  slug,
  title,
  eyebrow,
  urgent,
  hero,
  intro,
  stats,
  bullets,
  raised,
  goal,
}: CampaignLandingProps) {
  const { formatMoney } = useCurrency();
  const pct = Math.min(100, Math.round((raised / goal) * 100));

  return (
    <PageShell
      title={`${title} — Donate | Your Impact Foundation`}
      description={intro.slice(0, 155)}
    >
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={hero} alt={imageAltFromSrc(hero)} className="w-full h-full object-cover" />
          <div className="absolute inset-0 gradient-hero" />
        </div>
        <div className="container-wide pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 text-primary-foreground">
            {urgent && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold uppercase tracking-wider animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" /> Urgent appeal
              </span>
            )}
            <p className="mt-4 text-sm uppercase tracking-[0.25em] text-accent font-semibold">{eyebrow}</p>
            <h1 className="mt-3 font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-balance">{title}</h1>
            <p className="mt-5 text-lg text-primary-foreground/85 max-w-xl text-pretty">{intro}</p>
            <div className="mt-8 max-w-md">
              <div className="flex justify-between text-sm font-semibold">
                <span>{formatMoney(raised, { from: "GBP" })} raised</span>
                <span className="text-accent">{pct}%</span>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-primary-foreground/15 overflow-hidden">
                <div
                  className="h-full gradient-accent rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-primary-foreground/70">Goal: {formatMoney(goal, { from: "GBP" })}</p>
            </div>
          </div>
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <QuickDonate campaign={slug} variant="dark" defaultAmount={50} />
          </div>
        </div>
      </section>

      <TrustBadges />

      <section className="container-wide py-16 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <h2 className="font-serif text-3xl md:text-4xl text-primary">Where your donation goes</h2>
          <ul className="mt-6 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex gap-3 text-foreground/85">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex gap-3 flex-wrap">
            <Button asChild variant="default" size="lg" className="rounded-full bg-accent hover:bg-primary hover:text-primary-foreground">
              <Link href={`/donate?cause=${slug}`}>
                Donate to {title} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href="/appeals">All appeals</Link>
            </Button>
          </div>
        </div>
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-secondary/60 border border-border p-6">
              <p className={statValueSmClass}>{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
