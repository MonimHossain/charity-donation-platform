import type { Currency } from "./enums";

export type DonationPageStatus = "draft" | "published" | "archived";

export type DonationExperienceType =
  | "standard"
  | "fidya_kaffarah"
  | "ramadan_split"
  | "zakat_calc";

export type DonationExperienceStandard = {
  type: "standard";
  /**
   * If present, the experience will pre-select a campaign on the universal /donate page.
   * This is optional because a donation page may be independent of a campaign.
   */
  defaultCampaignId?: string;
};

export type DonationExperienceFidyaKaffarah = {
  type: "fidya_kaffarah";
  options: Array<{
    key: "fidya" | "kaffarah" | string;
    label: string;
    unitPrice?: number;
    currency?: Currency;
    description?: string;
  }>;
  quantity?: { min: number; max: number; default?: number; label?: string };
  /**
   * Optional: allow donors to override the computed total with a custom amount.
   * Useful for cases where Fidya/Kaffarah is either quantity×unitPrice OR a custom total.
   */
  allowCustomAmount?: boolean;
  customAmount?: { min?: number; max?: number; placeholder?: string; label?: string };
  /** @deprecated Cart flow uses /donation/checkout */
  ctaBehavior?: "checkout_now";
};

export type RamadanRegionId = "middle_east" | "south_asia" | "western";

export type RamadanStartChoice = {
  id: string;
  label: string;
  date: string;
  /** Maps this start date to a global region (auto-selected from donor location). */
  region?: RamadanRegionId;
};

export type DonationExperienceRamadanSplit = {
  type: "ramadan_split";
  /** Admin-only: first day of Ramadan (donors pick nights within this window). */
  ramadanStartDate?: string;
  /** Max calendar days shown (≤ 30). Defaults to 30. */
  maxNights?: number;
  currency?: Currency;
  campaignId?: string;
  /** @deprecated Use ramadanStartDate */
  nights?: number;
  weights?: number[];
  startChoices?: RamadanStartChoice[];
  presets?: Array<{ id: string; label: string; weights: number[] }>;
};

export type DonationExperienceZakatCalc = {
  type: "zakat_calc";
  currency?: Currency;
};

export type DonationExperience =
  | DonationExperienceStandard
  | DonationExperienceFidyaKaffarah
  | DonationExperienceRamadanSplit
  | DonationExperienceZakatCalc;

/**
 * API donation page shape (DB-backed).
 * Note: The web app also has a richer mock donation page store; this DTO is for API.
 */
export type DonationPageDto = {
  id: string;
  title: string;
  slug: string;
  category: string;
  shortDescription?: string | null;
  image?: string | null;
  status: DonationPageStatus;
  campaignId?: string | null;
  config: {
    experience: DonationExperience;
    currency?: Currency;
    visibility?: {
      homepageFeatured?: boolean;
      headerFeatured?: boolean;
      priority?: number;
    };
    [k: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
};

