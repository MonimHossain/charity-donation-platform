import type { DonationExperienceFidyaKaffarah, DonationExperienceRamadanSplit } from "@icac/shared-types";
import { buildDefaultRamadanStartChoices } from "./ramadan-region";

export type FidyaKaffarahConfig = Omit<DonationExperienceFidyaKaffarah, "type">;
export type RamadanSplitConfig = Omit<DonationExperienceRamadanSplit, "type">;

export type CampaignExperienceConfig = FidyaKaffarahConfig | RamadanSplitConfig | Record<string, never>;

export const DEFAULT_FIDYA_CONFIG: FidyaKaffarahConfig = {
  options: [
    { key: "fidya", label: "Fidya", unitPrice: 5 },
    { key: "kaffarah", label: "Kaffarah", unitPrice: 300 },
  ],
  quantity: { min: 1, max: 999, default: 1, label: "Quantity:" },
  allowCustomAmount: false,
  customAmount: { min: 1, max: 100000, placeholder: "Enter amount", label: "Custom amount" },
};

const defaultRamadanDate = new Date().toISOString().slice(0, 10);

export const DEFAULT_RAMADAN_CONFIG: RamadanSplitConfig = {
  ramadanStartDate: defaultRamadanDate,
  maxNights: 30,
  startChoices: buildDefaultRamadanStartChoices(defaultRamadanDate),
};

export const CAMPAIGN_MODE_LABELS: Record<string, string> = {
  standard: "Standard",
  fundraiser: "Fundraiser",
  sponsorship: "Sponsorship",
  zakat: "Zakat",
  automated: "Automated",
  fidya_kaffarah: "Fidya / Kaffarah",
  ramadan_split: "Ramadan Split",
};

export function isExperienceCampaignMode(mode: string): boolean {
  return mode === "fidya_kaffarah" || mode === "ramadan_split";
}
