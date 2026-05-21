import type { BannerType, HomepageSectionType, PageBlockType } from "./enums";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface StickyDonationBarConfig {
  isEnabled: boolean;
  position: "top" | "bottom";
  presets: Array<{
    amount: number;
    label: string;
    description: string;
  }>;
  currencyOptions: string[];
}

export interface HomepageSection {
  id: string;
  type: HomepageSectionType;
  title: string;
  isEnabled: boolean;
  sortOrder: number;
  config: Record<string, unknown>;
  layout: "default" | "grid" | "carousel" | "masonry";
  customHtml?: string;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logoUrl?: string;
  faviconUrl?: string;
  charityRegNumber: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
    tiktok?: string;
  };
  donationPolicy: string;
  trustBadges: Array<{
    label: string;
    icon?: string;
  }>;
  footerContent?: {
    aboutText?: string;
    copyrightText?: string;
    columns?: Array<{
      title: string;
      links: Array<{ label: string; url: string }>;
    }>;
  };
  gtmId?: string;
  analyticsId?: string;
  paymentConfig?: {
    enabledProviders?: string[];
    stripePublicKey?: string;
    paypalClientId?: string;
    paytabsClientKey?: string;
    defaultCurrency?: string;
    minimumDonation?: number;
  };
}

export interface BlogPostDto {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  author: string;
  tags: string[];
  categoryId?: string;
  categoryName?: string;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface NavigationMenuItem {
  id: string;
  label: string;
  url: string;
  location: "header" | "footer" | "mobile";
  parentId?: string;
  sortOrder: number;
  isVisible: boolean;
  target?: string;
  icon?: string;
  children?: NavigationMenuItem[];
}

export interface BannerDto {
  id: string;
  title: string;
  content: string;
  type: BannerType;
  position: "top" | "bottom" | "modal" | "slide_in";
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  ctaText?: string;
  ctaUrl?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  sortOrder: number;
  showOnPages: string[];
  dismissible: boolean;
}

export interface FaqDto {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface SeoSettingsDto {
  id: string;
  pagePath: string;
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex: boolean;
  keywords: string[];
}

export interface PageBlockDto {
  id: string;
  pageType: string;
  pageId?: string;
  blockType: PageBlockType;
  content: Record<string, unknown>;
  sortOrder: number;
  isVisible: boolean;
  settings?: Record<string, unknown>;
}

export interface MediaItemDto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  folder: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface TranslationDto {
  id: string;
  entityType: string;
  entityId: string;
  language: string;
  field: string;
  value: string;
}
