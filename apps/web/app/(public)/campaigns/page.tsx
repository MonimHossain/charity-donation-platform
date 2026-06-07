"use client";

import { USE_MOCK_DATA } from "@/lib/config";
import MockCampaignsList from "./MockCampaignsList";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Users, Search, Filter, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { fetchCampaigns } from "@/lib/api";
import { getCampaignCardImage } from "@/lib/campaign-media";

const CATEGORIES = [
  "All",
  "Emergency",
  "Water",
  "Food",
  "Education",
  "Orphan",
  "Health",
  "Shelter",
  "Zakat",
  "Sadaqah",
] as const;

const TAGS = ["zakat", "sadaqah", "lillah", "emergency", "ramadan", "general"];

interface Campaign {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  banner?: string;
  featuredImage?: string;
  image?: string;
  raisedAmount: number;
  goalAmount: number;
  currency: string;
  donorCount: number;
  isUrgent: boolean;
  isEmergency: boolean;
  endDate?: string;
  status: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£", USD: "$", EUR: "€", CAD: "C$", AUD: "A$",
};

function formatCurrency(amount: number, currency: string = "GBP") {
  const sym = CURRENCY_SYMBOLS[currency] || "£";
  if (amount >= 1000) {
    return `${sym}${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  }
  return `${sym}${amount.toLocaleString()}`;
}

export default function CampaignsPage() {
  if (USE_MOCK_DATA) return <MockCampaignsList />;
  return <CampaignsPageApi />;
}

function CampaignsPageApi() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const params: Record<string, string> = { status: "active", limit: "50" };
    if (activeCategory !== "All") params.category = activeCategory.toLowerCase();
    if (searchQuery) params.search = searchQuery;

    fetchCampaigns(params)
      .then((data) => setCampaigns(data.items || []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, [activeCategory, searchQuery]);

  const filtered = activeTag
    ? campaigns.filter((c) => c.tags?.includes(activeTag))
    : campaigns;

  return (
    <>
      <section className="gradient-plum py-20 text-primary-foreground">
        <div className="container-wide text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Our Campaigns
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
            Join one of our active campaigns and make a tangible difference.
            Every contribution brings us closer to a better world.
          </p>
          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/50" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-full"
            />
          </div>
        </div>
      </section>

      <section className="border-b bg-card sticky top-0 z-10">
        <div className="container-wide">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setLoading(true); }}
                className={cn(
                  "shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide">
            <button
              onClick={() => setActiveTag(null)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all flex items-center gap-1",
                !activeTag
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Tag className="h-3 w-3" /> All Types
            </button>
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all capitalize",
                  activeTag === tag
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-muted-foreground hover:bg-secondary"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-wide">
          {loading ? (
            <div className="py-20 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-20 text-center text-muted-foreground">
              No campaigns found. Try a different category or search term.
            </p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((campaign) => {
                const percentage = campaign.goalAmount > 0
                  ? Math.min(Math.round((Number(campaign.raisedAmount) / Number(campaign.goalAmount)) * 100), 100)
                  : 0;
                const daysLeft = campaign.endDate
                  ? Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / 86400000))
                  : null;

                return (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all hover:shadow-lift hover:-translate-y-1"
                  >
                    <div className="relative aspect-[3/2] overflow-hidden bg-muted">
                      <img
                        src={getCampaignCardImage(campaign)}
                        alt={campaign.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.src.includes("hero-1.webp")) return;
                          img.src = "/images/hero-1.webp";
                        }}
                      />
                      {campaign.isUrgent && (
                        <span className="absolute left-3 top-3 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-white animate-pulse">
                          URGENT
                        </span>
                      )}
                      {campaign.isEmergency && !campaign.isUrgent && (
                        <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                          EMERGENCY
                        </span>
                      )}
                      <span className="absolute right-3 top-3 rounded-full bg-card/90 px-3 py-1 text-xs font-medium backdrop-blur-sm capitalize">
                        {campaign.category}
                      </span>
                      {campaign.tags?.length > 0 && (
                        <div className="absolute bottom-3 left-3 flex gap-1.5">
                          {campaign.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wider">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-serif text-lg font-semibold group-hover:text-primary transition-colors">
                        {campaign.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {campaign.shortDescription}
                      </p>
                      <div className="mt-auto pt-4">
                        <Progress value={percentage} className="h-2" />
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-primary">
                            {formatCurrency(Number(campaign.raisedAmount), campaign.currency)} raised
                          </span>
                          <span className="text-muted-foreground">
                            of {formatCurrency(Number(campaign.goalAmount), campaign.currency)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {campaign.donorCount} donors
                          </span>
                          {daysLeft !== null && <span>{daysLeft} days left</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="gradient-warm py-16">
        <div className="container-wide text-center">
          <h2 className="font-serif text-3xl font-bold">
            Can&apos;t decide? Give where it&apos;s needed most.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Your donation will be allocated to the most urgent causes,
            maximising your impact where it matters most.
          </p>
          <Button asChild size="lg" className="mt-6 rounded-full">
            <Link href="/donate?cause=where-needed">
              <Heart className="h-4 w-4" /> Donate Now
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
