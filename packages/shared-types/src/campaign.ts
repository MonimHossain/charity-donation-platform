import type { CampaignCategory, CampaignStatus, CampaignTag, Currency } from "./enums";

export interface CampaignDto {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: CampaignCategory;
  tags: CampaignTag[];
  status: CampaignStatus;
  goalAmount: number;
  raisedAmount: number;
  currency: Currency;
  featuredImage?: string;
  galleryImages: string[];
  videoUrl?: string;
  startDate: string;
  endDate?: string;
  isFeatured: boolean;
  isEmergency: boolean;
  isUrgent: boolean;
  donorCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignDto {
  title: string;
  shortDescription: string;
  description: string;
  category: CampaignCategory;
  tags?: CampaignTag[];
  goalAmount: number;
  currency: Currency;
  featuredImage?: string;
  galleryImages?: string[];
  videoUrl?: string;
  startDate: string;
  endDate?: string;
  isFeatured?: boolean;
  isEmergency?: boolean;
  isUrgent?: boolean;
  sortOrder?: number;
}
