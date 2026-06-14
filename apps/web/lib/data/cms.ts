"use client";

import { useQuery } from "@tanstack/react-query";
import { USE_MOCK_DATA } from "@/lib/config";
import {
  heroSlides as mockHeroSlides,
  testimonials as mockTestimonials,
  faqItems as mockFaqs,
  impactStats as mockImpactStats,
} from "@/lib/mock/home";
import {
  fetchHeroSlides,
  fetchHomepageSections,
  fetchTestimonials,
  fetchFaqs,
  fetchSiteSettings,
  fetchPublicStats,
} from "@/lib/api";
import { queryKeys } from "./query-keys";

export function useHeroSlides() {
  return useQuery({
    queryKey: queryKeys.heroSlides,
    queryFn: async () => {
      if (USE_MOCK_DATA) return mockHeroSlides;
      const slides = await fetchHeroSlides();
      return Array.isArray(slides) ? slides : slides?.items ?? [];
    },
  });
}

export function useHomepageSections() {
  return useQuery({
    queryKey: queryKeys.homepageSections,
    queryFn: async () => {
      if (USE_MOCK_DATA) return [];
      return fetchHomepageSections();
    },
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: queryKeys.testimonials,
    queryFn: async () => {
      if (USE_MOCK_DATA) return mockTestimonials;
      const data = await fetchTestimonials();
      return Array.isArray(data) ? data : data?.items ?? [];
    },
  });
}

export function useFaqs(category?: string) {
  return useQuery({
    queryKey: queryKeys.faqs(category),
    queryFn: async () => {
      if (USE_MOCK_DATA) return mockFaqs;
      const data = await fetchFaqs(category);
      return Array.isArray(data) ? data : data?.items ?? [];
    },
  });
}

export function useSiteSettings() {
  return useQuery({
    queryKey: queryKeys.siteSettings,
    queryFn: async () => {
      if (USE_MOCK_DATA) return null;
      return fetchSiteSettings();
    },
  });
}

export function useImpactStats() {
  return useQuery({
    queryKey: ["cms", "impact-stats"],
    queryFn: async () => {
      if (USE_MOCK_DATA) return mockImpactStats;
      try {
        const stats = await fetchPublicStats();
        const items = stats?.impactStats;
        if (Array.isArray(items) && items.length > 0) return items;
      } catch {
        /* fall through */
      }
      return [];
    },
  });
}
