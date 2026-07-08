export type MarketingDailyEntry = {
  date: string;
  amount: number;
};

export type ExpenditureInputs = {
  employeeSalaryMonthly: number;
  infrastructureMonthly: number;
  operationsMonthly: number;
  miscellaneousMonthly: number;
  marketingDailyLog: MarketingDailyEntry[];
  trackingStartDate?: string | null;
};

export type ExpenditureLine = {
  id: string;
  label: string;
  hint?: string;
  weekly: number;
  monthly: number;
  yearly: number;
  tillDate: number;
};

export type ExpenditureSummary = {
  currency: string;
  asOf: string;
  trackingStartDate: string | null;
  trackingDays: number;
  periodLabels: {
    weekly: string;
    monthly: string;
    yearly: string;
  };
  marketingDaysLogged: {
    weekly: number;
    monthly: number;
    yearly: number;
    tillDate: number;
  };
  lines: ExpenditureLine[];
  totals: {
    weekly: number;
    monthly: number;
    yearly: number;
    tillDate: number;
  };
  currentMonth: {
    label: string;
    daysElapsed: number;
    daysInMonth: number;
    fixed: number;
    marketing: number;
    total: number;
  };
};

function toNumber(value: unknown): number {
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseDateOnly(iso?: string | null): Date | null {
  if (!iso?.trim()) return null;
  const d = new Date(`${iso.trim().slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return startOfDay(x);
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function mondayOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const dow = x.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDays(x, offset);
}

function sundayOfWeek(d: Date): Date {
  return addDays(mondayOfWeek(d), 6);
}

function startOfMonth(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
}

function endOfMonth(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

function startOfYear(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), 0, 1));
}

function clampEnd(start: Date, end: Date, asOf: Date): Date {
  const cap = startOfDay(asOf);
  return end.getTime() > cap.getTime() ? cap : end;
}

export function normalizeMarketingDailyLog(raw: unknown): MarketingDailyEntry[] {
  if (!Array.isArray(raw)) return [];
  const byDate = new Map<string, number>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const date = String(r.date ?? "").trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    byDate.set(date, toNumber(r.amount));
  }
  return [...byDate.entries()]
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function sumMarketingLog(
  log: MarketingDailyEntry[],
  start: Date,
  end: Date
): { total: number; days: number } {
  const endKey = toDateKey(end);
  const startKey = toDateKey(start);
  let total = 0;
  let days = 0;
  for (const entry of log) {
    if (entry.date < startKey || entry.date > endKey) continue;
    total += entry.amount;
    days += 1;
  }
  return { total, days };
}

/** Prorate a monthly budget across each calendar day in [start, end]. */
function prorateMonthlyOverRange(monthlyAmount: number, start: Date, end: Date): number {
  if (monthlyAmount <= 0) return 0;
  let total = 0;
  for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = addDays(cursor, 1)) {
    total += monthlyAmount / daysInMonth(cursor);
  }
  return total;
}

function diffCalendarDaysInclusive(start: Date, end: Date): number {
  if (end.getTime() < start.getTime()) return 0;
  return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86_400_000) + 1;
}

export function computeExpenditureSummary(
  raw: ExpenditureInputs,
  currency = "GBP",
  asOf = new Date()
): ExpenditureSummary {
  const employeeSalaryMonthly = toNumber(raw.employeeSalaryMonthly);
  const infrastructureMonthly = toNumber(raw.infrastructureMonthly);
  const operationsMonthly = toNumber(raw.operationsMonthly);
  const miscellaneousMonthly = toNumber(raw.miscellaneousMonthly);
  const log = normalizeMarketingDailyLog(raw.marketingDailyLog);

  const monthlyFixed =
    employeeSalaryMonthly +
    infrastructureMonthly +
    operationsMonthly +
    miscellaneousMonthly;

  const today = startOfDay(asOf);
  const trackingStart = parseDateOnly(raw.trackingStartDate);

  const weekStart = mondayOfWeek(today);
  const weekEnd = clampEnd(weekStart, sundayOfWeek(today), today);
  const monthStart = startOfMonth(today);
  const monthEnd = clampEnd(monthStart, endOfMonth(today), today);
  const yearStart = startOfYear(today);
  const yearEnd = today;

  const trackingDays =
    trackingStart != null ? diffCalendarDaysInclusive(trackingStart, today) : 0;

  const marketingWeekly = sumMarketingLog(log, weekStart, weekEnd);
  const marketingMonthly = sumMarketingLog(log, monthStart, monthEnd);
  const marketingYearly = sumMarketingLog(log, yearStart, yearEnd);
  const marketingTill =
    trackingStart != null
      ? sumMarketingLog(log, trackingStart, today)
      : { total: 0, days: 0 };

  const fixedWeekly = prorateMonthlyOverRange(monthlyFixed, weekStart, weekEnd);
  const fixedMonthlyBudget = monthlyFixed;
  const fixedYearlyYtd = prorateMonthlyOverRange(monthlyFixed, yearStart, yearEnd);
  const fixedTill =
    trackingStart != null
      ? prorateMonthlyOverRange(monthlyFixed, trackingStart, today)
      : 0;

  const daysInCurrentMonth = daysInMonth(today);
  const daysElapsedInMonth = diffCalendarDaysInclusive(monthStart, monthEnd);
  const currentMonthFixed = prorateMonthlyOverRange(monthlyFixed, monthStart, monthEnd);
  const currentMonthMarketing = marketingMonthly.total;

  const line = (
    id: string,
    label: string,
    hint: string,
    monthlyAmount: number
  ): ExpenditureLine => ({
    id,
    label,
    hint,
    weekly: prorateMonthlyOverRange(monthlyAmount, weekStart, weekEnd),
    monthly: monthlyAmount,
    yearly: prorateMonthlyOverRange(monthlyAmount, yearStart, yearEnd),
    tillDate:
      trackingStart != null
        ? prorateMonthlyOverRange(monthlyAmount, trackingStart, today)
        : 0,
  });

  const lines: ExpenditureLine[] = [
    line("salary", "Employee salaries", "Monthly budget", employeeSalaryMonthly),
    line("infrastructure", "Hosting, server & email", "Monthly budget", infrastructureMonthly),
    line("operations", "Operations", "Monthly budget", operationsMonthly),
    line("misc", "Miscellaneous", "Monthly budget", miscellaneousMonthly),
    {
      id: "marketing",
      label: "Digital marketing",
      hint: "Sum of logged daily spend (exact)",
      weekly: marketingWeekly.total,
      monthly: marketingMonthly.total,
      yearly: marketingYearly.total,
      tillDate: marketingTill.total,
    },
  ];

  const totals = {
    weekly: fixedWeekly + marketingWeekly.total,
    monthly: fixedMonthlyBudget + marketingMonthly.total,
    yearly: fixedYearlyYtd + marketingYearly.total,
    tillDate: fixedTill + marketingTill.total,
  };

  const monthLabel = today.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const weekLabel = `${toDateKey(weekStart)} → ${toDateKey(weekEnd)}`;
  const monthRangeLabel = `${toDateKey(monthStart)} → ${toDateKey(monthEnd)}`;
  const yearLabel = String(today.getFullYear());

  return {
    currency,
    asOf: toDateKey(today),
    trackingStartDate: trackingStart ? toDateKey(trackingStart) : null,
    trackingDays,
    periodLabels: {
      weekly: weekLabel,
      monthly: monthRangeLabel,
      yearly: yearLabel,
    },
    marketingDaysLogged: {
      weekly: marketingWeekly.days,
      monthly: marketingMonthly.days,
      yearly: marketingYearly.days,
      tillDate: marketingTill.days,
    },
    lines,
    totals,
    currentMonth: {
      label: monthLabel,
      daysElapsed: daysElapsedInMonth,
      daysInMonth: daysInCurrentMonth,
      fixed: currentMonthFixed,
      marketing: currentMonthMarketing,
      total: currentMonthFixed + currentMonthMarketing,
    },
  };
}

export function inputsFromEntity(row: {
  employeeSalaryMonthly: string;
  infrastructureMonthly: string;
  operationsMonthly: string;
  miscellaneousMonthly: string;
  dailyMarketing?: string;
  marketingDailyLog?: unknown;
  trackingStartDate?: string | null;
}): ExpenditureInputs {
  let marketingDailyLog = normalizeMarketingDailyLog(row.marketingDailyLog);
  const legacyDaily = toNumber(row.dailyMarketing);
  if (marketingDailyLog.length === 0 && legacyDaily > 0 && row.trackingStartDate) {
    const start = String(row.trackingStartDate).slice(0, 10);
    const today = toDateKey(new Date());
    marketingDailyLog = [{ date: today, amount: legacyDaily }];
    if (start !== today) {
      marketingDailyLog.push({ date: start, amount: legacyDaily });
    }
  }

  return {
    employeeSalaryMonthly: toNumber(row.employeeSalaryMonthly),
    infrastructureMonthly: toNumber(row.infrastructureMonthly),
    operationsMonthly: toNumber(row.operationsMonthly),
    miscellaneousMonthly: toNumber(row.miscellaneousMonthly),
    marketingDailyLog,
    trackingStartDate: row.trackingStartDate ?? null,
  };
}
