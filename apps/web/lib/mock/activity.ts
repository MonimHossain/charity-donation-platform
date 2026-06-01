import type { DemoActivityLog } from "./types";
import { daysAgo } from "./format";

export const demoActivityLogs: DemoActivityLog[] = [
  { id: "l1", actor: "Admin Demo", action: "campaign.publish", entity: "Gaza Famine Emergency", time: daysAgo(0), meta: "status: published" },
  { id: "l2", actor: "Editor Demo", action: "blog.create", entity: "Inside Gaza's Kitchens", time: daysAgo(1) },
  { id: "l3", actor: "Demo User", action: "donation.create", entity: "Gaza Famine Emergency", time: daysAgo(1), meta: "£100 single" },
  { id: "l4", actor: "Admin Demo", action: "user.role.update", entity: "user@example.com", time: daysAgo(2), meta: "role: donor" },
  { id: "l5", actor: "Editor Demo", action: "campaign.update", entity: "Build a Water Well", time: daysAgo(3) },
  { id: "l6", actor: "Admin Demo", action: "campaign.create", entity: "Livelihood Projects", time: daysAgo(7) },
];

export const demoMonthlyTotals = [
  { month: "May", amount: 18200 },
  { month: "Jun", amount: 22400 },
  { month: "Jul", amount: 19800 },
  { month: "Aug", amount: 28100 },
  { month: "Sep", amount: 31500 },
  { month: "Oct", amount: 27200 },
  { month: "Nov", amount: 35800 },
  { month: "Dec", amount: 42100 },
  { month: "Jan", amount: 38600 },
  { month: "Feb", amount: 45200 },
  { month: "Mar", amount: 51400 },
  { month: "Apr", amount: 58900 },
];

export const totalDonors = 9;
export const recurringCount = 2;
export const oneTimeCount = 8;
