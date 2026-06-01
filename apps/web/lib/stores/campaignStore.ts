// Lightweight campaign + attribute store with localStorage persistence.
// Demo only — no backend. Lets admin edits flow to the public site instantly.

import { useSyncExternalStore } from "react";
import { demoCampaigns } from "@/lib/mock/campaigns";
import type { DemoCampaign } from "@/lib/mock/types";

export type BillingFreq = "daily" | "weekly" | "monthly";
export type PriceMode = "one_time" | "recurring";

export interface PriceOption {
  id: string;
  amount: number;
  label?: string;
  description?: string;
  quantityEnabled?: boolean;
  mode: PriceMode;
  frequency?: BillingFreq;
  durationType?: "cycles" | "end_date" | "open";
  cycles?: number;
  endDate?: string;
  cancellationPolicy?: string;
}

export interface DonationAttribute {
  id: string;
  type: "single" | "regular" | "fidyah" | "kaffarah" | "custom";
  title: string;
  description: string;
  prices: PriceOption[];
}

export type FieldType = "text" | "textarea" | "radio" | "checkbox" | "dropdown";
export interface CustomField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
  conditional?: { fieldId: string; equals: string } | null;
}

export type BlockType = "heading" | "text" | "image" | "gallery" | "video" | "quote" | "list";
export interface Block {
  id: string;
  type: BlockType;
  content: string;
  extra?: string[];
}

export interface PaymentConfig {
  provider: "stripe";
  currency: string;
  statementDescriptor: string;
  receiptEmailFrom: string;
  allowApplePay: boolean;
  allowGooglePay: boolean;
  allowCard: boolean;
  giftAid: boolean;
}

export interface SeoConfig {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
}

export interface CampaignConfig extends DemoCampaign {
  attributes: DonationAttribute[];
  fields: CustomField[];
  blocks: Block[];
  payment: PaymentConfig;
  seo: SeoConfig;
  published: boolean;
  updatedAt: string;
}

export interface SavedAttribute extends DonationAttribute {
  savedAt: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultPayment = (currency = "GBP"): PaymentConfig => ({
  provider: "stripe",
  currency,
  statementDescriptor: "DONATION",
  receiptEmailFrom: "receipts@yourcharity.org",
  allowApplePay: true,
  allowGooglePay: true,
  allowCard: true,
  giftAid: currency === "GBP",
});

const defaultAttributes = (): DonationAttribute[] => [
  {
    id: uid(), type: "single", title: "One-time gift",
    description: "A single donation goes directly to the field.",
    prices: [
      { id: uid(), amount: 25, mode: "one_time", description: "Provides emergency food parcels" },
      { id: uid(), amount: 50, mode: "one_time", description: "Clean water for a family for a month" },
      { id: uid(), amount: 100, mode: "one_time", description: "Medical aid for ten patients" },
    ],
  },
  {
    id: uid(), type: "regular", title: "Monthly support",
    description: "Sustained giving creates lasting change.",
    prices: [
      { id: uid(), amount: 10, mode: "recurring", frequency: "monthly", durationType: "open", description: "Daily meals for a child" },
      { id: uid(), amount: 30, mode: "recurring", frequency: "monthly", durationType: "open", description: "Sponsor an orphan", cancellationPolicy: "Cancel anytime." },
    ],
  },
];

const upgrade = (c: DemoCampaign): CampaignConfig => ({
  ...c,
  attributes: defaultAttributes(),
  fields: [
    { id: uid(), type: "text", label: "Dedication name (optional)", required: false },
    { id: uid(), type: "checkbox", label: "Make this donation in someone's honour", required: false, options: ["Yes"] },
  ],
  blocks: [
    { id: uid(), type: "heading", content: "Why this appeal matters" },
    { id: uid(), type: "text", content: c.description },
    { id: uid(), type: "quote", content: "Whoever saves one life — it is as if he had saved all of mankind." },
    { id: uid(), type: "heading", content: "How your donation helps" },
    { id: uid(), type: "list", content: "£25 provides emergency food parcels for a family\n£50 delivers clean water to a household for a month\n£100 funds urgent medical aid for ten patients\n£250 sponsors a child's education for a year" },
    { id: uid(), type: "image", content: c.image },
    { id: uid(), type: "heading", content: "On the ground updates" },
    { id: uid(), type: "text", content: "Our field teams are working around the clock to deliver aid where it's needed most. Every contribution is tracked end to end and 100% of public donations reach the people we serve." },
    { id: uid(), type: "gallery", content: "", extra: [c.image, c.image, c.image] },
  ],
  payment: defaultPayment(c.currency),
  seo: { metaTitle: c.title, metaDescription: c.summary, ogImage: c.image },
  published: c.status === "published",
  updatedAt: new Date().toISOString(),
});

const KEY = "demo-campaigns-v3";
const SAVED_KEY = "demo-saved-attributes-v1";

let state = {
  campaigns: [] as CampaignConfig[],
  saved: [] as SavedAttribute[],
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state.campaigns));
    localStorage.setItem(SAVED_KEY, JSON.stringify(state.saved));
  } catch {}
};

const hydrate = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state.campaigns = JSON.parse(raw);
    const rawSaved = localStorage.getItem(SAVED_KEY);
    if (rawSaved) state.saved = JSON.parse(rawSaved);
  } catch {}
  if (state.campaigns.length === 0) {
    state.campaigns = demoCampaigns.map(upgrade);
    persist();
  }
};

if (typeof window !== "undefined") hydrate();

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

export const useCampaigns = () =>
  useSyncExternalStore(subscribe, () => state.campaigns, () => state.campaigns);

export const useSavedAttributes = () =>
  useSyncExternalStore(subscribe, () => state.saved, () => state.saved);

export const useCampaign = (id?: string) =>
  useSyncExternalStore(
    subscribe,
    () => state.campaigns.find((c) => c.id === id),
    () => state.campaigns.find((c) => c.id === id)
  );

export const getCampaignBySlug = (slug: string) =>
  state.campaigns.find((c) => c.slug === slug);

export const upsertCampaign = (c: CampaignConfig) => {
  const i = state.campaigns.findIndex((x) => x.id === c.id);
  c.updatedAt = new Date().toISOString();
  c.status = c.published ? "published" : "draft";
  state.campaigns = i >= 0
    ? state.campaigns.map((x) => (x.id === c.id ? c : x))
    : [c, ...state.campaigns];
  persist(); emit();
};

export const createCampaign = (): CampaignConfig => {
  const c: CampaignConfig = {
    id: `c-${uid()}`, slug: `campaign-${uid()}`, title: "Untitled campaign",
    summary: "", description: "", image: "", tag: "General", urgent: false,
    goal: 50000, raised: 0, currency: "GBP", donors: 0,
    status: "draft", attributes: defaultAttributes(), fields: [],
    blocks: [{ id: uid(), type: "heading", content: "About this appeal" }],
    payment: defaultPayment(), seo: { metaTitle: "", metaDescription: "", ogImage: "" },
    published: false, updatedAt: new Date().toISOString(),
  };
  state.campaigns = [c, ...state.campaigns];
  persist(); emit();
  return c;
};

export const duplicateCampaign = (id: string): CampaignConfig | null => {
  const src = state.campaigns.find((c) => c.id === id);
  if (!src) return null;
  const copy: CampaignConfig = JSON.parse(JSON.stringify(src));
  copy.id = `c-${uid()}`;
  copy.slug = `${src.slug}-copy-${uid().slice(0, 4)}`;
  copy.title = `${src.title} (copy)`;
  copy.published = false; copy.status = "draft"; copy.raised = 0; copy.donors = 0;
  copy.updatedAt = new Date().toISOString();
  state.campaigns = [copy, ...state.campaigns];
  persist(); emit();
  return copy;
};

export const deleteCampaign = (id: string) => {
  state.campaigns = state.campaigns.filter((c) => c.id !== id);
  persist(); emit();
};

export const togglePublished = (id: string) => {
  state.campaigns = state.campaigns.map((c) =>
    c.id === id ? { ...c, published: !c.published, status: !c.published ? "published" : "draft", updatedAt: new Date().toISOString() } : c
  );
  persist(); emit();
};

export const saveAttribute = (a: DonationAttribute) => {
  const sa: SavedAttribute = { ...a, id: `sa-${uid()}`, savedAt: new Date().toISOString() };
  state.saved = [sa, ...state.saved];
  persist(); emit();
};

export const removeSavedAttribute = (id: string) => {
  state.saved = state.saved.filter((s) => s.id !== id);
  persist(); emit();
};

export const newId = uid;
