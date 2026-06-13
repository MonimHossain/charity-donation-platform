/** Shared campaign attribute payment config helpers (admin + public UI). */

export interface PresetAmount {
  amount: number;
  description?: string;
}

export type RecurrenceIntervalUnit = "day" | "week" | "month" | "year";

export interface RecurrenceConfig {
  intervalCount: number;
  intervalUnit: RecurrenceIntervalUnit;
  durationType: "never_ends" | "end_date";
  endDate?: string;
}

export interface SinglePaymentConfig {
  priceType: "preset" | "custom" | "both";
  presetAmounts: PresetAmount[];
  minAmount: number;
  maxAmount: number;
}

export interface RegularPaymentConfig {
  priceType: "preset" | "custom" | "both";
  presetAmounts: PresetAmount[];
  minAmount: number;
  maxAmount: number;
  recurrence: RecurrenceConfig;
}

export const DEFAULT_RECURRENCE: RecurrenceConfig = {
  intervalCount: 28,
  intervalUnit: "day",
  durationType: "never_ends",
};

export const DEFAULT_SINGLE_PAYMENT_CONFIG: SinglePaymentConfig = {
  priceType: "both",
  presetAmounts: [
    { amount: 10 },
    { amount: 25 },
    { amount: 50 },
    { amount: 100 },
  ],
  minAmount: 1,
  maxAmount: 10000,
};

export const DEFAULT_REGULAR_PAYMENT_CONFIG: RegularPaymentConfig = {
  priceType: "both",
  presetAmounts: [
    { amount: 10 },
    { amount: 25 },
    { amount: 50 },
    { amount: 100 },
  ],
  minAmount: 5,
  maxAmount: 5000,
  recurrence: { ...DEFAULT_RECURRENCE },
};

/** Normalize legacy preset arrays (plain numbers or old regular preset shape). */
export function normalizePresetAmounts(raw: unknown): PresetAmount[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "number") {
      return { amount: item };
    }
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const amount = Number(obj.amount ?? 0);
      const description =
        typeof obj.description === "string"
          ? obj.description
          : typeof obj.cause === "string"
            ? obj.cause
            : undefined;
      return { amount, ...(description ? { description } : {}) };
    }
    return { amount: 0 };
  });
}

export function normalizeRecurrence(raw: unknown): RecurrenceConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_RECURRENCE };
  const obj = raw as Record<string, unknown>;
  const intervalCount = Math.max(1, Number(obj.intervalCount ?? 1));
  const unit = obj.intervalUnit;
  const intervalUnit: RecurrenceIntervalUnit =
    unit === "day" || unit === "week" || unit === "month" || unit === "year" ? unit : "month";
  const durationType = obj.durationType === "end_date" ? "end_date" : "never_ends";
  const endDate = typeof obj.endDate === "string" ? obj.endDate : undefined;
  return {
    intervalCount,
    intervalUnit,
    durationType,
    ...(durationType === "end_date" && endDate ? { endDate } : {}),
  };
}

/** Migrate legacy regular payment config (allowedIntervals, customMin/Max, etc.). */
export function normalizeRegularPaymentConfig(raw: unknown): RegularPaymentConfig {
  const base = { ...DEFAULT_REGULAR_PAYMENT_CONFIG };
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;

  const presetAmounts = normalizePresetAmounts(obj.presetAmounts);
  const priceType =
    obj.priceType === "preset" || obj.priceType === "custom" || obj.priceType === "both"
      ? obj.priceType
      : obj.allowCustomAmount === false
        ? "preset"
        : presetAmounts.length > 0
          ? "both"
          : "custom";

  let recurrence = normalizeRecurrence(obj.recurrence);
  if (!obj.recurrence && Array.isArray(obj.allowedIntervals) && obj.allowedIntervals.length > 0) {
    const first = String(obj.allowedIntervals[0]);
    if (first === "daily") recurrence = { intervalCount: 1, intervalUnit: "day", durationType: "never_ends" };
    else if (first === "weekly") recurrence = { intervalCount: 1, intervalUnit: "week", durationType: "never_ends" };
    else if (first === "yearly" || first === "annually")
      recurrence = { intervalCount: 1, intervalUnit: "year", durationType: "never_ends" };
    else recurrence = { intervalCount: 1, intervalUnit: "month", durationType: "never_ends" };
  }

  if (obj.durationType === "fixed_duration" && typeof obj.endDate === "string") {
    recurrence = { ...recurrence, durationType: "end_date", endDate: obj.endDate };
  }

  return {
    priceType,
    presetAmounts: presetAmounts.length ? presetAmounts : base.presetAmounts,
    minAmount: Number(obj.minAmount ?? obj.customMinAmount ?? base.minAmount),
    maxAmount: Number(obj.maxAmount ?? obj.customMaxAmount ?? base.maxAmount),
    recurrence,
  };
}

export function normalizeSinglePaymentConfig(raw: unknown): SinglePaymentConfig {
  const base = { ...DEFAULT_SINGLE_PAYMENT_CONFIG };
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  const presetAmounts = normalizePresetAmounts(obj.presetAmounts);
  const priceType =
    obj.priceType === "preset" || obj.priceType === "custom" || obj.priceType === "both"
      ? obj.priceType
      : base.priceType;

  return {
    priceType,
    presetAmounts: presetAmounts.length ? presetAmounts : base.presetAmounts,
    minAmount: Number(obj.minAmount ?? base.minAmount),
    maxAmount: Number(obj.maxAmount ?? base.maxAmount),
  };
}

const UNIT_LABELS: Record<RecurrenceIntervalUnit, { one: string; many: string }> = {
  day: { one: "day", many: "days" },
  week: { one: "week", many: "weeks" },
  month: { one: "month", many: "months" },
  year: { one: "year", many: "years" },
};

export function formatRecurrenceLabel(recurrence: RecurrenceConfig): string {
  const labels = UNIT_LABELS[recurrence.intervalUnit];
  const unit = recurrence.intervalCount === 1 ? labels.one : labels.many;
  if (recurrence.intervalCount === 1) {
    return `Every ${unit}`;
  }
  return `Every ${recurrence.intervalCount} ${unit}`;
}

export type DonorScheduleChoice =
  | { mode: "admin" }
  | { mode: "preset"; frequency: "daily" | "weekly" | "monthly" | "yearly" }
  | { mode: "custom"; intervalCount: number; intervalUnit: RecurrenceIntervalUnit };

export function scheduleToStripeParams(schedule: DonorScheduleChoice, adminRecurrence: RecurrenceConfig) {
  if (schedule.mode === "admin") {
    return {
      interval: adminRecurrence.intervalUnit,
      intervalCount: adminRecurrence.intervalCount,
      cancelAt: adminRecurrence.durationType === "end_date" && adminRecurrence.endDate
        ? Math.floor(new Date(adminRecurrence.endDate).getTime() / 1000)
        : undefined,
    };
  }

  if (schedule.mode === "preset") {
    const map: Record<string, { interval: RecurrenceIntervalUnit; intervalCount: number }> = {
      daily: { interval: "day", intervalCount: 1 },
      weekly: { interval: "week", intervalCount: 1 },
      monthly: { interval: "month", intervalCount: 1 },
      yearly: { interval: "year", intervalCount: 1 },
    };
    const m = map[schedule.frequency] ?? { interval: "month" as const, intervalCount: 1 };
    return { interval: m.interval, intervalCount: m.intervalCount, cancelAt: undefined };
  }

  return {
    interval: schedule.intervalUnit,
    intervalCount: schedule.intervalCount,
    cancelAt: undefined,
  };
}

export function scheduleToFrequencyParam(
  schedule: DonorScheduleChoice,
  adminRecurrence: RecurrenceConfig = DEFAULT_RECURRENCE
): string {
  if (schedule.mode === "preset") return schedule.frequency;
  if (schedule.mode === "custom") {
    return `custom:${schedule.intervalCount}:${schedule.intervalUnit}`;
  }
  const r = scheduleToStripeParams(schedule, adminRecurrence);
  if (r.intervalCount === 1) {
    if (r.interval === "day") return "daily";
    if (r.interval === "week") return "weekly";
    if (r.interval === "year") return "yearly";
    return "monthly";
  }
  return `custom:${r.intervalCount}:${r.interval}`;
}

export function parseFrequencyParam(freq: string | null | undefined): DonorScheduleChoice | null {
  if (!freq) return null;
  if (freq === "daily" || freq === "weekly" || freq === "monthly" || freq === "yearly") {
    return { mode: "preset", frequency: freq };
  }
  if (freq === "admin") return { mode: "admin" };
  const customMatch = /^custom:(\d+):(day|week|month|year)$/.exec(freq);
  if (customMatch) {
    return {
      mode: "custom",
      intervalCount: Number(customMatch[1]),
      intervalUnit: customMatch[2] as RecurrenceIntervalUnit,
    };
  }
  return null;
}
