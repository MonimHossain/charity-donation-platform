export type AutomationListItem = {
  id: string;
  automationType?: "recurring" | "installment_schedule";
  donorName?: string;
  donorEmail?: string;
  totalAmount: number;
  dailyAmount: number;
  paidAmount: number;
  completedDays: number;
  totalDays: number;
  startDate: string;
  endDate: string;
  status: string;
  currency: string;
  frequency?: string;
  campaign?: { title?: string };
  nextScheduledDate?: string | null;
  createdAt: string;
};

export function normalizeAutomationItems(data: unknown): AutomationListItem[] {
  if (Array.isArray(data)) return data as AutomationListItem[];
  if (data && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)) {
    return (data as { items: AutomationListItem[] }).items;
  }
  return [];
}

export function formatAutomationType(item: AutomationListItem): string {
  return item.automationType === "recurring" ? "Recurring" : "Scheduled plan";
}

export function formatNextChargeDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
