"use client";

import { USE_MOCK_DATA } from "@/lib/config";
import MockCampaignDetail from "@/components/site/MockCampaignDetail";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchCampaignBySlug, fetchCampaigns, fetchRecentDonations } from "@/lib/api";
import { toast } from "sonner";
import { CampaignDonationExperience } from "@/components/campaigns/CampaignDonationExperience";
import { CampaignDonationCard } from "@/components/campaigns/CampaignDonationCard";
import { CampaignDetailLayout } from "@/components/campaigns/CampaignDetailLayout";
import { isExperienceCampaignMode } from "@/lib/campaign-experience";
import {
  CURRENCY_SYMBOLS,
  type CampaignData,
  type RecentDonation,
  type RelatedCampaign,
} from "@/components/campaigns/campaign-detail-types";

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
  const [relatedCampaigns, setRelatedCampaigns] = useState<RelatedCampaign[]>([]);

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
            setSelectedAmount(0);
            setCustomAmount("");
          }
        }
      })
      .catch(() => setCampaign(null))
      .finally(() => setLoading(false));

    fetchRecentDonations()
      .then((data) => setRecentDonations(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => {});

    fetchCampaigns({ limit: "12", page: "1" })
      .then((res) => {
        const items = (res.items ?? res.data ?? []) as Array<Record<string, unknown>>;
        const related = items
          .filter(
            (c) =>
              String(c.slug) !== slug &&
              String(c.campaignMode ?? "") !== "fundraiser" &&
              String(c.status ?? "published") === "published"
          )
          .slice(0, 3)
          .map(
            (c): RelatedCampaign => ({
              slug: String(c.slug),
              title: String(c.title),
              shortDescription: String(c.shortDescription ?? ""),
              thumbnail: c.thumbnail as string | undefined,
              banner: c.banner as string | undefined,
              category: c.category as string | undefined,
            })
          );
        setRelatedCampaigns(related);
      })
      .catch(() => {});
  }, [slug]);

  const selectedAttr = campaign?.attributes?.[selectedAttrIdx];

  const handleSelectAttribute = useCallback(
    (idx: number) => {
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
        setSelectedAmount(0);
        setCustomAmount("");
      }
      setQuantity(
        attr.enableRegularPayment && attr.enableQuantity ? attr.quantityConfig.minQuantity : 1
      );
      setCustomFieldValues({});
    },
    [campaign]
  );

  const finalAmount = useMemo(() => {
    const base = customAmount ? Number(customAmount) : selectedAmount;
    const useQuantity =
      selectedAttr?.enableRegularPayment &&
      selectedAttr?.enableQuantity &&
      paymentType === "regular";
    return base * (useQuantity ? quantity : 1);
  }, [selectedAmount, customAmount, quantity, selectedAttr, paymentType]);

  const upsellTotal = useMemo(() => {
    if (!campaign) return 0;
    return campaign.upsells
      .filter((u) => u.isActive && selectedUpsells.has(u.id))
      .reduce((sum, u) => sum + u.amount, 0);
  }, [campaign, selectedUpsells]);

  const handleShare = useCallback(
    (platform: string) => {
      if (!campaign) return;
      const url = typeof window !== "undefined" ? window.location.href : "";
      const text = `Support ${campaign.title} - ${campaign.shortDescription}`;
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
    },
    [campaign]
  );

  const toggleUpsell = useCallback((id: string) => {
    setSelectedUpsells((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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
  const isExperienceMode = isExperienceCampaignMode(campaign.campaignMode);
  const isRamadanSplit = campaign.campaignMode === "ramadan_split";
  const fs = campaign.fundraiserSettings;
  const percentage =
    isFundraiser && fs?.targetAmount > 0
      ? Math.min(Math.round((Number(fs.raisedAmount) / Number(fs.targetAmount)) * 100), 100)
      : 0;
  const daysLeft =
    isFundraiser && fs?.endDate
      ? Math.max(0, Math.ceil((new Date(fs.endDate).getTime() - Date.now()) / 86400000))
      : null;

  const donationCardProps = {
    campaign,
    sym,
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
    onSelectAttribute: handleSelectAttribute,
    onSetPaymentType: setPaymentType,
    onSetSelectedAmount: setSelectedAmount,
    onSetCustomAmount: setCustomAmount,
    onSetSelectedInterval: setSelectedInterval,
    onSetQuantity: setQuantity,
    onToggleUpsell: toggleUpsell,
    onSetCustomFieldValue: (id: string, val: string) =>
      setCustomFieldValues((prev) => ({ ...prev, [id]: val })),
  };

  const experienceWidget = (
    <div className="rounded-3xl bg-card border border-border p-6 lg:p-7 shadow-lift">
      <CampaignDonationExperience campaign={campaign} embedded />
    </div>
  );

  const heroSidebar = isExperienceMode ? (
    !isRamadanSplit ? experienceWidget : null
  ) : (
    <CampaignDonationCard {...donationCardProps} />
  );

  return (
    <CampaignDetailLayout
      campaign={campaign}
      sym={sym}
      percentage={percentage}
      daysLeft={daysLeft}
      isFundraiser={isFundraiser}
      isRamadanSplit={isRamadanSplit}
      recentDonations={recentDonations}
      relatedCampaigns={relatedCampaigns}
      heroSidebar={heroSidebar}
      experienceContent={isExperienceMode ? experienceWidget : undefined}
      onShare={handleShare}
    />
  );
}
