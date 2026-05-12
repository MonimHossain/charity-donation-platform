"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Users, Target, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

type Fundraiser = {
  slug: string;
  title: string;
  tag: string;
  image: string;
  raised: number;
  goal: number;
  donors: number;
  endsAt: number;
  urgent?: boolean;
};

const daysFromNow = (d: number) => Date.now() + d * 24 * 60 * 60 * 1000;

const fundraisers: Fundraiser[] = [
  {
    slug: "gaza",
    title: "Gaza Famine Emergency",
    tag: "Emergency",
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=70",
    raised: 482350,
    goal: 750000,
    donors: 12480,
    endsAt: daysFromNow(3),
    urgent: true,
  },
  {
    slug: "water",
    title: "Build a Water Well",
    tag: "Sadaqah Jariyah",
    image: "https://images.unsplash.com/photo-1541544537156-7627a7a4aa1c?auto=format&fit=crop&w=1200&q=70",
    raised: 156780,
    goal: 300000,
    donors: 4210,
    endsAt: daysFromNow(21),
  },
  {
    slug: "orphans",
    title: "Orphan Sponsorship Drive",
    tag: "Long-term",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=70",
    raised: 218400,
    goal: 400000,
    donors: 6890,
    endsAt: daysFromNow(14),
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

const useCountdown = (target: number) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
    ended: diff === 0,
  };
};

const FundraiserCard = ({ f }: { f: Fundraiser }) => {
  const { days, hours, minutes, seconds, ended } = useCountdown(f.endsAt);
  const pct = Math.min(100, Math.round((f.raised / f.goal) * 100));
  const pending = Math.max(0, f.goal - f.raised);
  const fmt = (n: number) => `£${n.toLocaleString()}`;

  return (
    <article className="group relative rounded-3xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-lift transition-all duration-500 flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={f.image} alt={f.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 rounded-full bg-background/95 text-primary text-xs font-semibold">{f.tag}</span>
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
            <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {f.donors.toLocaleString()} donors</span>
            <span className="inline-flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> {fmt(pending)} pending</span>
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
                  <p className="font-mono font-bold text-xl text-primary tabular-nums">{pad(t.v)}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.l}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button asChild size="lg" className="mt-5 rounded-full w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href={`/donate?cause=${f.slug}`}>
            Donate now <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
};

const Fundraisers = () => (
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
      {fundraisers.map((f) => <FundraiserCard key={f.slug} f={f} />)}
    </div>
  </section>
);

export default Fundraisers;
