"use client";

import { USE_MOCK_DATA } from "@/lib/config";
import MockCampaignDetail from "@/components/site/MockCampaignDetail";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Users,
  Calendar,
  Share2,
  Facebook,
  Twitter,
  Copy,
  MessageCircle,
  Tag,
  Clock,
  ArrowRight,
  Check,
  Minus,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { fetchCampaignBySlug, fetchRecentDonations } from "@/lib/api";
import { toast } from "sonner";

// ── Types ──

interface SinglePaymentConfig {
  priceType: "preset" | "custom" | "both";
  presetAmounts: number[];
  minAmount: number;
  maxAmount: number;
}

interface RegularPresetAmount {
  amount: number;
  cause: string;
  defaultDuration?: number;
}

interface RegularPaymentConfig {
  allowedIntervals: string[];
  durationType: "never_ends" | "fixed_duration";
  fixedDurationValue?: number;
  fixedDurationType?: string;
  presetAmounts: RegularPresetAmount[];
  allowCustomAmount: boolean;
  customMinAmount: number;
  customMaxAmount: number;
}

interface QuantityConfig {
  quantityLabel: string;
  minQuantity: number;
  maxQuantity: number;
}

interface CustomField {
  id: string;
  fieldType: string;
  label: string;
  placeholder: string;
  isRequired: boolean;
  defaultValue: string;
  options: string[];
}

interface CampaignAttribute {
  id: string;
  name: string;
  description: string;
  image: string;
  enableSinglePayment: boolean;
  enableRegularPayment: boolean;
  enableQuantity: boolean;
  singlePaymentConfig: SinglePaymentConfig;
  regularPaymentConfig: RegularPaymentConfig;
  quantityConfig: QuantityConfig;
  customFields: CustomField[];
}

interface CampaignUpsell {
  id: string;
  label: string;
  amount: number;
  description: string;
  isActive: boolean;
}

interface FundraiserSettings {
  targetAmount: number;
  raisedAmount: number;
  startDate: string;
  endDate: string;
  showProgressBar: boolean;
}

interface CheckoutSettings {
  allowAnonymous: boolean;
  enableGiftAid: boolean;
  enableDedication: boolean;
  enableComments: boolean;
  enableUpsell: boolean;
  enableFeeCoverage: boolean;
}

interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
}

interface CampaignData {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  thumbnail?: string;
  banner?: string;
  category: string;
  tags: string[];
  status: string;
  isFeatured: boolean;
  isUrgent: boolean;
  campaignMode: string;
  currency: string;
  donorCount: number;
  attributes: CampaignAttribute[];
  upsells: CampaignUpsell[];
  fundraiserSettings: FundraiserSettings;
  checkoutSettings: CheckoutSettings;
  seoSettings: SeoSettings;
}

interface RecentDonation {
  donorName: string;
  amount: number;
  currency: string;
  createdAt: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "\u00a3",
  USD: "$",
  EUR: "\u20ac",
  CAD: "C$",
  AUD: "A$",
};

const TAG_COLORS: Record<string, string> = {
  zakat: "bg-emerald-100 text-emerald-700",
  sadaqah: "bg-blue-100 text-blue-700",
  lillah: "bg-purple-100 text-purple-700",
  emergency: "bg-red-100 text-red-700",
  ramadan: "bg-amber-100 text-amber-700",
  general: "bg-gray-100 text-gray-700",
};

export default function CampaignDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  if (USE_MOCK_DATA) {
    return <MockCampaignDetail slug={slug} />;
  }
  return <CampaignDetailApi slug={slug} />;
}

function CampaignDetailApi({ slug: slugProp }: { slug: string }) {
  const params = useParams<{ slug: string }>();
  const slug = slugProp || params.slug || "";
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);

  // Donation form state
  const [selectedAttrIdx, setSelectedAttrIdx] = useState(0);
  const [paymentType, setPaymentType] = useState<"single" | "regular">("single");
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedInterval, setSelectedInterval] = useState("monthly");
  const [quantity, setQuantity] = useState(1);
  const [selectedUpsells, setSelectedUpsells] = useState<Set<string>>(new Set());
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCampaignBySlug(slug)
      .then((data) => {
        setCampaign(data);
        if (data?.attributes?.length > 0) {
          const attr = data.attributes[0];
          if (attr.enableSinglePayment) {
            setPaymentType("single");
            if (attr.singlePaymentConfig?.presetAmounts?.length > 0) {
              setSelectedAmount(attr.singlePaymentConfig.presetAmounts[0] ?? 0);
            }
          } else if (attr.enableRegularPayment) {
            setPaymentType("regular");
            if (attr.regularPaymentConfig?.presetAmounts?.length > 0) {
              setSelectedAmount(attr.regularPaymentConfig.presetAmounts[0]?.amount ?? 0);
            }
          }
        }
      })
      .catch(() => setCampaign(null))
      .finally(() => setLoading(false));

    fetchRecentDonations()
      .then((data) => setRecentDonations(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => {});
  }, [slug]);

  const selectedAttr = campaign?.attributes?.[selectedAttrIdx];

  function handleSelectAttribute(idx: number) {
    setSelectedAttrIdx(idx);
    const attr = campaign?.attributes?.[idx];
    if (!attr) return;
    setCustomAmount("");
    setSelectedAmount(0);
    if (attr.enableSinglePayment) {
      setPaymentType("single");
      if (attr.singlePaymentConfig?.presetAmounts?.length > 0) {
        setSelectedAmount(attr.singlePaymentConfig.presetAmounts[0] ?? 0);
      }
    } else if (attr.enableRegularPayment) {
      setPaymentType("regular");
      if (attr.regularPaymentConfig?.presetAmounts?.length > 0) {
        setSelectedAmount(attr.regularPaymentConfig.presetAmounts[0]?.amount ?? 0);
      }
    }
    setQuantity(attr.enableQuantity ? attr.quantityConfig.minQuantity : 1);
    setCustomFieldValues({});
  }

  const finalAmount = useMemo(() => {
    const base = customAmount ? Number(customAmount) : selectedAmount;
    return base * quantity;
  }, [selectedAmount, customAmount, quantity]);

  const upsellTotal = useMemo(() => {
    if (!campaign) return 0;
    return campaign.upsells
      .filter((u) => u.isActive && selectedUpsells.has(u.id))
      .reduce((sum, u) => sum + u.amount, 0);
  }, [campaign, selectedUpsells]);

  function handleShare(platform: string) {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Support ${campaign!.title} - ${campaign!.shortDescription}`;
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    };
    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
      return;
    }
    window.open(urls[platform], "_blank", "width=600,height=400");
  }

  if (loading) {
    return (
      <section className="py-32 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
      </section>
    );
  }

  if (!campaign) {
    return (
      <section className="py-32 text-center">
        <div className="container-wide">
          <h1 className="font-serif text-3xl font-bold">Campaign Not Found</h1>
          <p className="mt-3 text-muted-foreground">
            The campaign you&apos;re looking for doesn&apos;t exist or has ended.
          </p>
          <Button asChild className="mt-6">
            <Link href="/campaigns">Browse Campaigns</Link>
          </Button>
        </div>
      </section>
    );
  }

  const sym = CURRENCY_SYMBOLS[campaign.currency] || "\u00a3";
  const isFundraiser = campaign.campaignMode === "fundraiser";
  const fs = campaign.fundraiserSettings;
  const percentage =
    isFundraiser && fs?.targetAmount > 0
      ? Math.min(Math.round((Number(fs.raisedAmount) / Number(fs.targetAmount)) * 100), 100)
      : 0;
  const daysLeft =
    isFundraiser && fs?.endDate
      ? Math.max(0, Math.ceil((new Date(fs.endDate).getTime() - Date.now()) / 86400000))
      : null;

  return (
    <>
      {/* ── Hero Banner ── */}
      <section className="relative h-[40vh] min-h-[320px] w-full overflow-hidden bg-muted md:h-[50vh]">
        <img
          src={campaign.banner || campaign.thumbnail || "/images/hero-1.webp"}
          alt={campaign.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 container-wide pb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary" className="capitalize">{campaign.campaignMode}</Badge>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {campaign.category}
            </span>
            {campaign.isUrgent && (
              <span className="rounded-full bg-destructive px-3 py-1 text-xs font-bold text-white animate-pulse">
                URGENT
              </span>
            )}
            {campaign.tags?.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                  TAG_COLORS[tag] || "bg-white/20 text-white"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="font-serif text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            {campaign.title}
          </h1>
          <p className="mt-2 max-w-2xl text-white/80">{campaign.shortDescription}</p>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="py-12">
        <div className="container-wide">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
            {/* Left column - Description & info */}
            <div>
              {/* Mobile donation card */}
              <div className="mb-8 lg:hidden">
                <DonationCard
                  campaign={campaign}
                  sym={sym}
                  percentage={percentage}
                  daysLeft={daysLeft}
                  selectedAttr={selectedAttr}
                  selectedAttrIdx={selectedAttrIdx}
                  paymentType={paymentType}
                  selectedAmount={selectedAmount}
                  customAmount={customAmount}
                  selectedInterval={selectedInterval}
                  quantity={quantity}
                  selectedUpsells={selectedUpsells}
                  customFieldValues={customFieldValues}
                  finalAmount={finalAmount}
                  upsellTotal={upsellTotal}
                  onSelectAttribute={handleSelectAttribute}
                  onSetPaymentType={setPaymentType}
                  onSetSelectedAmount={setSelectedAmount}
                  onSetCustomAmount={setCustomAmount}
                  onSetSelectedInterval={setSelectedInterval}
                  onSetQuantity={setQuantity}
                  onToggleUpsell={(id) => {
                    setSelectedUpsells((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    });
                  }}
                  onSetCustomFieldValue={(id, val) =>
                    setCustomFieldValues((prev) => ({ ...prev, [id]: val }))
                  }
                />
              </div>

              {/* Campaign description */}
              <div className="prose prose-lg max-w-none">
                <h2 className="font-serif text-2xl font-bold">About This Campaign</h2>
                {campaign.fullDescription ? (
                  <div
                    className="mt-4 text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: campaign.fullDescription }}
                  />
                ) : (
                  <p className="mt-4 text-muted-foreground leading-relaxed whitespace-pre-line">
                    {campaign.shortDescription}
                  </p>
                )}
              </div>

              {/* Stats */}
              {isFundraiser && (
                <div className="mt-10 grid grid-cols-3 gap-4">
                  <div className="rounded-2xl border bg-card p-5 text-center shadow-soft">
                    <p className="text-2xl font-bold text-primary">{campaign.donorCount?.toLocaleString() || 0}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Donors</p>
                  </div>
                  <div className="rounded-2xl border bg-card p-5 text-center shadow-soft">
                    <p className="text-2xl font-bold text-primary">{percentage}%</p>
                    <p className="mt-1 text-sm text-muted-foreground">Funded</p>
                  </div>
                  <div className="rounded-2xl border bg-card p-5 text-center shadow-soft">
                    <p className="text-2xl font-bold text-primary">{daysLeft ?? "\u221e"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Days Left</p>
                  </div>
                </div>
              )}

              {/* Recent Donations */}
              {recentDonations.length > 0 && (
                <div className="mt-10">
                  <h3 className="font-serif text-lg font-semibold mb-4">Recent Donations</h3>
                  <div className="space-y-3">
                    {recentDonations.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                          <Heart className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{d.donorName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(d.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-primary">
                          {CURRENCY_SYMBOLS[d.currency] || "\u00a3"}{d.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="mt-10">
                <h3 className="font-serif text-lg font-semibold">Share This Campaign</h3>
                <p className="mt-1 text-sm text-muted-foreground">Spread the word and multiply your impact.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" onClick={() => handleShare("facebook")}>
                    <Facebook className="h-4 w-4" /> Facebook
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShare("twitter")}>
                    <Twitter className="h-4 w-4" /> Twitter / X
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShare("whatsapp")}>
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShare("copy")}>
                    <Copy className="h-4 w-4" /> Copy Link
                  </Button>
                </div>
              </div>
            </div>

            {/* Right column - Sticky donation widget (desktop) */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <DonationCard
                  campaign={campaign}
                  sym={sym}
                  percentage={percentage}
                  daysLeft={daysLeft}
                  selectedAttr={selectedAttr}
                  selectedAttrIdx={selectedAttrIdx}
                  paymentType={paymentType}
                  selectedAmount={selectedAmount}
                  customAmount={customAmount}
                  selectedInterval={selectedInterval}
                  quantity={quantity}
                  selectedUpsells={selectedUpsells}
                  customFieldValues={customFieldValues}
                  finalAmount={finalAmount}
                  upsellTotal={upsellTotal}
                  onSelectAttribute={handleSelectAttribute}
                  onSetPaymentType={setPaymentType}
                  onSetSelectedAmount={setSelectedAmount}
                  onSetCustomAmount={setCustomAmount}
                  onSetSelectedInterval={setSelectedInterval}
                  onSetQuantity={setQuantity}
                  onToggleUpsell={(id) => {
                    setSelectedUpsells((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    });
                  }}
                  onSetCustomFieldValue={(id, val) =>
                    setCustomFieldValues((prev) => ({ ...prev, [id]: val }))
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ── Donation Card Component ──

function DonationCard({
  campaign,
  sym,
  percentage,
  daysLeft,
  selectedAttr,
  selectedAttrIdx,
  paymentType,
  selectedAmount,
  customAmount,
  selectedInterval,
  quantity,
  selectedUpsells,
  customFieldValues,
  finalAmount,
  upsellTotal,
  onSelectAttribute,
  onSetPaymentType,
  onSetSelectedAmount,
  onSetCustomAmount,
  onSetSelectedInterval,
  onSetQuantity,
  onToggleUpsell,
  onSetCustomFieldValue,
}: {
  campaign: CampaignData;
  sym: string;
  percentage: number;
  daysLeft: number | null;
  selectedAttr: CampaignAttribute | undefined;
  selectedAttrIdx: number;
  paymentType: "single" | "regular";
  selectedAmount: number;
  customAmount: string;
  selectedInterval: string;
  quantity: number;
  selectedUpsells: Set<string>;
  customFieldValues: Record<string, string>;
  finalAmount: number;
  upsellTotal: number;
  onSelectAttribute: (idx: number) => void;
  onSetPaymentType: (t: "single" | "regular") => void;
  onSetSelectedAmount: (a: number) => void;
  onSetCustomAmount: (a: string) => void;
  onSetSelectedInterval: (i: string) => void;
  onSetQuantity: (q: number) => void;
  onToggleUpsell: (id: string) => void;
  onSetCustomFieldValue: (id: string, val: string) => void;
}) {
  const isFundraiser = campaign.campaignMode === "fundraiser";
  const fs = campaign.fundraiserSettings;
  const cs = campaign.checkoutSettings;

  const donateUrl = `/donate?amount=${finalAmount + upsellTotal}&cause=${campaign.slug}&campaignId=${campaign.id}&type=${paymentType}${paymentType === "regular" ? `&interval=${selectedInterval}` : ""}`;

  return (
    <div className="space-y-4">
      {/* Fundraiser progress */}
      {isFundraiser && fs?.showProgressBar && (
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <Progress value={percentage} className="h-3" />
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-primary">
              {sym}{Number(fs.raisedAmount).toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              of {sym}{Number(fs.targetAmount).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {campaign.donorCount?.toLocaleString() || 0} donors
            </span>
            {daysLeft !== null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {daysLeft} days left
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main donation form */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft space-y-5">
        {/* Attribute selector */}
        {campaign.attributes.length > 1 && (
          <div>
            <p className="text-sm font-medium mb-2">Choose a cause</p>
            <div className="space-y-2">
              {campaign.attributes.map((attr, i) => (
                <button
                  key={attr.id}
                  type="button"
                  onClick={() => onSelectAttribute(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
                    selectedAttrIdx === i
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  {attr.image && (
                    <img src={attr.image} alt={attr.name} className="h-10 w-10 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{attr.name}</p>
                    {attr.description && (
                      <p className="text-xs text-muted-foreground truncate">{attr.description}</p>
                    )}
                  </div>
                  {selectedAttrIdx === i && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {campaign.attributes.length === 1 && campaign.attributes[0]?.name && (
          <div className="text-center">
            <p className="text-sm font-semibold">{campaign.attributes[0]?.name}</p>
            {campaign.attributes[0]?.description && (
              <p className="text-xs text-muted-foreground mt-1">{campaign.attributes[0]?.description}</p>
            )}
          </div>
        )}

        {/* Payment type toggle */}
        {selectedAttr && selectedAttr.enableSinglePayment && selectedAttr.enableRegularPayment && (
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                onSetPaymentType("single");
                if (selectedAttr.singlePaymentConfig?.presetAmounts?.length > 0) {
                  onSetSelectedAmount(selectedAttr.singlePaymentConfig.presetAmounts[0] ?? 0);
                }
                onSetCustomAmount("");
              }}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition-all",
                paymentType === "single" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              One-Time
            </button>
            <button
              type="button"
              onClick={() => {
                onSetPaymentType("regular");
                if (selectedAttr.regularPaymentConfig?.presetAmounts?.length > 0) {
                  onSetSelectedAmount(selectedAttr.regularPaymentConfig.presetAmounts[0]?.amount ?? 0);
                }
                onSetCustomAmount("");
              }}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition-all",
                paymentType === "regular" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              Monthly
            </button>
          </div>
        )}

        {/* Amount selection */}
        {selectedAttr && paymentType === "single" && selectedAttr.enableSinglePayment && (
          <div>
            {(selectedAttr.singlePaymentConfig.priceType === "preset" ||
              selectedAttr.singlePaymentConfig.priceType === "both") && (
              <div className="grid grid-cols-3 gap-2">
                {selectedAttr.singlePaymentConfig.presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      onSetSelectedAmount(amt);
                      onSetCustomAmount("");
                    }}
                    className={cn(
                      "rounded-lg border-2 py-2.5 text-sm font-semibold transition-all",
                      selectedAmount === amt && !customAmount
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {sym}{amt}
                  </button>
                ))}
              </div>
            )}
            {(selectedAttr.singlePaymentConfig.priceType === "custom" ||
              selectedAttr.singlePaymentConfig.priceType === "both") && (
              <div className="mt-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{sym}</span>
                  <Input
                    type="number"
                    placeholder="Enter custom amount"
                    value={customAmount}
                    onChange={(e) => {
                      onSetCustomAmount(e.target.value);
                      onSetSelectedAmount(0);
                    }}
                    className="pl-7"
                    min={selectedAttr.singlePaymentConfig.minAmount}
                    max={selectedAttr.singlePaymentConfig.maxAmount}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {selectedAttr && paymentType === "regular" && selectedAttr.enableRegularPayment && (
          <div className="space-y-3">
            {selectedAttr.regularPaymentConfig.allowedIntervals.length > 1 && (
              <div>
                <Label className="text-xs mb-1.5 block">Frequency</Label>
                <div className="flex gap-2">
                  {selectedAttr.regularPaymentConfig.allowedIntervals.map((interval) => (
                    <button
                      key={interval}
                      type="button"
                      onClick={() => onSetSelectedInterval(interval)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all",
                        selectedInterval === interval
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {interval}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedAttr.regularPaymentConfig.presetAmounts.length > 0 && (
              <div className="space-y-2">
                {selectedAttr.regularPaymentConfig.presetAmounts.map((preset) => (
                  <button
                    key={preset.amount}
                    type="button"
                    onClick={() => {
                      onSetSelectedAmount(preset.amount);
                      onSetCustomAmount("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border-2 p-3 text-left transition-all",
                      selectedAmount === preset.amount && !customAmount
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold">{sym}{preset.amount}/{selectedInterval}</p>
                      {preset.cause && <p className="text-xs text-muted-foreground">{preset.cause}</p>}
                    </div>
                    {selectedAmount === preset.amount && !customAmount && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {selectedAttr.regularPaymentConfig.allowCustomAmount && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{sym}</span>
                <Input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => {
                    onSetCustomAmount(e.target.value);
                    onSetSelectedAmount(0);
                  }}
                  className="pl-7"
                  min={selectedAttr.regularPaymentConfig.customMinAmount}
                  max={selectedAttr.regularPaymentConfig.customMaxAmount}
                />
              </div>
            )}
          </div>
        )}

        {/* Quantity */}
        {selectedAttr?.enableQuantity && (
          <div>
            <Label className="text-xs mb-1.5 block">
              {selectedAttr.quantityConfig.quantityLabel || "Quantity"}
            </Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => onSetQuantity(Math.max(selectedAttr.quantityConfig.minQuantity, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-bold w-12 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => onSetQuantity(Math.min(selectedAttr.quantityConfig.maxQuantity, quantity + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Custom fields */}
        {selectedAttr?.customFields && selectedAttr.customFields.length > 0 && (
          <div className="space-y-3">
            <Separator />
            {selectedAttr.customFields.map((cf) => (
              <div key={cf.id} className="space-y-1">
                <Label className="text-xs">
                  {cf.label}
                  {cf.isRequired && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                {cf.fieldType === "text" && (
                  <Input
                    value={customFieldValues[cf.id] || ""}
                    onChange={(e) => onSetCustomFieldValue(cf.id, e.target.value)}
                    placeholder={cf.placeholder}
                    className="h-9 text-sm"
                  />
                )}
                {cf.fieldType === "textarea" && (
                  <textarea
                    value={customFieldValues[cf.id] || ""}
                    onChange={(e) => onSetCustomFieldValue(cf.id, e.target.value)}
                    placeholder={cf.placeholder}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                )}
                {cf.fieldType === "number" && (
                  <Input
                    type="number"
                    value={customFieldValues[cf.id] || ""}
                    onChange={(e) => onSetCustomFieldValue(cf.id, e.target.value)}
                    placeholder={cf.placeholder}
                    className="h-9 text-sm"
                  />
                )}
                {cf.fieldType === "date" && (
                  <Input
                    type="date"
                    value={customFieldValues[cf.id] || ""}
                    onChange={(e) => onSetCustomFieldValue(cf.id, e.target.value)}
                    className="h-9 text-sm"
                  />
                )}
                {(cf.fieldType === "dropdown") && (
                  <select
                    value={customFieldValues[cf.id] || ""}
                    onChange={(e) => onSetCustomFieldValue(cf.id, e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">{cf.placeholder || "Select..."}</option>
                    {cf.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {cf.fieldType === "radio" && (
                  <div className="flex flex-wrap gap-3">
                    {cf.options.map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 text-sm">
                        <input
                          type="radio"
                          name={cf.id}
                          checked={customFieldValues[cf.id] === opt}
                          onChange={() => onSetCustomFieldValue(cf.id, opt)}
                          className="accent-primary"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
                {cf.fieldType === "checkbox" && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={customFieldValues[cf.id] === "true"}
                      onChange={(e) => onSetCustomFieldValue(cf.id, e.target.checked ? "true" : "false")}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    {cf.placeholder || cf.label}
                  </label>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upsells */}
        {cs?.enableUpsell && campaign.upsells.filter((u) => u.isActive).length > 0 && (
          <div className="space-y-2">
            <Separator />
            <p className="text-xs font-medium text-muted-foreground">Add to your donation</p>
            {campaign.upsells
              .filter((u) => u.isActive)
              .map((u) => (
                <label
                  key={u.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                    selectedUpsells.has(u.id) ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedUpsells.has(u.id)}
                    onChange={() => onToggleUpsell(u.id)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{u.label}</p>
                    {u.description && <p className="text-xs text-muted-foreground">{u.description}</p>}
                  </div>
                  <span className="text-sm font-semibold text-primary">{sym}{u.amount}</span>
                </label>
              ))}
          </div>
        )}

        {/* Total & Donate button */}
        <Separator />
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-2xl font-bold text-primary">
              {sym}{(finalAmount + upsellTotal).toLocaleString()}
              {paymentType === "regular" && (
                <span className="text-sm font-normal text-muted-foreground">/{selectedInterval}</span>
              )}
            </span>
          </div>

          <Button asChild size="lg" className="w-full font-semibold rounded-full">
            <Link href={donateUrl}>
              <Heart className="h-4 w-4" />
              {paymentType === "regular" ? "Start Giving" : "Donate Now"}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          100% Donation Policy &mdash; every penny reaches those in need.
        </p>
      </div>
    </div>
  );
}
