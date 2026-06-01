import type { DemoDonation, DonationStatus } from "./types";
import { daysAgo } from "./format";

export const demoDonations: DemoDonation[] = [
  { id: "d1", donorName: "Aisha Khan", donorEmail: "aisha@example.com", campaignId: "c-gaza", campaignTitle: "Gaza Famine Emergency", campaignSlug: "gaza", amount: 100, currency: "GBP", frequency: "single", status: "succeeded", date: daysAgo(1), isGuest: false, message: "May Allah accept." },
  { id: "d2", donorName: "Demo User", donorEmail: "user@example.com", campaignId: "c-orphans", campaignTitle: "Orphan Sponsorship", campaignSlug: "orphans", amount: 30, currency: "GBP", frequency: "monthly", status: "succeeded", date: daysAgo(3), isGuest: false },
  { id: "d3", donorName: "Demo User", donorEmail: "user@example.com", campaignId: "c-water", campaignTitle: "Build a Water Well", campaignSlug: "water", amount: 250, currency: "GBP", frequency: "single", status: "succeeded", date: daysAgo(7), isGuest: false },
  { id: "d4", donorName: "Yusuf Rahman", donorEmail: "yusuf@example.com", campaignId: "c-food", campaignTitle: "Food Aid Programme", campaignSlug: "food", amount: 50, currency: "GBP", frequency: "single", status: "pending", date: daysAgo(2), isGuest: true },
  { id: "d5", donorName: "Demo User", donorEmail: "user@example.com", campaignId: "c-emergency", campaignTitle: "Emergency Aid", campaignSlug: "emergency", amount: 75, currency: "GBP", frequency: "single", status: "failed", date: daysAgo(10), isGuest: false },
  { id: "d6", donorName: "Maryam Ali", donorEmail: "maryam@example.com", campaignId: "c-gaza", campaignTitle: "Gaza Famine Emergency", campaignSlug: "gaza", amount: 500, currency: "GBP", frequency: "single", status: "succeeded", date: daysAgo(4), isGuest: false },
  { id: "d7", donorName: "Demo User", donorEmail: "user@example.com", campaignId: "c-gaza", campaignTitle: "Gaza Famine Emergency", campaignSlug: "gaza", amount: 50, currency: "GBP", frequency: "single", status: "succeeded", date: daysAgo(14), isGuest: false },
  { id: "d8", donorName: "Demo User", donorEmail: "user@example.com", campaignId: "c-livelihood", campaignTitle: "Livelihood Projects", campaignSlug: "livelihood", amount: 120, currency: "GBP", frequency: "single", status: "succeeded", date: daysAgo(21), isGuest: false },
  { id: "d9", donorName: "Ibrahim Sayed", donorEmail: "ibrahim@example.com", campaignId: "c-water", campaignTitle: "Build a Water Well", campaignSlug: "water", amount: 250, currency: "GBP", frequency: "single", status: "succeeded", date: daysAgo(5), isGuest: false },
  { id: "d10", donorName: "Layla Hussein", donorEmail: "layla@example.com", campaignId: "c-orphans", campaignTitle: "Orphan Sponsorship", campaignSlug: "orphans", amount: 30, currency: "GBP", frequency: "monthly", status: "succeeded", date: daysAgo(8), isGuest: false },
  { id: "d11", donorName: "Anonymous", donorEmail: "anon@example.com", campaignId: "c-emergency", campaignTitle: "Emergency Aid", campaignSlug: "emergency", amount: 200, currency: "GBP", frequency: "single", status: "succeeded", date: daysAgo(2), isGuest: true },
  { id: "d12", donorName: "Sara Mahmoud", donorEmail: "sara@example.com", campaignId: "c-food", campaignTitle: "Food Aid Programme", campaignSlug: "food", amount: 80, currency: "GBP", frequency: "monthly", status: "pending", date: daysAgo(1), isGuest: false },
];

export const getRecentDonationsForCampaign = (campaignId: string, limit = 5) =>
  demoDonations
    .filter((d) => d.campaignId === campaignId)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, limit);

export const getDonationsForUser = (email: string) =>
  demoDonations
    .filter((d) => d.donorEmail === email)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

export const getRecentDonations = (limit = 10) =>
  [...demoDonations]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, limit);

const buildHistory = (count: number, amount: number, freqDays: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `ph-${i}`,
    date: daysAgo((count - i) * freqDays),
    amount,
    status: "succeeded" as DonationStatus,
  }));

export { buildHistory };
