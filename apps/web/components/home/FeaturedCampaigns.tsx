"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ArrowUpRight, Heart, Users, TrendingUp, Shield, Loader2 } from "lucide-react";
import { useHomepageAppeals } from "@/lib/data/campaigns";
import { getCampaignCardImage } from "@/lib/campaign-media";
import { isCampaignExpired } from "@/lib/campaign-expiration";
import { CampaignExpirationCountdown } from "@/components/campaigns/CampaignExpirationCountdown";
import { CampaignFeaturedBadge } from "@/components/campaigns/CampaignFeaturedBadge";
import { homeDonateButtonClass } from "@/lib/home-buttons";
import { trackSelectItem } from "@/lib/analytics/push-donation-event";
import {
  CAMPAIGN_MODE_LABELS,
  isExperienceCampaignMode,
} from "@/lib/campaign-experience";
import { getCampaignGoalAmount, getCampaignRaisedAmount } from "@/lib/campaign-fundraising";
import { useCurrency } from "@/lib/currency";

type Appeal = {
  slug: string;
  title: string;
  tag: string;
  category?: string;
  currency?: string;
  excerpt: string;
  image: string;
  featured?: boolean;
  urgent?: boolean;
  raised: number;
  goal: number;
  donors: number;
  impact: string;
  expirationEnabled?: boolean;
  expiresAt?: string | null;
};

const impactTemplates: Record<string, (format: (n: number) => string) => string> = {
  gaza: () => "Feeds a family for 1 week",
  orphans: (f) => `${f(30)} sponsors a child / month`,
  water: (f) => `${f(250)} builds a hand-pump well`,
  food: (f) => `${f(50)} = 1 food parcel`,
  livelihood: (f) => `${f(100)} funds a starter kit`,
  emergency: () => "Deployed within 72 hours",
};

const impactByMode: Record<string, string> = {
  fidya_kaffarah: "Pay Fidya or Kaffarah with ease",
  ramadan_split: "Split your giving across Ramadan nights",
};

function appealTag(c: Record<string, unknown>) {
  const mode = String(c.campaignMode ?? "");
  if (isExperienceCampaignMode(mode)) {
    return CAMPAIGN_MODE_LABELS[mode] ?? "Appeal";
  }
  return String(c.category ?? c.tag ?? "Appeal");
}

function appealImpact(c: Record<string, unknown>, formatFromGbp: (n: number) => string) {
  const mode = String(c.campaignMode ?? "");
  if (impactByMode[mode]) return impactByMode[mode];
  const slug = String(c.slug);
  const template = impactTemplates[slug];
  return template ? template(formatFromGbp) : "Your gift makes a difference";
}

function mapCampaigns(
  items: Array<Record<string, unknown>>,
  formatFromGbp: (n: number) => string
): Appeal[] {
  return items
    .filter((c): c is Record<string, unknown> => Boolean(c?.slug))
    .filter(
      (c) =>
        String(c.campaignMode ?? "") !== "fundraiser" &&
        !isCampaignExpired(
          Boolean(c.expirationEnabled),
          c.expiresAt as string | null | undefined
        )
    )
    .map((c) => ({
    slug: String(c.slug),
    title: String(c.title),
    tag: appealTag(c),
    category: c.category ? String(c.category) : undefined,
    currency: c.currency ? String(c.currency) : undefined,
    excerpt: String(c.shortDescription ?? c.summary ?? ""),
    image: getCampaignCardImage({
      thumbnail: c.thumbnail as string | undefined,
      banner: c.banner as string | undefined,
      featuredImage: c.featuredImage as string | undefined,
      image: c.image as string | undefined,
    }),
    urgent: Boolean(c.isUrgent ?? c.urgent),
    featured: Boolean(c.isFeatured ?? c.featured),
    raised: getCampaignRaisedAmount(c),
    goal: Math.max(getCampaignGoalAmount(c), 1),
    donors: Number(c.donorCount ?? c.donors ?? 0),
    impact: appealImpact(c, formatFromGbp),
    expirationEnabled: Boolean(c.expirationEnabled),
    expiresAt: (c.expiresAt as string | null | undefined) ?? null,
  }));
}

const AppealCard = ({
  a,
  large = false,
  onExpired,
}: {
  a: Appeal;
  large?: boolean;
  onExpired?: () => void;
}) => {
  const handleSelect = () =>
    trackSelectItem({
      slug: a.slug,
      title: a.title,
      category: a.category || a.tag,
      currency: a.currency,
    });

  return (
  <div className={`group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-border/60 shadow-soft hover:shadow-lift hover:-translate-y-1 transition-all duration-500 ${large ? "sm:col-span-2 lg:col-span-2" : ""}`}>
    <Link href={`/campaigns/${a.slug}`} onClick={handleSelect} className="relative block overflow-hidden">
      <div className={`relative overflow-hidden ${large ? "aspect-[8/3]" : "aspect-[4/3]"}`}>
        <img
          src={a.image}
          alt={a.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src.includes("hero-1.webp")) return;
            img.src = "/images/hero-1.webp";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {a.featured && <CampaignFeaturedBadge />}
            {a.urgent ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive-foreground animate-pulse" />
                Urgent
              </span>
            ) : (
              !a.featured && (
                <span className="px-2.5 py-1 rounded-full bg-background/95 backdrop-blur text-primary text-[10px] sm:text-xs font-semibold uppercase tracking-wider shadow-md">
                  {a.tag}
                </span>
              )
            )}
            {a.featured && !a.urgent && (
              <span className="px-2.5 py-1 rounded-full bg-background/95 backdrop-blur text-primary text-[10px] sm:text-xs font-semibold uppercase tracking-wider shadow-md">
                {a.tag}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/95 backdrop-blur text-foreground text-[10px] sm:text-xs font-semibold shadow-md">
            <Users className="w-3 h-3 text-accent-deep" />
            {a.donors.toLocaleString()}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-primary-foreground">
          <h3 className={`font-serif font-semibold leading-tight ${large ? "text-2xl sm:text-3xl lg:text-4xl" : "text-lg sm:text-2xl"}`}>
            {a.title}
          </h3>
        </div>
      </div>
    </Link>

    <div className="flex flex-col flex-1 p-4 sm:p-5 gap-3">
      <p className="text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>

      {a.expirationEnabled && a.expiresAt && (
        <CampaignExpirationCountdown
          expiresAt={a.expiresAt}
          variant="compact"
          onExpired={onExpired}
        />
      )}

      <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-mint-soft text-accent-foreground text-[11px] font-semibold">
        <Heart className="w-3 h-3" />
        {a.impact}
      </div>

      <div className="mt-auto pt-2">
        <Link
          href={`/campaigns/${a.slug}`}
          onClick={handleSelect}
          className={`w-full px-4 py-2.5 text-sm ${homeDonateButtonClass}`}
        >
          Donate now
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  </div>
  );
};

const FeaturedCampaigns = () => {
  const { data, isLoading, refetch } = useHomepageAppeals();
  const { formatFromSource, formatMoney } = useCurrency();
  const [hiddenSlugs, setHiddenSlugs] = useState<Set<string>>(() => new Set());

  const handleExpired = useCallback(
    (slug: string) => {
      setHiddenSlugs((prev) => new Set(prev).add(slug));
      void refetch();
    },
    [refetch]
  );

  const sourceItems = (data?.items ?? []) as Array<Record<string, unknown>>;
  const appeals = useMemo(
    () =>
      mapCampaigns(sourceItems, (n) => formatFromSource(n, "GBP")).filter(
        (a) => !hiddenSlugs.has(a.slug)
      ),
    [sourceItems, hiddenSlugs, formatFromSource]
  );

  if (isLoading) {
    return (
      <section className="container-wide py-16 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </section>
    );
  }

  if (appeals.length === 0) {
    return null;
  }

  return (
  <section className="container-wide px-4 sm:px-6 lg:px-8 pt-16 pb-10 sm:pt-20 sm:pb-12 lg:pt-28 lg:pb-14">
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-14">
      <div className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.25em] text-accent-deep font-semibold">Our Appeals</p>
        <h2 className="mt-3 font-serif text-4xl md:text-5xl text-primary text-balance">
          Every project is designed to <span className="underline-brush">ease hardship</span> and bring hope.
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl text-pretty">
          We work across Palestine, Yemen, Syria, Africa and Asia — delivering urgent relief and long-term change.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 lg:justify-end">
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-accent-deep" /> 100% Donation Policy
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
          <TrendingUp className="w-3.5 h-3.5 text-accent-deep" />{" "}
          {formatMoney(1_400_000, { from: "GBP", compact: true })}+ raised this year
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
          <Users className="w-3.5 h-3.5 text-accent-deep" /> 28k+ donors
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
      {appeals.map((a, i) => (
        <AppealCard
          key={a.slug}
          a={a}
          large={i === 0}
          onExpired={() => handleExpired(a.slug)}
        />
      ))}
    </div>

    <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-secondary to-mint-soft border border-border/60">
      <div className="flex items-center gap-3 text-sm text-foreground">
        <Shield className="w-5 h-5 text-accent-deep shrink-0" />
        <span><strong className="font-semibold">Your donation is secure.</strong> Gift Aid eligible. Zakat compliant. Reports delivered to your inbox.</span>
      </div>
      <Link
        href="/campaigns"
        className={`px-5 py-2.5 text-sm whitespace-nowrap ${homeDonateButtonClass}`}
      >
        View all appeals <ArrowUpRight className="w-4 h-4" />
      </Link>
    </div>
  </section>
  );
};

export default FeaturedCampaigns;
