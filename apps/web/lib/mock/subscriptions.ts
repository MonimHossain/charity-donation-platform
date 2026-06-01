import type { DemoSubscription } from "./types";
import { daysAgo, inDays } from "./format";
import { buildHistory } from "./donations";

export const demoSubscriptions: DemoSubscription[] = [
  {
    id: "s1",
    userId: "u-user",
    userName: "Demo User",
    userEmail: "user@example.com",
    campaignId: "c-orphans",
    campaignTitle: "Orphan Sponsorship",
    campaignSlug: "orphans",
    amount: 30,
    currency: "GBP",
    frequency: "monthly",
    status: "active",
    startedAt: daysAgo(180),
    endsAt: inDays(180),
    cycles: 12,
    cyclesCompleted: 6,
    nextPaymentAt: inDays(12),
    history: buildHistory(6, 30, 30),
  },
  {
    id: "s2",
    userId: "u-layla",
    userName: "Layla Hussein",
    userEmail: "layla@example.com",
    campaignId: "c-orphans",
    campaignTitle: "Orphan Sponsorship",
    campaignSlug: "orphans",
    amount: 30,
    currency: "GBP",
    frequency: "monthly",
    status: "active",
    startedAt: daysAgo(90),
    cyclesCompleted: 3,
    nextPaymentAt: inDays(20),
    history: buildHistory(3, 30, 30),
  },
  {
    id: "s3",
    userId: "u-sara",
    userName: "Sara Mahmoud",
    userEmail: "sara@example.com",
    campaignId: "c-food",
    campaignTitle: "Food Aid Programme",
    campaignSlug: "food",
    amount: 80,
    currency: "GBP",
    frequency: "monthly",
    status: "paused",
    startedAt: daysAgo(120),
    cyclesCompleted: 4,
    nextPaymentAt: inDays(8),
    history: buildHistory(4, 80, 30),
  },
];

export const getSubscription = (id: string) =>
  demoSubscriptions.find((s) => s.id === id);

export const getSubscriptionsForUser = (email: string) =>
  demoSubscriptions.filter((s) => s.userEmail === email);
