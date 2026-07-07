"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchCampaignBySlug } from "@/lib/api";
import { sortCampaignAttributes } from "@/lib/campaign-attributes";
import { isExperienceCampaignMode } from "@/lib/campaign-experience";
import { CampaignDonationExperience } from "@/components/campaigns/CampaignDonationExperience";
import { CampaignDonationCard } from "@/components/campaigns/CampaignDonationCard";
import {
  CURRENCY_SYMBOLS,
  normalizeCampaignAttribute,
  type CampaignData,
} from "@/components/campaigns/campaign-detail-types";
import type { DonorScheduleChoice } from "@/lib/campaign-payment-config";
import { sourceFromDisplay } from "@/lib/currency";

interface CampaignDonationEmbedWidgetProps {
  slug: string;
  title?: string;
  className?: string;
}

export function CampaignDonationEmbedWidget({
  slug,
  title,
  className,
}: CampaignDonationEmbedWidgetProps) {
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedAttrIdx, setSelectedAttrIdx] = useState(0);
  const [paymentType, setPaymentType] = useState<"single" | "regular">("single");
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [selectedPresetDescription, setSelectedPresetDescription] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [donorSchedule, setDonorSchedule] = useState<DonorScheduleChoice>({ mode: "admin" });
  const [showCustomSchedule, setShowCustomSchedule] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const initAttributeState = useCallback((attr: CampaignData["attributes"][0]) => {
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
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);
    fetchCampaignBySlug(slug)
      .then((data) => {
        const normalized = data
          ? {
              ...data,
              attributes: sortCampaignAttributes(
                (data.attributes || []).map(normalizeCampaignAttribute)
              ),
            }
          : null;
        setCampaign(normalized);
        if (normalized?.attributes?.length) {
          initAttributeState(normalized.attributes[0]);
        }
      })
      .catch(() => {
        setCampaign(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [slug, initAttributeState]);

  const selectedAttr = campaign?.attributes?.[selectedAttrIdx];

  const handleSelectAttribute = useCallback(
    (idx: number) => {
      setSelectedAttrIdx(idx);
      const attr = campaign?.attributes?.[idx];
      if (!attr) return;
      initAttributeState(attr);
    },
    [campaign, initAttributeState]
  );

  const finalAmount = useMemo(() => {
    const sourceCurrency = campaign?.currency ?? "GBP";
    const base = customAmount
      ? sourceFromDisplay(Number(customAmount), sourceCurrency)
      : selectedAmount;
    const useQuantity = selectedAttr?.enableQuantity;
    return base * (useQuantity ? quantity : 1);
  }, [selectedAmount, customAmount, quantity, selectedAttr, campaign?.currency]);

  if (loading) {
    return (
      <div className={`my-8 flex items-center justify-center rounded-2xl border border-border bg-card p-10 ${className || ""}`}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className={`my-8 rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center ${className || ""}`}>
        <p className="text-sm font-medium text-foreground">Campaign donation block unavailable</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Could not load campaign &ldquo;{title || slug}&rdquo;.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
          <Link href="/campaigns">Browse campaigns</Link>
        </Button>
      </div>
    );
  }

  const sym = CURRENCY_SYMBOLS[campaign.currency] || "\u00a3";
  const isExperienceMode = isExperienceCampaignMode(campaign.campaignMode);
  const heading = title || campaign.title;

  return (
    <section
      className={`my-10 rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-50/50 via-card to-card p-5 md:p-6 shadow-soft not-prose ${className || ""}`}
      data-campaign-donation-widget={slug}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-purple-700">Donate now</p>
          <h3 className="mt-1 font-serif text-xl text-primary">{heading}</h3>
          {campaign.shortDescription ? (
            <p className="mt-1 text-sm text-muted-foreground">{campaign.shortDescription}</p>
          ) : null}
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-full text-purple-700">
          <Link href={`/campaigns/${campaign.slug}`}>View campaign</Link>
        </Button>
      </div>

      {isExperienceMode ? (
        <CampaignDonationExperience campaign={campaign} embedded />
      ) : (
        <CampaignDonationCard
          campaign={campaign}
          sym={sym}
          selectedAttr={selectedAttr}
          selectedAttrIdx={selectedAttrIdx}
          paymentType={paymentType}
          selectedAmount={selectedAmount}
          customAmount={customAmount}
          selectedPresetDescription={selectedPresetDescription}
          donorSchedule={donorSchedule}
          showCustomSchedule={showCustomSchedule}
          quantity={quantity}
          customFieldValues={customFieldValues}
          finalAmount={finalAmount}
          onSelectAttribute={handleSelectAttribute}
          onSetSelectedAmount={(amount, description) => {
            setSelectedAmount(amount);
            setSelectedPresetDescription(description ?? "");
          }}
          onSetCustomAmount={setCustomAmount}
          onSetDonorSchedule={setDonorSchedule}
          onSetShowCustomSchedule={setShowCustomSchedule}
          onSetQuantity={setQuantity}
          onSetCustomFieldValue={(id, val) =>
            setCustomFieldValues((prev) => ({ ...prev, [id]: val }))
          }
        />
      )}
    </section>
  );
}
