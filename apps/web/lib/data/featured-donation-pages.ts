"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPublishedDonationPages } from "@/lib/api";

export function usePublishedDonationPages(limit = 50) {
  return useQuery({
    queryKey: ["publishedDonationPages", limit],
    queryFn: async () => {
      const res = await fetchPublishedDonationPages({ limit });
      return res.items ?? res.data ?? [];
    },
  });
}

