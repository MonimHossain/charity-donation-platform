// Universal donation engine — admin-configurable donation pages.
// Demo only: persisted in localStorage. One engine drives every campaign type
// (standard, fundraiser, sponsorship, zakat, automated, qurbani, emergency).

import { useSyncExternalStore } from "react";

export const uid = () => Math.random().toString(36).slice(2, 10);

export type CampaignMode =
  | "standard"
  | "fundraiser"
  | "sponsorship"
  | "zakat"
  | "automated"
  | "qurbani"
  | "emergency";

export type BillingInterval = "daily" | "weekly" | "monthly" | "yearly";

export type DurationType =
  | "never"
  | "days"
  | "months"
  | "years"
  | "cycles"
  | "end_date";

export interface SinglePrice {
  id: string;
  amount: number;
  label?: string;
  description?: string;
}

export interface RecurringPrice {
  id: string;
  amount: number;
  interval: BillingInterval;
  label?: string;
  description?: string;
  durationType: DurationType;
  durationValue?: number; // days/months/years/cycles
  endDate?: string; // ISO when durationType=end_date
}

export interface SinglePaymentConfig {
  enabled: boolean;
  prices: SinglePrice[];
  allowCustom: boolean;
  minAmount?: number;
  maxAmount?: number;
}

export interface RecurringPaymentConfig {
  enabled: boolean;
  intervals: BillingInterval[];
  prices: RecurringPrice[];
}

export interface QuantityConfig {
  enabled: boolean;
  label: string;
  min: number;
  max: number;
}

export type FieldType =
  | "text"
  | "textarea"
  | "dropdown"
  | "radio"
  | "checkbox"
  | "number"
  | "date"
  | "file";

export interface ConditionalRule {
  fieldId: string;
  equals: string;
}

export interface DynamicField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  defaultValue?: string;
  helpText?: string;
  width: "full" | "half";
  options?: string[];
  conditional?: ConditionalRule | null;
}

export interface Attribute {
  id: string;
  name: string;
  description: string;
  image?: string;
  sortOrder: number;
  active: boolean;
  single: SinglePaymentConfig;
  recurring: RecurringPaymentConfig;
  quantity: QuantityConfig;
  fields: DynamicField[];
}

export interface FundraiserConfig {
  enabled: boolean;
  targetAmount: number;
  raisedAmount: number;
  startDate?: string;
  endDate?: string;
  showProgress: boolean;
  autoClose: boolean;
  allowOverfunding: boolean;
}

export interface CheckoutConfig {
  anonymous: boolean;
  giftAid: boolean;
  dedication: boolean;
  prayerMessage: boolean;
  coverFees: boolean;
  upsell: boolean;
  termsRequired: boolean;
}

export type UpsellType = "fixed" | "percentage" | "round_up";
export interface Upsell {
  id: string;
  type: UpsellType;
  label: string;
  value: number; // amount or percentage
}

export interface VisibilityConfig {
  featured: boolean;
  urgent: boolean;
  homepageFeatured: boolean;
  headerFeatured: boolean;
  sticky: boolean;
  priority: number;
}

export type Gateway = "stripe" | "paypal" | "telr" | "paytabs";

export interface SeoConfig {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
}

export type DonationPageStatus = "draft" | "published";

export interface DonationPage {
  id: string;
  // Campaign-level info
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string; // rich text (HTML)
  thumbnail: string;
  banner: string;
  category: string;
  tags: string[];
  status: DonationPageStatus;
  featured: boolean;
  urgent: boolean;
  // Modes (visibility only, no schema impact)
  modes: CampaignMode[];
  // Engine
  attributes: Attribute[];
  // Optional modules
  fundraiser: FundraiserConfig;
  checkout: CheckoutConfig;
  upsells: Upsell[];
  visibility: VisibilityConfig;
  gateways: Gateway[];
  currency: string;
  seo: SeoConfig;
  createdAt: string;
  updatedAt: string;
}

export const newAttribute = (): Attribute => ({
  id: uid(),
  name: "New attribute",
  description: "",
  image: "",
  sortOrder: 0,
  active: true,
  single: {
    enabled: true,
    prices: [
      { id: uid(), amount: 10 },
      { id: uid(), amount: 50 },
      { id: uid(), amount: 100 },
    ],
    allowCustom: true,
    minAmount: 1,
    maxAmount: 10000,
  },
  recurring: {
    enabled: false,
    intervals: ["monthly"],
    prices: [],
  },
  quantity: { enabled: false, label: "Quantity", min: 1, max: 100 },
  fields: [],
});

export const newDonationPage = (): DonationPage => ({
  id: `dp-${uid()}`,
  title: "Untitled donation page",
  slug: `donation-${uid()}`,
  shortDescription: "",
  fullDescription: "",
  thumbnail: "",
  banner: "",
  category: "General",
  tags: [],
  status: "draft",
  featured: false,
  urgent: false,
  modes: ["standard"],
  attributes: [newAttribute()],
  fundraiser: {
    enabled: false,
    targetAmount: 50000,
    raisedAmount: 0,
    showProgress: true,
    autoClose: false,
    allowOverfunding: true,
  },
  checkout: {
    anonymous: true,
    giftAid: true,
    dedication: false,
    prayerMessage: false,
    coverFees: true,
    upsell: false,
    termsRequired: true,
  },
  upsells: [],
  visibility: {
    featured: false,
    urgent: false,
    homepageFeatured: false,
    headerFeatured: false,
    sticky: false,
    priority: 0,
  },
  gateways: ["stripe"],
  currency: "GBP",
  seo: {
    metaTitle: "",
    metaDescription: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    canonicalUrl: "",
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const KEY = "donation-pages-v1";
let pages: DonationPage[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const persist = () => {
  try { localStorage.setItem(KEY, JSON.stringify(pages)); } catch {}
};

const seed = (): DonationPage[] => {
  const p = newDonationPage();
  p.title = "Ramadan Appeal 2026";
  p.slug = "ramadan-appeal-2026";
  p.shortDescription = "Provide iftar, water, and shelter throughout the holy month.";
  p.category = "Ramadan";
  p.tags = ["ramadan", "iftar", "zakat"];
  p.status = "published";
  p.featured = true;
  p.urgent = true;
  p.modes = ["standard", "zakat", "emergency"];
  p.fundraiser = { ...p.fundraiser, enabled: true, targetAmount: 100000, raisedAmount: 64200 };
  const a1 = newAttribute();
  a1.name = "Feed a Family";
  a1.description = "Iftar packs delivered nightly to families in need.";
  a1.single.prices = [
    { id: uid(), amount: 25, label: "Iftar for one", description: "Feeds 1 person for the month" },
    { id: uid(), amount: 100, label: "Family pack", description: "Feeds a family of 4" },
    { id: uid(), amount: 300, label: "Village support" },
  ];
  a1.recurring = {
    enabled: true,
    intervals: ["monthly"],
    prices: [
      { id: uid(), amount: 10, interval: "monthly", label: "£10/mo", description: "Feed one orphan", durationType: "never" },
      { id: uid(), amount: 25, interval: "monthly", label: "£25/mo", durationType: "cycles", durationValue: 12 },
    ],
  };
  a1.quantity = { enabled: true, label: "Food packs", min: 1, max: 50 };
  const a2 = newAttribute();
  a2.name = "Water Support";
  a2.description = "Clean water wells in remote villages.";
  a2.single.prices = [
    { id: uid(), amount: 50, label: "Water filter" },
    { id: uid(), amount: 500, label: "Hand pump well" },
    { id: uid(), amount: 2500, label: "Solar well" },
  ];
  p.attributes = [a1, a2];
  p.upsells = [
    { id: uid(), type: "fixed", label: "Add £10 emergency aid", value: 10 },
    { id: uid(), type: "percentage", label: "Cover 5% processing fees", value: 5 },
    { id: uid(), type: "round_up", label: "Round up to nearest £10", value: 10 },
  ];
  p.checkout = { ...p.checkout, dedication: true, upsell: true };
  p.gateways = ["stripe", "paypal"];
  p.seo.metaTitle = "Ramadan Appeal 2026 — Donate Today";
  p.seo.metaDescription = "Provide iftar, water, and shelter throughout the holy month.";
  return [p];
};

const hydrate = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) pages = JSON.parse(raw);
  } catch {}
  if (pages.length === 0) {
    pages = seed();
    persist();
  }
};

if (typeof window !== "undefined") hydrate();

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const get = () => pages;

export const useDonationPages = () => useSyncExternalStore(subscribe, get, get);
export const useDonationPage = (id?: string) =>
  useSyncExternalStore(subscribe, () => pages.find((p) => p.id === id), () => pages.find((p) => p.id === id));

export const createDonationPage = (): DonationPage => {
  const p = newDonationPage();
  pages = [p, ...pages];
  persist(); emit();
  return p;
};

export const upsertDonationPage = (p: DonationPage) => {
  p.updatedAt = new Date().toISOString();
  const i = pages.findIndex((x) => x.id === p.id);
  pages = i >= 0 ? pages.map((x) => (x.id === p.id ? p : x)) : [p, ...pages];
  persist(); emit();
};

export const deleteDonationPage = (id: string) => {
  pages = pages.filter((p) => p.id !== id);
  persist(); emit();
};

export const duplicateDonationPage = (id: string) => {
  const src = pages.find((p) => p.id === id);
  if (!src) return null;
  const copy: DonationPage = JSON.parse(JSON.stringify(src));
  copy.id = `dp-${uid()}`;
  copy.slug = `${src.slug}-copy-${uid().slice(0, 4)}`;
  copy.title = `${src.title} (copy)`;
  copy.status = "draft";
  copy.createdAt = copy.updatedAt = new Date().toISOString();
  pages = [copy, ...pages];
  persist(); emit();
  return copy;
};

export const togglePublish = (id: string) => {
  pages = pages.map((p) =>
    p.id === id
      ? { ...p, status: p.status === "published" ? "draft" : "published", updatedAt: new Date().toISOString() }
      : p
  );
  persist(); emit();
};
