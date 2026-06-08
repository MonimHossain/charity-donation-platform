export type DonationStatus = "succeeded" | "pending" | "failed";
export type DonationFrequency = "single" | "monthly" | "weekly" | "daily";
export type SubscriptionStatus = "active" | "paused" | "cancelled";
export type BillingFrequency = "daily" | "weekly" | "monthly";

export interface DemoCampaign {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  image: string;
  tag: string;
  urgent?: boolean;
  featured?: boolean;
  goal: number;
  raised: number;
  currency: string;
  donors: number;
  deadline?: string;
  status: "published" | "draft" | "archived";
}

export interface DemoDonation {
  id: string;
  donorName: string;
  donorEmail: string;
  campaignId: string;
  campaignTitle: string;
  campaignSlug: string;
  amount: number;
  currency: string;
  frequency: DonationFrequency;
  status: DonationStatus;
  date: string;
  isGuest: boolean;
  message?: string;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "donor";
  joinedAt: string;
  totalGiven: number;
  donationCount: number;
}

export interface DemoBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body?: string;
  status: "published" | "draft";
  author: string;
  publishedAt: string;
  cover: string;
}

export interface DemoActivityLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  time: string;
  meta?: string;
}

export interface DemoSubscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  campaignId: string;
  campaignTitle: string;
  campaignSlug: string;
  amount: number;
  currency: string;
  frequency: BillingFrequency;
  status: SubscriptionStatus;
  startedAt: string;
  endsAt?: string;
  cycles?: number;
  cyclesCompleted: number;
  nextPaymentAt: string;
  history: { id: string; date: string; amount: number; status: DonationStatus }[];
}
