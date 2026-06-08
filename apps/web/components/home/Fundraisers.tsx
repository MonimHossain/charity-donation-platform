"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Users, Target, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHomepageFundraisers } from "@/lib/data/campaigns";
import { getCampaignCardImage } from "@/lib/campaign-media";

type Fundraiser = {
  slug: string;
  title: string;
  tag: string;
  image: string;
  raised: number;
  goal: number;
  donors: number;
  currency: string;
  endsAt: number;
  urgent?: boolean;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  CAD: "C$",
  AUD: "A$",
};

function mapFundraiser(c: Record<string, unknown>): Fundraiser | null {
  if (String(c.campaignMode ?? "") !== "fundraiser") return null;

  const fs = (c.fundraiserSettings ?? {}) as {
    targetAmount?: number;
    raisedAmount?: number;
    endDate?: string;
  };

  const endSource =
    fs.endDate ||
    (c.expirationEnabled && c.expiresAt ? String(c.expiresAt) : "");
  const parsedEnd = endSource ? Date.parse(endSource) : NaN;
  const endsAt = Number.isNaN(parsedEnd)
    ? Date.now() + 30 * 86_400_000
    : parsedEnd;

  const goal = Number(fs.targetAmount ?? 0);
  const raised = Number(fs.raisedAmount ?? 0);

  return {
    slug: String(c.slug),
    title: String(c.title),
    tag: String(c.category ?? "Fundraiser"),
    image: getCampaignCardImage({
      thumbnail: c.thumbnail as string | undefined,
      banner: c.banner as string | undefined,
      featuredImage: c.featuredImage as string | undefined,
      image: c.image as string | undefined,
    }),
    raised,
    goal: goal > 0 ? goal : 1,
    donors: Number(c.donorCount ?? 0),
    currency: String(c.currency ?? "GBP"),
    endsAt,
    urgent: Boolean(c.isUrgent),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

const useCountdown = (target: number) => {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = now === null ? null : Math.max(0, target - now);
  return {
    ready: now !== null,
    days: Math.floor((diff ?? 0) / 86_400_000),
    hours: Math.floor(((diff ?? 0) % 86_400_000) / 3_600_000),
    minutes: Math.floor(((diff ?? 0) % 3_600_000) / 60_000),
    seconds: Math.floor(((diff ?? 0) % 60_000) / 1000),
    ended: diff !== null && diff === 0,
  };
};

const FundraiserCard = ({ f }: { f: Fundraiser }) => {
  const { ready, days, hours, minutes, seconds, ended } = useCountdown(f.endsAt);
  const pct = Math.min(100, Math.round((f.raised / f.goal) * 100));
  const pending = Math.max(0, f.goal - f.raised);
  const sym = CURRENCY_SYMBOLS[f.currency] || "£";
  const fmt = (n: number) => `${sym}${n.toLocaleString()}`;

  return (
    <article className="group relative rounded-3xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-lift transition-all duration-500 flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={f.image}
          alt={f.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src.includes("hero-1.webp")) return;
            img.src = "/images/hero-1.webp";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 rounded-full bg-background/95 text-primary text-xs font-semibold capitalize">
            {f.tag}
          </span>
          {f.urgent && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold uppercase tracking-wider animate-pulse">
              <Flame className="w-3 h-3" /> Urgent
            </span>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
          <h3 className="font-serif text-2xl leading-tight">{f.title}</h3>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="font-serif text-2xl text-primary">{fmt(f.raised)}</p>
              <p className="text-xs text-muted-foreground">raised of {fmt(f.goal)} goal</p>
            </div>
            <span className="text-accent-deep font-bold text-lg tabular-nums">{pct}%</span>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full gradient-accent rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> {f.donors.toLocaleString()} donors
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> {fmt(pending)} pending
            </span>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-secondary/60 border border-border p-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            <Clock className="w-3.5 h-3.5" /> {ended ? "Campaign ended" : "Ends in"}
          </p>
          {!ended && (
            <div className="mt-2 grid grid-cols-4 gap-2 text-center">
              {[
                { v: days, l: "Days" },
                { v: hours, l: "Hrs" },
                { v: minutes, l: "Min" },
                { v: seconds, l: "Sec" },
              ].map((t) => (
                <div key={t.l} className="rounded-lg bg-background py-2">
                  <p className="font-mono font-bold text-xl text-primary tabular-nums">
                    {ready ? pad(t.v) : "--"}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.l}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button asChild size="lg" className="mt-5 rounded-full w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href={`/campaigns/${f.slug}`}>
            Donate now <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
};

const Fundraisers = () => {
  const { data, isLoading } = useHomepageFundraisers();

  const fundraisers = (data?.items ?? [])
    .map((c) => mapFundraiser(c as Record<string, unknown>))
    .filter((f): f is Fundraiser => f !== null);

  if (isLoading || fundraisers.length === 0) {
    return null;
  }

  return (
    <section className="container-wide py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-accent-deep font-semibold">Live Fundraisers</p>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl text-primary text-balance">
            Track <span className="underline-brush">every pound</span> raised in real time.
          </h2>
        </div>
        <p className="text-muted-foreground max-w-md">
          See how much has been donated, how much is still pending, and how long is left to reach each goal.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {fundraisers.map((f) => (
          <FundraiserCard key={f.slug} f={f} />
        ))}
      </div>
    </section>
  );
};

export default Fundraisers;
