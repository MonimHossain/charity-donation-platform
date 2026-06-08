"use client";

import { useQuery } from "@tanstack/react-query";
import { USE_MOCK_DATA } from "@/lib/config";
import { demoCampaigns, getCampaignBySlug as mockGetBySlug } from "@/lib/mock";
import { fetchCampaigns, fetchCampaignBySlug } from "@/lib/api";
import { queryKeys } from "./query-keys";

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
        const items = (featured.length > 0 ? featured : demoCampaigns).slice(0, 6);
        return { items, total: items.length, showingFeatured: featured.length > 0 };
      }
      const featuredRes = await fetchCampaigns({ featured: "true", limit: "6" });
      const featuredItems = featuredRes.items ?? [];
      if (featuredItems.length > 0) {
        return { items: featuredItems, total: featuredItems.length, showingFeatured: true };
      }
      const fallbackRes = await fetchCampaigns({ limit: "6" });
      const items = fallbackRes.items ?? [];
      return { items, total: fallbackRes.total ?? items.length, showingFeatured: false };
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
