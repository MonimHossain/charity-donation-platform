export const queryKeys = {
  campaigns: (params?: Record<string, string>) => ["campaigns", params] as const,
  campaign: (slug: string) => ["campaign", slug] as const,
  heroSlides: ["cms", "hero-slides"] as const,
  homepageSections: ["cms", "homepage-sections"] as const,
  testimonials: ["cms", "testimonials"] as const,
  faqs: (category?: string) => ["cms", "faqs", category] as const,
  siteSettings: ["cms", "settings"] as const,
  blogPosts: (params?: Record<string, string>) => ["blog", params] as const,
  blogPost: (slug: string) => ["blog", slug] as const,
  charities: (params?: Record<string, string>) => ["charities", params] as const,
  donationPages: ["donation-pages"] as const,
};
