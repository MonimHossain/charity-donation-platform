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
  normalizeCampaignAttribute,
  type CampaignData,
  type RecentDonation,
  type RelatedCampaign,
} from "@/components/campaigns/campaign-detail-types";
import type { DonorScheduleChoice } from "@/lib/campaign-payment-config";

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
  const [selectedPresetDescription, setSelectedPresetDescription] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [donorSchedule, setDonorSchedule] = useState<DonorScheduleChoice>({ mode: "admin" });
  const [showCustomSchedule, setShowCustomSchedule] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  function initAttributeState(attr: CampaignData["attributes"][0]) {
    const normalized = normalizeCampaignAttribute(attr);
    setCustomAmount("");
    setSelectedPresetDescription("");
    setDonorSchedule({ mode: "admin" });
    setShowCustomSchedule(false);
    setQuantity(normalized.enableQuantity ? normalized.quantityConfig.minQuantity : 1);
    setCustomFieldValues({});

    if (normalized.enableRegularPayment) {
      setPaymentType("regular");
      const presets = normalized.regularPaymentConfig.presetAmounts;
      if (presets.length > 0) {
        setSelectedAmount(presets[0]?.amount ?? 0);
        setSelectedPresetDescription(presets[0]?.description ?? "");
      } else {
        setSelectedAmount(0);
      }
      return;
    }

    setPaymentType("single");
    const presets = normalized.singlePaymentConfig.presetAmounts;
    if (presets.length > 0) {
      setSelectedAmount(presets[0]?.amount ?? 0);
      setSelectedPresetDescription(presets[0]?.description ?? "");
    } else {
      setSelectedAmount(0);
    }
  }

  useEffect(() => {
    fetchCampaignBySlug(slug)
      .then((data) => {
        const normalized = data
          ? {
              ...data,
              attributes: (data.attributes || []).map(normalizeCampaignAttribute),
            }
          : null;
        setCampaign(normalized);
        if (normalized?.attributes?.length > 0) {
          initAttributeState(normalized.attributes[0]);
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
      initAttributeState(attr);
    },
    [campaign]
  );

  const finalAmount = useMemo(() => {
    const base = customAmount ? Number(customAmount) : selectedAmount;
    const useQuantity = selectedAttr?.enableQuantity;
    return base * (useQuantity ? quantity : 1);
  }, [selectedAmount, customAmount, quantity, selectedAttr]);

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
    selectedPresetDescription,
    donorSchedule,
    showCustomSchedule,
    quantity,
    customFieldValues,
    finalAmount,
    onSelectAttribute: handleSelectAttribute,
    onSetSelectedAmount: (amount: number, description?: string) => {
      setSelectedAmount(amount);
      setSelectedPresetDescription(description ?? "");
    },
    onSetCustomAmount: setCustomAmount,
    onSetDonorSchedule: setDonorSchedule,
    onSetShowCustomSchedule: setShowCustomSchedule,
    onSetQuantity: setQuantity,
    onSetCustomFieldValue: (id: string, val: string) =>
      setCustomFieldValues((prev) => ({ ...prev, [id]: val })),
  };

  const experienceWidget = (
    <div className="rounded-3xl bg-card border border-border p-6 lg:p-7 shadow-lift">
      <CampaignDonationExperience campaign={campaign} embedded />
    </div>
  );

  const heroSidebar = isExperienceMode ? experienceWidget : (
    <CampaignDonationCard {...donationCardProps} />
  );

  return (
    <CampaignDetailLayout
      campaign={campaign}
      sym={sym}
      percentage={percentage}
      daysLeft={daysLeft}
      isFundraiser={isFundraiser}
      recentDonations={recentDonations}
      relatedCampaigns={relatedCampaigns}
      heroSidebar={heroSidebar}
      onShare={handleShare}
    />
  );
}
