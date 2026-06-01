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
