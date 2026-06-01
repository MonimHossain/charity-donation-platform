"use client";

import { useQuery } from "@tanstack/react-query";
import { USE_MOCK_DATA } from "@/lib/config";
import { demoCharities } from "@/lib/mock/charities";
import {
  fetchPublicCharities,
  fetchCharityBySlug,
  fetchPublicStats,
  verifyPublicCertificationById,
} from "@/lib/api";

export function usePublicCharities(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["charities", "list", params],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { data: demoCharities, meta: { page: 1, totalPages: 1, total: demoCharities.length } };
      }
      return fetchPublicCharities(params);
    },
  });
}

export function usePublicCharity(slug: string) {
  return useQuery({
    queryKey: ["charities", slug],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        const c = demoCharities.find((x) => x.slug === slug);
        if (!c) throw new Error("Not found");
        return c;
      }
      const res = await fetchCharityBySlug(slug);
      return res.data || res;
    },
    enabled: Boolean(slug),
  });
}

export function usePublicImpactStats() {
  return useQuery({
    queryKey: ["charities", "stats"],
    queryFn: async () => {
      if (USE_MOCK_DATA) return null;
      return fetchPublicStats();
    },
  });
}

export function useVerifyCertificate(certificateId: string) {
  return useQuery({
    queryKey: ["verify", certificateId],
    queryFn: async () => {
      const res = await verifyPublicCertificationById(certificateId);
      return res.data || res;
    },
    enabled: Boolean(certificateId) && !USE_MOCK_DATA,
  });
}
