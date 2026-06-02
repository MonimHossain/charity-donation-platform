"use client";

import { useSyncExternalStore } from "react";
import type { RecurringDonationPlan } from "@icac/shared-types";

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
  fidya?: {
    optionKey: string;
    optionLabel: string;
  };
  ramadan?: {
    ramadanStartDate: string;
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
  const items = useSyncExternalStore(subscribeDonationCart, getDonationCartSnapshot, () => []);
  const currency = items[0]?.currency ?? "GBP";
  const subtotal = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  return {
    items,
    subtotal,
    currency,
    addItem: addDonationCartItem,
    removeItem: removeDonationCartItem,
    clear: clearDonationCart,
  };
}
