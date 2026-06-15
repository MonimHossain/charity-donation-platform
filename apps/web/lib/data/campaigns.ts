"use client";

import { useQuery } from "@tanstack/react-query";
import { USE_MOCK_DATA } from "@/lib/config";
import { demoCampaigns, getCampaignBySlug as mockGetBySlug } from "@/lib/mock";
import { fetchCampaigns, fetchCampaignBySlug } from "@/lib/api";
import { queryKeys } from "./query-keys";
import { isCampaignExpired } from "@/lib/campaign-expiration";

function isFundraiserCampaign(c: Record<string, unknown>) {
  return String(c.campaignMode ?? "") === "fundraiser";
}

function excludeFundraisers(items: unknown[]) {
  return items.filter(
    (c) => !isFundraiserCampaign(c as Record<string, unknown>)
  );
}

function isAppealCandidate(c: Record<string, unknown>) {
  return (
    Boolean(c.slug) &&
    !isFundraiserCampaign(c) &&
    !isCampaignExpired(
      Boolean(c.expirationEnabled),
      c.expiresAt as string | null | undefined
    )
  );
}

function visibilitySettings(c: Record<string, unknown>) {
  return c.visibilitySettings as
    | {
        showInHeader?: boolean;
        showOnHomepage?: boolean;
        pinToTop?: boolean;
        headerDisplayName?: string;
      }
    | undefined;
}

/** Header nav label — custom display name when set, otherwise campaign title. */
export function headerNavLabel(c: Record<string, unknown>) {
  const custom = visibilitySettings(c)?.headerDisplayName?.trim();
  if (custom) return custom;
  return String(c.title ?? "");
}

/** Homepage sections only show campaigns with Show on Homepage enabled. */
export function isHomepageVisible(c: Record<string, unknown>) {
  return visibilitySettings(c)?.showOnHomepage === true;
}

/** Header nav shows campaigns with Show in Header Navigation enabled. */
export function isHeaderNavVisible(c: Record<string, unknown>) {
  return visibilitySettings(c)?.showInHeader === true;
}

function isPublished(c: Record<string, unknown>) {
  return String(c.status ?? "") === "published";
}

function compareAppeals(a: Record<string, unknown>, b: Record<string, unknown>) {
  const aPinned = (a.visibilitySettings as { pinToTop?: boolean } | undefined)?.pinToTop ? 1 : 0;
  const bPinned = (b.visibilitySettings as { pinToTop?: boolean } | undefined)?.pinToTop ? 1 : 0;
  if (aPinned !== bPinned) return bPinned - aPinned;

  const aOrder = Number(a.sortOrder ?? 0);
  const bOrder = Number(b.sortOrder ?? 0);
  if (aOrder !== bOrder) return aOrder - bOrder;

  const aCreated = new Date(String(a.createdAt ?? 0)).getTime();
  const bCreated = new Date(String(b.createdAt ?? 0)).getTime();
  return bCreated - aCreated;
}

function pickHomepageAppeals(items: unknown[]) {
  return excludeFundraisers(items)
    .filter((c) => {
      const row = c as Record<string, unknown>;
      return isAppealCandidate(row) && isHomepageVisible(row);
    })
    .sort((a, b) => compareAppeals(a as Record<string, unknown>, b as Record<string, unknown>));
}

function pickHeaderNavCampaigns(items: unknown[]) {
  return items
    .filter((c) => {
      const row = c as Record<string, unknown>;
      return (
        isPublished(row) &&
        Boolean(row.slug) &&
        !isCampaignExpired(
          Boolean(row.expirationEnabled),
          row.expiresAt as string | null | undefined
        ) &&
        isHeaderNavVisible(row)
      );
    })
    .sort((a, b) => compareAppeals(a as Record<string, unknown>, b as Record<string, unknown>));
}

async function fetchAllPublishedCampaigns() {
  const pageSize = 50;
  let page = 1;
  let allItems: unknown[] = [];
  let total = 0;

  while (true) {
    const res = await fetchCampaigns({ limit: String(pageSize), page: String(page) });
    const items = res.items ?? [];
    total = res.total ?? items.length;
    allItems = allItems.concat(items);
    if (allItems.length >= total || items.length === 0) break;
    page += 1;
  }

  return allItems;
}

export function useCampaignsList(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.campaigns(params),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { items: demoCampaigns, total: demoCampaigns.length };
      }
      const res = await fetchCampaigns(params);
      return { items: res.items ?? res.data ?? res, total: res.total ?? 0 };
    },
  });
}

/** All published non-fundraiser campaigns for the homepage Our Appeals section. */
export function useHomepageAppeals() {
  return useQuery({
    queryKey: queryKeys.homepageAppeals,
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        const items = pickHomepageAppeals(demoCampaigns);
        return { items, total: items.length };
      }
      const allItems = await fetchAllPublishedCampaigns();
      const items = pickHomepageAppeals(allItems);
      return { items, total: items.length };
    },
  });
}

/** Published fundraiser campaigns for the homepage Live Fundraisers section. */
export function useHomepageFundraisers() {
  return useQuery({
    queryKey: queryKeys.homepageFundraisers,
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { items: [], total: 0 };
      }
      const res = await fetchCampaigns({ mode: "fundraiser", limit: "12" });
      const items = (res.items ?? []).filter(
        (c: Record<string, unknown>) =>
          isFundraiserCampaign(c) &&
          isHomepageVisible(c) &&
          !isCampaignExpired(
            Boolean(c.expirationEnabled),
            c.expiresAt as string | null | undefined
          )
      );
      return { items, total: items.length };
    },
  });
}

/** Published campaigns flagged for the site header navigation. */
export function useHeaderNavCampaigns() {
  return useQuery({
    queryKey: queryKeys.headerNavCampaigns,
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { items: [], total: 0 };
      }
      const allItems = await fetchAllPublishedCampaigns();
      const items = pickHeaderNavCampaigns(allItems);
      return { items, total: items.length };
    },
  });
}

export function useCampaignBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.campaign(slug),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        const found = mockGetBySlug(slug);
        if (!found) throw new Error("Not found");
        return found;
      }
      return fetchCampaignBySlug(slug);
    },
    enabled: Boolean(slug),
  });
}
