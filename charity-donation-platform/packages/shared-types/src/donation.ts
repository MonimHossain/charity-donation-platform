import type { Currency, DedicationType, DonationFrequency, DonationStatus, PaymentProvider, RecurringStatus } from "./enums";

export interface DonationPreset {
  id: string;
  amount: number;
  currency: Currency;
  label: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateDonationDto {
  amount: number;
  currency: Currency;
  frequency: DonationFrequency;
  campaignId?: string;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  giftAid?: boolean;
  isAnonymous?: boolean;
  message?: string;
  donationType?: string;
  paymentMethod?: PaymentProvider;
  marketingConsent?: boolean;
  smsConsent?: boolean;
  dedication?: {
    type: DedicationType;
    recipientName: string;
    recipientEmail?: string;
    personalMessage?: string;
    sendNotification?: boolean;
  };
}

export interface DonationResponse {
  id: string;
  amount: number;
  currency: Currency;
  frequency: DonationFrequency;
  status: DonationStatus;
  campaignId?: string;
  campaignTitle?: string;
  donorName: string;
  donorEmail: string;
  giftAid: boolean;
  giftAidAmount: number;
  totalAmount: number;
  isAnonymous: boolean;
  message?: string;
  donationType?: string;
  paymentMethod?: PaymentProvider;
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringDonationDto {
  id: string;
  userId?: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: Currency;
  frequency: DonationFrequency;
  status: RecurringStatus;
  campaignId?: string;
  campaignTitle?: string;
  paymentMethod: PaymentProvider;
  giftAid: boolean;
  nextPaymentDate?: string;
  lastPaymentDate?: string;
  totalPayments: number;
  totalPaid: number;
  createdAt: string;
}

export interface DonationDedicationDto {
  type: DedicationType;
  recipientName: string;
  recipientEmail?: string;
  personalMessage?: string;
  sendNotification: boolean;
}

export interface ZakatCalculation {
  cashAndBank: number;
  goldValue: number;
  silverValue: number;
  shares: number;
  businessStock: number;
  investmentProperty: number;
  moneyOwed: number;
  debts: number;
  expensesDue: number;
  totalAssets: number;
  totalDeductions: number;
  netZakatableAssets: number;
  nisabThreshold: number;
  isZakatDue: boolean;
  zakatAmount: number;
}

export interface DonationAnalytics {
  totalDonations: number;
  totalRaised: number;
  monthlyDonors: number;
  averageDonation: number;
  conversionRate: number;
  giftAidTotal: number;
  revenueByDay: Array<{ date: string; amount: number }>;
  topCampaigns: Array<{ id: string; title: string; raised: number; donors: number }>;
  topDonors: Array<{ name: string; email: string; totalDonated: number; count: number }>;
}
