"use client";

import FidyaKaffarahForm from "@/components/donation/FidyaKaffarahForm";
import { RamadanSplitForm } from "@/components/donation/RamadanSplitExperience";
import {
  DEFAULT_FIDYA_CONFIG,
  DEFAULT_RAMADAN_CONFIG,
  type FidyaKaffarahConfig,
  type RamadanSplitConfig,
} from "@/lib/campaign-experience";
import { campaignToDonationSource } from "@/lib/donation-source";
import type { CheckoutSettings } from "@/components/campaigns/campaign-detail-types";
import { DEFAULT_CHECKOUT_SETTINGS, type CampaignUpsell } from "@/lib/checkout-campaign-config";
import type { DonationExperienceFidyaKaffarah, DonationExperienceRamadanSplit } from "@icac/shared-types";

interface CampaignExperienceProps {
  campaign: {
    id: string;
    slug: string;
    title: string;
    shortDescription?: string;
    category: string;
    currency?: string;
    campaignMode: string;
    checkoutSettings?: CheckoutSettings;
    upsells?: CampaignUpsell[];
    experienceConfig?: FidyaKaffarahConfig | RamadanSplitConfig | Record<string, unknown>;
  };
  embedded?: boolean;
}

export function CampaignDonationExperience({ campaign, embedded = true }: CampaignExperienceProps) {
  const source = campaignToDonationSource(campaign);
  const checkoutSettings = campaign.checkoutSettings ?? DEFAULT_CHECKOUT_SETTINGS;
  const checkoutUpsells = campaign.upsells ?? [];

  if (campaign.campaignMode === "fidya_kaffarah") {
    const config = { ...DEFAULT_FIDYA_CONFIG, ...(campaign.experienceConfig as FidyaKaffarahConfig) };
    const experience: DonationExperienceFidyaKaffarah = { type: "fidya_kaffarah", ...config };
    return (
      <FidyaKaffarahForm
        source={source}
        experience={experience}
        embedded={embedded}
        checkoutSettings={checkoutSettings}
        checkoutUpsells={checkoutUpsells}
      />
    );
  }

  if (campaign.campaignMode === "ramadan_split") {
    const config = { ...DEFAULT_RAMADAN_CONFIG, ...(campaign.experienceConfig as RamadanSplitConfig) };
    const experience: DonationExperienceRamadanSplit = {
      type: "ramadan_split",
      ...config,
      campaignId: campaign.id,
      currency: campaign.currency,
    };
    return (
      <RamadanSplitForm
        source={source}
        experience={experience}
        embedded={embedded}
        checkoutSettings={checkoutSettings}
        checkoutUpsells={checkoutUpsells}
      />
    );
  }

  return null;
}
