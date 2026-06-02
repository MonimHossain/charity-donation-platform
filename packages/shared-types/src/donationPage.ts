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

export type RamadanStartChoice = { id: string; label: string; date: string };

export type DonationExperienceRamadanSplit = {
  type: "ramadan_split";
  nights: number; // usually 30
  /**
   * Admin-defined weights/percentages per night.
   * Length should equal `nights`. Values can be any non-negative numbers; UI normalizes.
   */
  weights: number[];
  startChoices: RamadanStartChoice[];
  /**
   * Optional helper presets (for UI buttons like “Popular last 10”).
   * Each preset is also admin-defined, since you selected admin-editable logic.
   */
  presets?: Array<{
    id: string;
    label: string;
    weights: number[];
  }>;
  currency?: Currency;
  /**
   * Optional: link donations to a campaign.
   */
  campaignId?: string;
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

