import type { DemoUser } from "./types";
import { daysAgo } from "./format";

export const demoUsers: DemoUser[] = [
  { id: "u-admin", name: "Admin Demo", email: "admin@example.com", role: "admin", joinedAt: daysAgo(180), totalGiven: 0, donationCount: 0 },
  { id: "u-editor", name: "Editor Demo", email: "editor@example.com", role: "editor", joinedAt: daysAgo(120), totalGiven: 0, donationCount: 0 },
  { id: "u-user", name: "Demo User", email: "user@example.com", role: "donor", joinedAt: daysAgo(60), totalGiven: 530, donationCount: 6 },
  { id: "u-aisha", name: "Aisha Khan", email: "aisha@example.com", role: "donor", joinedAt: daysAgo(45), totalGiven: 100, donationCount: 1 },
  { id: "u-yusuf", name: "Yusuf Rahman", email: "yusuf@example.com", role: "donor", joinedAt: daysAgo(30), totalGiven: 50, donationCount: 1 },
  { id: "u-maryam", name: "Maryam Ali", email: "maryam@example.com", role: "donor", joinedAt: daysAgo(20), totalGiven: 500, donationCount: 1 },
];

export const DEMO_DONOR = demoUsers.find((u) => u.email === "user@example.com")!;
export const DEMO_ADMIN = demoUsers.find((u) => u.email === "admin@example.com")!;
