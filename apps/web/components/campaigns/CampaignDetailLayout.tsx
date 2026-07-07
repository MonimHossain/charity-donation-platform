"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Facebook,
  Copy,
  Heart,
  MapPin,
  MessageCircle,
  Share2,
  Twitter,
  Users,
} from "lucide-react";
import PageShell from "@/components/site/PageShell";
import TrustBadges from "@/components/home/TrustBadges";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer";
import { BlogPostFaqs } from "@/components/blog/BlogPostFaqs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { statValueSmClass } from "@/lib/home-buttons";
import { useCurrency } from "@/lib/currency";
import { getDisplayDonorCount } from "@/lib/campaign-fundraising";
import { getCampaignHeroImage, getCampaignCardImage } from "@/lib/campaign-media";
import { CampaignExpirationCountdown } from "@/components/campaigns/CampaignExpirationCountdown";
import { CampaignFeaturedBadge } from "@/components/campaigns/CampaignFeaturedBadge";
import {
  TAG_COLORS,
  type CampaignData,
  type RecentDonation,
  type RelatedCampaign,
} from "./campaign-detail-types";

function donorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function formatDonationDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface CampaignDetailLayoutProps {
  campaign: CampaignData;
  sym: string;
  percentage: number;
  daysLeft: number | null;
  isFundraiser: boolean;
  recentDonations: RecentDonation[];
  relatedCampaigns: RelatedCampaign[];
  heroSidebar: ReactNode | null;
  onShare: (platform: string) => void;
  donateHref?: string;
}

export function CampaignDetailLayout({
  campaign,
  sym: _sym,
  percentage,
  daysLeft,
  isFundraiser,
  recentDonations,
  relatedCampaigns,
  heroSidebar,
  onShare,
  donateHref,
}: CampaignDetailLayoutProps) {
  const { formatMoney } = useCurrency();
  const sourceCurrency = campaign.currency || "GBP";
  const fs = campaign.fundraiserSettings;
  const heroImage = getCampaignHeroImage(campaign);
  const pageTitle = campaign.seoSettings?.metaTitle || `${campaign.title} — Donate`;
  const pageDescription =
    campaign.seoSettings?.metaDescription || campaign.shortDescription.slice(0, 155);
  const checkoutLink = donateHref ?? `/donate?cause=${campaign.slug}&campaignId=${campaign.id}`;
  const showSidebar = Boolean(heroSidebar);
  const displayDonors = getDisplayDonorCount(campaign);

  return (
    <PageShell title={pageTitle} description={pageDescription}>
      {/* Hero + overview — clean layout like yourimpactfdn.vercel.app/causes/orphans */}
      <section className="bg-background">
        <div className="container-wide pt-8 pb-16 lg:pt-12 lg:pb-20">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left: banner → tags → title → short description → stats */}
            <div
              className={cn(
                "min-w-0",
                showSidebar ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12 max-w-3xl"
              )}
            >
              {/* 1. Banner image */}
              <div className="mb-6 rounded-3xl overflow-hidden border border-border shadow-lift bg-muted max-h-[min(70vh,520px)] flex items-center justify-center">
                <img
                  src={heroImage}
                  alt={campaign.title}
                  className="w-full h-auto max-h-[min(70vh,520px)] object-contain"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.src.includes("hero-1.webp")) return;
                    img.src = "/images/hero-1.webp";
                  }}
                />
              </div>

              {/* 2. Tags */}
              <div className="flex flex-wrap items-center gap-2">
                {campaign.isUrgent && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-xs font-bold uppercase tracking-wider text-destructive-foreground">
                    <AlertTriangle className="h-3.5 w-3.5" /> Urgent
                  </span>
                )}
                {campaign.isFeatured && <CampaignFeaturedBadge size="md" />}
                {campaign.tags?.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
                      TAG_COLORS[tag] || "bg-secondary text-foreground"
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Category label */}
              {campaign.category && (
                <p className="mt-4 text-sm uppercase tracking-[0.25em] font-bold text-accent-deep">
                  {campaign.category}
                </p>
              )}

              {/* Title */}
              <h1 className="mt-3 font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-primary">
                {campaign.title}
              </h1>

              {/* 3. Short description */}
              <p className="mt-5 text-lg max-w-xl font-medium leading-relaxed text-muted-foreground">
                {campaign.shortDescription}
              </p>

              {campaign.expirationEnabled && campaign.expiresAt && !isFundraiser && (
                <div className="mt-6 max-w-md">
                  <CampaignExpirationCountdown expiresAt={campaign.expiresAt} variant="compact" />
                </div>
              )}

              {/* Fundraiser stats card */}
              {isFundraiser && fs?.targetAmount > 0 && (
                <div className="mt-8 max-w-md rounded-2xl bg-card text-primary p-5 border border-border shadow-lift">
                  <div className="flex items-end justify-between text-sm font-semibold">
                    <div>
                      <p className="text-primary/70 text-[11px] uppercase tracking-widest">Raised</p>
                      <p className="font-serif text-2xl mt-0.5">
                        {formatMoney(Number(fs.raisedAmount), { from: sourceCurrency })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary/70 text-[11px] uppercase tracking-widest">Goal</p>
                      <p className="font-serif text-2xl mt-0.5">
                        {formatMoney(Number(fs.targetAmount), { from: sourceCurrency })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-primary/15 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-primary/80">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {displayDonors.toLocaleString()} donors
                    </span>
                    <span className="font-semibold text-accent">{percentage}% funded</span>
                    {daysLeft !== null && <span>{daysLeft}d left</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky donation sidebar */}
            {showSidebar && (
              <aside className="lg:col-span-5 xl:col-span-4">
                {heroSidebar}
              </aside>
            )}

            {/* 4. Rich text / campaign overview — below banner block */}
            <div className="lg:col-span-12 min-w-0">
              <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">
                Campaign overview
              </p>
              <div className="mt-4 rounded-3xl bg-card border border-border p-6 lg:p-8 shadow-soft">
                <div className="space-y-7 text-foreground">
                  {campaign.fullDescription ? (
                    <MarkdownRenderer
                      content={campaign.fullDescription}
                      className="[&_h2]:font-serif [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:text-primary [&_h2]:mt-4 [&_p]:text-base [&_p]:md:text-lg [&_p]:text-foreground/85 [&_li]:text-foreground/85 [&_blockquote]:border-accent [&_ul]:marker:text-accent"
                    />
                  ) : (
                    <p className="text-base md:text-lg text-foreground/85 leading-relaxed whitespace-pre-line">
                      {campaign.shortDescription}
                    </p>
                  )}
                </div>
              </div>

              {campaign.faqs && campaign.faqs.length > 0 && (
                <BlogPostFaqs faqs={campaign.faqs} className="mt-8 rounded-3xl border border-border bg-card px-6 lg:px-8" />
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="h-12 px-8 text-base rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground shadow-soft hover:shadow-glow"
                >
                  <Link href={checkoutLink}>
                    Donate now <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onShare("copy")}
                  className="h-12 px-8 text-base rounded-full bg-primary-foreground/95 hover:bg-primary hover:text-primary-foreground"
                >
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </div>

              {/* Impact so far — fundraisers */}
              {isFundraiser && fs?.targetAmount > 0 && (
                <div className="mt-8 rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 lg:p-8 border border-primary-foreground/10">
                  <p className="text-xs uppercase tracking-widest text-accent font-bold">
                    Impact so far
                  </p>
                  <h3 className="font-serif text-2xl md:text-3xl mt-2">Together we have…</h3>
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <ImpactStatCard
                      icon={Heart}
                      value={formatMoney(Number(fs.raisedAmount), { from: sourceCurrency })}
                      label="Raised so far"
                    />
                    <ImpactStatCard
                      icon={Users}
                      value={displayDonors.toLocaleString()}
                      label="Supporters"
                    />
                    <ImpactStatCard icon={Award} value={`${percentage}%`} label="Funded" />
                    <ImpactStatCard icon={MapPin} value="100%" label="Goes to programmes" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recent donations */}
      {recentDonations.length > 0 && (
        <section className="bg-secondary/30 border-y border-border">
          <div className="container-wide py-16">
            <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
              <div>
                <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">
                  Recent donations
                </p>
                <h2 className="mt-2 font-serif text-3xl md:text-4xl text-primary">
                  Join {displayDonors.toLocaleString()} donors who
                  already gave
                </h2>
              </div>
              <Button
                asChild
                className="rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground shadow-soft hover:shadow-glow h-10 px-5"
              >
                <Link href={checkoutLink}>
                  Donate now <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentDonations.map((d, i) => (
                <div
                  key={i}
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
                          {d.paymentType || "single"} · {formatDonationDate(d.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="font-serif text-xl text-primary whitespace-nowrap">
                      {formatMoney(Number(d.amount), { from: d.currency })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="container-wide py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-10 lg:p-14 text-center">
          <Heart className="w-10 h-10 text-accent mx-auto" />
          <h2 className="mt-4 font-serif text-3xl md:text-4xl">
            Your gift makes a real difference today.
          </h2>
          <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto">
            100% of donations reach the field. Cancel monthly gifts anytime. Secure checkout in
            seconds.
          </p>
          <Button
            asChild
            className="mt-6 h-12 px-8 text-base rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground shadow-soft hover:shadow-glow"
          >
            <Link href={checkoutLink}>
              Donate to {campaign.title} <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Related appeals */}
      {relatedCampaigns.length > 0 && (
        <section className="container-wide pb-20">
          <h2 className="font-serif text-2xl text-primary mb-6">Other ways you can help</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {relatedCampaigns.map((c) => (
              <Link
                key={c.slug}
                href={`/campaigns/${c.slug}`}
                className="group rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={getCampaignCardImage(c)}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
                  <h3 className="absolute bottom-3 left-4 right-4 text-primary-foreground font-serif text-lg leading-tight">
                    {c.title}
                  </h3>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.shortDescription}</p>
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

function ImpactStatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-primary-foreground/10 backdrop-blur p-4 border border-primary-foreground/15">
      <Icon className="w-4 h-4 text-accent" />
      <p className={`${statValueSmClass} mt-2`}>{value}</p>
      <p className="text-[11px] text-primary-foreground/75 mt-0.5">{label}</p>
    </div>
  );
}
