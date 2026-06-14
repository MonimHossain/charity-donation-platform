import type {
  PresetAmount,
  RecurrenceConfig,
  RegularPaymentConfig,
  SinglePaymentConfig,
} from "@/lib/campaign-payment-config";
import {
  normalizeRegularPaymentConfig,
  normalizeSinglePaymentConfig,
} from "@/lib/campaign-payment-config";

export type { PresetAmount, RecurrenceConfig, RegularPaymentConfig, SinglePaymentConfig };

export interface QuantityConfig {
  quantityLabel: string;
  minQuantity: number;
  maxQuantity: number;
}

export interface CustomField {
  id: string;
  fieldType: string;
  label: string;
  placeholder: string;
  isRequired: boolean;
  defaultValue: string;
  options: string[];
}

export interface CampaignAttribute {
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

/** Normalize attribute payment configs loaded from the API (handles legacy JSON). */
export function normalizeCampaignAttribute(attr: CampaignAttribute): CampaignAttribute {
  return {
    ...attr,
    singlePaymentConfig: normalizeSinglePaymentConfig(attr.singlePaymentConfig),
    regularPaymentConfig: normalizeRegularPaymentConfig(attr.regularPaymentConfig),
  };
}

export interface CampaignUpsell {
  id: string;
  name: string;
  amount: number;
  description?: string;
  image?: string;
  isActive?: boolean;
  /** @deprecated legacy inline upsell */
  label?: string;
}

export interface FundraiserSettings {
  targetAmount: number;
  raisedAmount: number;
  startDate: string;
  endDate: string;
  showProgressBar: boolean;
}

export interface CheckoutSettings {
  allowAnonymous: boolean;
  enableGiftAid: boolean;
  enableDedication: boolean;
  enableComments: boolean;
  enableUpsell: boolean;
  enableFeeCoverage: boolean;
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
}

export interface CampaignData {
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
  expirationEnabled?: boolean;
  expiresAt?: string | null;
  campaignMode: string;
  currency: string;
  donorCount: number;
  experienceConfig?: Record<string, unknown>;
  attributes: CampaignAttribute[];
  upsells: CampaignUpsell[];
  fundraiserSettings: FundraiserSettings;
  checkoutSettings: CheckoutSettings;
  seoSettings: SeoSettings;
}

export interface RecentDonation {
  donorName: string;
  amount: number;
  currency: string;
  createdAt: string;
  paymentType?: string;
}

export interface RelatedCampaign {
  slug: string;
  title: string;
  shortDescription: string;
  thumbnail?: string;
  banner?: string;
  category?: string;
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "\u00a3",
  USD: "$",
  EUR: "\u20ac",
  CAD: "C$",
  AUD: "A$",
  AED: "د.إ",
  SAR: "﷼",
  MYR: "RM",
};

export const TAG_COLORS: Record<string, string> = {
  zakat: "bg-emerald-100 text-emerald-700",
  sadaqah: "bg-blue-100 text-blue-700",
  lillah: "bg-purple-100 text-purple-700",
  emergency: "bg-red-100 text-red-700",
  ramadan: "bg-amber-100 text-amber-700",
  general: "bg-gray-100 text-gray-700",
};
