import type { QuickDonateCampaignPayload } from "@/lib/quick-donate-campaign";

export interface QuickDonatePrice {
  amount: number;
  sortOrder: number;
}

export interface QuickDonateOption {
  id: string;
  label: string;
  campaignId?: string | null;
  campaignSlug?: string | null;
  campaignTitle?: string | null;
  sortOrder?: number;
  /** Populated from linked campaign on the public API */
  campaign?: QuickDonateCampaignPayload | null;
  /** @deprecated Prices now come from the linked campaign */
  prices?: QuickDonatePrice[];
  /** @deprecated Derived from campaign attribute payment config */
  allowCustomPrice?: boolean;
}

export interface DonationCategoryOption {
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface QuickDonateConfig {
  options: QuickDonateOption[];
  settings: {
    donationCategories: DonationCategoryOption[];
    showSingleFrequency: boolean;
    showRegularFrequency: boolean;
  };
}

export const FALLBACK_QUICK_DONATE: QuickDonateConfig = {
  options: [
    { id: "gaza", label: "Gaza Emergency", campaignSlug: "gaza-emergency-relief", prices: [{ amount: 20, sortOrder: 0 }, { amount: 40, sortOrder: 1 }, { amount: 50, sortOrder: 2 }] },
    { id: "food", label: "Food Aid", campaignSlug: "food", prices: [{ amount: 20, sortOrder: 0 }, { amount: 40, sortOrder: 1 }, { amount: 50, sortOrder: 2 }] },
    { id: "emergency", label: "Emergency Aid", campaignSlug: "emergency", prices: [{ amount: 20, sortOrder: 0 }, { amount: 40, sortOrder: 1 }, { amount: 50, sortOrder: 2 }] },
    { id: "zakat", label: "Zakat Appeal", campaignSlug: "zakat", prices: [{ amount: 20, sortOrder: 0 }, { amount: 40, sortOrder: 1 }, { amount: 50, sortOrder: 2 }] },
    { id: "water", label: "Water Projects", campaignSlug: "water", prices: [{ amount: 20, sortOrder: 0 }, { amount: 40, sortOrder: 1 }, { amount: 50, sortOrder: 2 }] },
    { id: "livelihood", label: "Livelihood Projects", campaignSlug: "livelihood", prices: [{ amount: 20, sortOrder: 0 }, { amount: 40, sortOrder: 1 }, { amount: 50, sortOrder: 2 }] },
    { id: "orphans", label: "Orphan Sponsorship", campaignSlug: "orphans", prices: [{ amount: 20, sortOrder: 0 }, { amount: 40, sortOrder: 1 }, { amount: 50, sortOrder: 2 }] },
    { id: "greatest", label: "Need Is Greatest", campaignSlug: "where-needed-most", prices: [{ amount: 20, sortOrder: 0 }, { amount: 40, sortOrder: 1 }, { amount: 50, sortOrder: 2 }] },
  ],
  settings: {
    donationCategories: [
      { value: "general", label: "General Donation", sortOrder: 0, isActive: true },
      { value: "zakat", label: "Zakat", sortOrder: 1, isActive: true },
      { value: "sadaqah", label: "Sadaqah", sortOrder: 2, isActive: true },
    ],
    showSingleFrequency: true,
    showRegularFrequency: true,
  },
};

export function resolveQuickDonateConfig(raw: Partial<QuickDonateConfig> | null | undefined): QuickDonateConfig {
  const options =
    raw == null
      ? FALLBACK_QUICK_DONATE.options
      : Array.isArray(raw.options)
        ? raw.options.filter((o) => o.campaignId && o.campaign)
        : [];
  const categories =
    Array.isArray(raw?.settings?.donationCategories) && raw.settings.donationCategories.length > 0
      ? raw.settings.donationCategories.filter((c) => c.isActive)
      : FALLBACK_QUICK_DONATE.settings.donationCategories;

  return {
    options,
    settings: {
      donationCategories: categories,
      showSingleFrequency: raw?.settings?.showSingleFrequency ?? true,
      showRegularFrequency: raw?.settings?.showRegularFrequency ?? true,
    },
  };
}

/** Pick the 2nd-lowest price for quick-donate default selection. */
export function defaultQuickDonateAmount(
  prices: Array<{ amount: number; sortOrder?: number }>
): number {
  const sorted = [...prices].sort((a, b) => a.amount - b.amount);
  if (sorted.length === 0) return 50;
  if (sorted.length === 1) return sorted[0].amount;
  return sorted[1].amount;
}

export function slugifyLabel(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const QUICK_DONATION_TYPE = "quick_donation";

export function formatDonationTypeLabel(donationType?: string): string {
  if (!donationType) return "—";
  if (donationType === QUICK_DONATION_TYPE) return "Quick Donation";
  return donationType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
