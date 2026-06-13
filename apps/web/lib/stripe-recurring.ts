export type DonationFrequencyOption =
  | "single"
  | "daily"
  | "monthly"
  | "quarterly"
  | "annually"
  | "yearly"
  | "weekly"
  | string;

export interface StripeRecurringParams {
  interval: "day" | "week" | "month" | "year";
  intervalCount: number;
  cancelAt?: number;
}

export function isRecurringFrequency(freq?: string): boolean {
  return Boolean(freq && freq !== "single");
}

/** Maps UI frequency labels to API / Stripe recurring frequency. */
export function normalizeRecurringFrequency(freq: string): string {
  if (freq === "annually") return "yearly";
  return freq;
}

/** Parse custom frequency strings like `custom:28:day`. */
export function parseStripeRecurringParams(
  frequency: string,
  overrides?: Partial<StripeRecurringParams>
): StripeRecurringParams {
  let base: StripeRecurringParams;

  if (overrides?.interval) {
    base = {
      interval: overrides.interval,
      intervalCount: Math.max(1, overrides.intervalCount ?? 1),
    };
  } else {
    const customMatch = /^custom:(\d+):(day|week|month|year)$/.exec(frequency);
    if (customMatch) {
      base = {
        interval: customMatch[2] as StripeRecurringParams["interval"],
        intervalCount: Number(customMatch[1]),
      };
    } else {
      const f = normalizeRecurringFrequency(frequency);
      if (f === "daily") base = { interval: "day", intervalCount: 1 };
      else if (f === "weekly") base = { interval: "week", intervalCount: 1 };
      else if (f === "yearly") base = { interval: "year", intervalCount: 1 };
      else if (f === "quarterly") base = { interval: "month", intervalCount: 3 };
      else base = { interval: "month", intervalCount: 1 };
    }
  }

  return {
    ...base,
    ...(overrides?.cancelAt ? { cancelAt: overrides.cancelAt } : {}),
  };
}

export function stripeRecurringToPriceRecurring(
  params: StripeRecurringParams
): { interval: "day" | "week" | "month" | "year"; interval_count?: number } {
  return {
    interval: params.interval,
    ...(params.intervalCount > 1 ? { interval_count: params.intervalCount } : {}),
  };
}

export function recurringIntervalLabel(freq: string, intervalCount?: number): string {
  const params = parseStripeRecurringParams(freq, {
    intervalCount: intervalCount ?? undefined,
  } as Partial<StripeRecurringParams>);

  if (params.interval === "day") {
    return params.intervalCount === 1 ? "day" : `${params.intervalCount} days`;
  }
  if (params.interval === "week") {
    return params.intervalCount === 1 ? "week" : `${params.intervalCount} weeks`;
  }
  if (params.interval === "year") {
    return params.intervalCount === 1 ? "year" : `${params.intervalCount} years`;
  }
  if (params.intervalCount === 3) return "quarter";
  return params.intervalCount === 1 ? "month" : `${params.intervalCount} months`;
}
