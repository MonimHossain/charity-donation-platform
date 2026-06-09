export type DonationFrequencyOption =
  | "single"
  | "monthly"
  | "quarterly"
  | "annually"
  | "yearly"
  | "weekly";

export function isRecurringFrequency(freq?: string): boolean {
  return Boolean(freq && freq !== "single");
}

/** Maps UI frequency labels to API / Stripe recurring frequency. */
export function normalizeRecurringFrequency(freq: string): string {
  if (freq === "annually") return "yearly";
  return freq;
}

export function recurringIntervalLabel(freq: string): string {
  const f = normalizeRecurringFrequency(freq);
  if (f === "weekly") return "week";
  if (f === "yearly") return "year";
  if (f === "quarterly") return "quarter";
  return "month";
}
