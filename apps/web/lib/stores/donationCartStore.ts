"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  convertAmount,
  getCurrencyCode,
  normalizeCurrencyCode,
  subscribeDisplayCurrency,
} from "@/lib/currency";
import type { RecurringDonationPlan } from "@icac/shared-types";
import type { CheckoutSettings } from "@/components/campaigns/campaign-detail-types";
import type { CampaignUpsell } from "@/lib/checkout-campaign-config";
import {
  getRamadanInstallmentsFromLine,
  isRamadanSplitCartLine,
  summarizeRamadanCheckout,
} from "@/lib/ramadan-split";

const STORAGE_KEY = "icac_donation_cart_v1";

export type DonationCartLineKind = "standard" | "fidya_kaffarah" | "ramadan_split";

export type DonationCartItem = {
  id: string;
  kind: DonationCartLineKind;
  donationPageId: string;
  donationPageSlug: string;
  title: string;
  category?: string;
  amount: number;
  currency: string;
  quantity?: number;
  unitPrice?: number;
  description: string;
  campaignId?: string;
  donationType?: string;
  /** Recurring checkout frequency (e.g. monthly, custom:28:day). */
  recurringFrequency?: string;
  /** Explicit Stripe interval captured when the item was added. */
  recurringInterval?: "day" | "week" | "month" | "year";
  recurringIntervalCount?: number;
  /** Stripe cancel_at unix timestamp when admin set subscription end date. */
  recurringCancelAt?: number;
  /** Upsell catalog IDs already chosen on the campaign/donation page. */
  selectedUpsellIds?: string[];
  /** Snapshot of campaign checkout toggles when the item was added. */
  checkoutSettings?: CheckoutSettings;
  /** Snapshot of active campaign upsells when the item was added. */
  checkoutUpsells?: CampaignUpsell[];
  fidya?: {
    optionKey: string;
    optionLabel: string;
  };
  ramadan?: {
    ramadanStartDate: string;
    regionId?: string;
    regionLabel?: string;
    selectedDates: string[];
    weights: number[];
    dailyBreakdown: number[];
    nights: number;
    campaignId?: string;
    notes?: string;
    /** Ready for payment-provider recurring charges */
    recurringPlan?: RecurringDonationPlan;
    /** @deprecated */
    startDate?: string;
  };
};

type CartSnapshot = DonationCartItem[];

const SERVER_CART_SNAPSHOT: CartSnapshot = [];

let snapshot: CartSnapshot = [];
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function loadFromStorage(): CartSnapshot {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartSnapshot;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(next: CartSnapshot) {
  snapshot = next;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  }
  emit();
}

function ensureLoaded() {
  if (typeof window !== "undefined" && snapshot.length === 0) {
    const stored = loadFromStorage();
    if (stored.length) snapshot = stored;
  }
}

export function getDonationCartSnapshot(): CartSnapshot {
  ensureLoaded();
  return snapshot;
}

export function subscribeDonationCart(listener: () => void): () => void {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addDonationCartItem(
  item: Omit<DonationCartItem, "id">
): DonationCartItem {
  ensureLoaded();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry: DonationCartItem = { ...item, id };
  persist([...snapshot, entry]);
  return entry;
}

export function removeDonationCartItem(id: string) {
  ensureLoaded();
  persist(snapshot.filter((i) => i.id !== id));
}

export function clearDonationCart() {
  persist([]);
}

export function getDonationCartTotal(currency = "GBP"): number {
  ensureLoaded();
  return snapshot
    .filter((i) => (i.currency || "GBP").toUpperCase() === currency.toUpperCase())
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
}

export function useDonationCart() {
  const items = useSyncExternalStore(
    subscribeDonationCart,
    getDonationCartSnapshot,
    () => SERVER_CART_SNAPSHOT
  );
  const displayCode = useSyncExternalStore(
    subscribeDisplayCurrency,
    getCurrencyCode,
    () => "GBP"
  );
  const subtotal = useMemo(
    () =>
      items.reduce(
        (s, i) =>
          s +
          convertAmount(
            Number(i.amount || 0),
            normalizeCurrencyCode(i.currency),
            displayCode
          ),
        0
      ),
    [items, displayCode]
  );
  const basketDisplayTotal = useMemo(() => {
    const ramadan = summarizeRamadanCheckout(items);
    if (!ramadan.hasRamadanSplit) return subtotal;
    const nonRamadan = items
      .filter((i) => !isRamadanSplitCartLine(i))
      .reduce(
        (s, i) =>
          s +
          convertAmount(Number(i.amount || 0), normalizeCurrencyCode(i.currency), displayCode),
        0
      );
    const ramadanFirstNight = items
      .filter((i) => isRamadanSplitCartLine(i))
      .reduce((s, line) => {
        const installments = [...getRamadanInstallmentsFromLine(line)].sort((a, b) =>
          a.scheduledDate.localeCompare(b.scheduledDate)
        );
        const first = installments[0];
        if (!first) return s;
        return (
          s +
          convertAmount(Number(first.amount || 0), normalizeCurrencyCode(first.currency), displayCode)
        );
      }, 0);
    return nonRamadan + ramadanFirstNight;
  }, [items, subtotal, displayCode]);
  return {
    items,
    subtotal,
    basketDisplayTotal,
    currency: displayCode,
    addItem: addDonationCartItem,
    removeItem: removeDonationCartItem,
    clear: clearDonationCart,
  };
}
