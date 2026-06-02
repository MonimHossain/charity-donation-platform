import type { DonationExperienceRamadanSplit, RecurringDonationPlan, RecurringInstallment } from "@icac/shared-types";

export const RAMADAN_MAX_NIGHTS = 30;

export function clampWeight(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

export function parseWeightInput(raw: string): number {
  return clampWeight(Number(raw));
}

export function getRamadanAdminConfig(exp: DonationExperienceRamadanSplit) {
  const ramadanStartDate =
    exp.ramadanStartDate ??
    exp.startChoices?.[0]?.date ??
    new Date().toISOString().slice(0, 10);
  const maxNights = Math.min(
    RAMADAN_MAX_NIGHTS,
    Math.max(1, Number(exp.maxNights ?? RAMADAN_MAX_NIGHTS))
  );
  return { ramadanStartDate, maxNights };
}

export function buildRamadanCalendarDates(startDate: string, maxNights: number): string[] {
  const dates: string[] = [];
  const start = new Date(`${startDate}T12:00:00`);
  if (Number.isNaN(start.getTime())) return dates;
  for (let i = 0; i < maxNights; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function normalizeBreakdown(total: number, weights: number[]): number[] {
  const clean = weights.map((w) => clampWeight(w));
  const sum = clean.reduce((s, w) => s + w, 0);
  const denom = sum > 0 ? sum : 1;
  const raw = clean.map((w) => (total * w) / denom);
  const rounded = raw.map((x) => Math.round(x * 100) / 100);
  const roundedSum = rounded.reduce((s, x) => s + x, 0);
  const diff = Math.round((total - roundedSum) * 100) / 100;
  if (rounded.length) {
    rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1] + diff) * 100) / 100;
  }
  return rounded;
}

export function formatRamadanDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export type RamadanNightPreview = {
  date: string;
  weight: number;
  amount: number;
};

export function buildRamadanNightPreview(
  selectedDates: string[],
  weights: number[],
  total: number
): RamadanNightPreview[] {
  const amounts = normalizeBreakdown(total, weights);
  return selectedDates.map((date, i) => ({
    date,
    weight: clampWeight(weights[i] ?? 1),
    amount: amounts[i] ?? 0,
  }));
}

export function buildRecurringDonationPlan(input: {
  donationPageId: string;
  donationPageSlug: string;
  campaignId?: string;
  currency: string;
  totalAmount: number;
  nights: RamadanNightPreview[];
}): RecurringDonationPlan {
  const installments: RecurringInstallment[] = input.nights.map((n) => ({
    id: `inst-${n.date}`,
    scheduledDate: n.date,
    amount: n.amount,
    currency: input.currency,
    weight: n.weight,
    status: "pending" as const,
  }));

  return {
    id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: "ramadan_split",
    donationPageId: input.donationPageId,
    donationPageSlug: input.donationPageSlug,
    campaignId: input.campaignId,
    totalAmount: input.totalAmount,
    currency: input.currency,
    installments,
    status: "awaiting_payment_method",
  };
}
