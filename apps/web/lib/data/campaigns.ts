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

/** Featured campaigns for the homepage Our Appeals section, with fallback to latest published. */
export function useHomepageAppeals() {
  return useQuery({
    queryKey: queryKeys.homepageAppeals,
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        const featured = demoCampaigns.filter((c) => c.featured);
        const pool = excludeFundraisers(featured.length > 0 ? featured : demoCampaigns);
        const items = pool.slice(0, 6);
        return { items, total: items.length, showingFeatured: featured.length > 0 };
      }
      const featuredRes = await fetchCampaigns({ featured: "true", limit: "12" });
      const featuredItems = excludeFundraisers(featuredRes.items ?? []).slice(0, 6);
      if (featuredItems.length > 0) {
        return { items: featuredItems, total: featuredItems.length, showingFeatured: true };
      }
      const fallbackRes = await fetchCampaigns({ limit: "12" });
      const items = excludeFundraisers(fallbackRes.items ?? []).slice(0, 6);
      return { items, total: items.length, showingFeatured: false };
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
          !isCampaignExpired(
            Boolean(c.expirationEnabled),
            c.expiresAt as string | null | undefined
          )
      );
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
