"use client";

import Link from "next/link";
import { campaignPublicPath } from "@/lib/public-paths";
import { useMemo, useState } from "react";
import { Heart, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import PageShell, { PageHero } from "@/components/site/PageShell";
import { demoCampaigns } from "@/lib/mock/campaigns";
import { fmtMoney } from "@/lib/mock/format";
import { imageAltFromSrc } from "@/lib/utils";

const CATEGORIES = ["All", "Emergency", "Long-term", "Essentials", "Sustainable", "Sadaqah Jariyah", "Rapid response"];

export default function MockCampaignsList() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const filtered = useMemo(() => {
    return demoCampaigns.filter((c) => {
      const matchCat = cat === "All" || c.tag === cat;
      const matchQ =
        !q ||
        c.title.toLowerCase().includes(q.toLowerCase()) ||
        c.summary.toLowerCase().includes(q.toLowerCase());
      return matchCat && matchQ;
    });
  }, [q, cat]);

  return (
    <PageShell
      title="Campaigns — Your Impact Foundation"
      description="Browse appeals and donate to causes worldwide."
    >
      <PageHero
        eyebrow="Campaigns"
        title="Every gift changes a life."
        description="Explore our active appeals — from emergency relief to long-term sponsorship."
      />
      <section className="container-wide py-12">
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns…"
              className="pl-10 rounded-full"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  cat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((c) => {
            const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
            return (
              <Link
                key={c.id}
                href={campaignPublicPath(c.slug)}
                className="group rounded-3xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-lift transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={c.image}
                    alt={imageAltFromSrc(c.image)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {c.urgent && (
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                      Urgent
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <span className="text-xs uppercase tracking-wider text-accent-deep font-semibold">{c.tag}</span>
                  <h2 className="mt-2 font-serif text-2xl text-primary">{c.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.summary}</p>
                  <Progress value={pct} className="mt-4 h-1.5" />
                  <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                    <span>{fmtMoney(c.raised)} raised</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {c.donors}
                    </span>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    <Heart className="w-4 h-4 text-accent" /> Donate
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
