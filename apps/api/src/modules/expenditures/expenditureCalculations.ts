const DAYS_PER_MONTH = 365.25 / 12;
const WEEKS_PER_YEAR = 52.1775;

export type ExpenditureInputs = {
  employeeSalaryMonthly: number;
  infrastructureMonthly: number;
  operationsMonthly: number;
  miscellaneousMonthly: number;
  dailyMarketing: number;
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

function diffCalendarDays(from: Date, to: Date): number {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
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
  const dailyMarketing = toNumber(raw.dailyMarketing);

  const monthlyFixed =
    employeeSalaryMonthly +
    infrastructureMonthly +
    operationsMonthly +
    miscellaneousMonthly;

  const weeklyFixed = (monthlyFixed * 12) / WEEKS_PER_YEAR;
  const yearlyFixed = monthlyFixed * 12;

  const weeklyMarketing = dailyMarketing * 7;
  const monthlyMarketing = dailyMarketing * DAYS_PER_MONTH;
  const yearlyMarketing = dailyMarketing * 365.25;

  const trackingStart = parseDateOnly(raw.trackingStartDate);
  const today = startOfDay(asOf);
  const trackingDays =
    trackingStart != null ? diffCalendarDays(trackingStart, today) + 1 : 0;

  const tillDateFixed =
    trackingDays > 0 ? (monthlyFixed / DAYS_PER_MONTH) * trackingDays : 0;
  const tillDateMarketing = trackingDays > 0 ? dailyMarketing * trackingDays : 0;

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysElapsedInMonth = diffCalendarDays(monthStart, today) + 1;
  const currentMonthFixed = (monthlyFixed / daysInMonth) * daysElapsedInMonth;
  const currentMonthMarketing = dailyMarketing * daysElapsedInMonth;

  const lines: ExpenditureLine[] = [
    {
      id: "salary",
      label: "Employee salaries",
      hint: "Monthly fixed",
      weekly: (employeeSalaryMonthly * 12) / WEEKS_PER_YEAR,
      monthly: employeeSalaryMonthly,
      yearly: employeeSalaryMonthly * 12,
      tillDate:
        trackingDays > 0
          ? (employeeSalaryMonthly / DAYS_PER_MONTH) * trackingDays
          : 0,
    },
    {
      id: "infrastructure",
      label: "Hosting, server & email",
      hint: "Monthly fixed",
      weekly: (infrastructureMonthly * 12) / WEEKS_PER_YEAR,
      monthly: infrastructureMonthly,
      yearly: infrastructureMonthly * 12,
      tillDate:
        trackingDays > 0
          ? (infrastructureMonthly / DAYS_PER_MONTH) * trackingDays
          : 0,
    },
    {
      id: "operations",
      label: "Operations",
      hint: "Monthly fixed",
      weekly: (operationsMonthly * 12) / WEEKS_PER_YEAR,
      monthly: operationsMonthly,
      yearly: operationsMonthly * 12,
      tillDate:
        trackingDays > 0 ? (operationsMonthly / DAYS_PER_MONTH) * trackingDays : 0,
    },
    {
      id: "misc",
      label: "Miscellaneous",
      hint: "Monthly fixed",
      weekly: (miscellaneousMonthly * 12) / WEEKS_PER_YEAR,
      monthly: miscellaneousMonthly,
      yearly: miscellaneousMonthly * 12,
      tillDate:
        trackingDays > 0
          ? (miscellaneousMonthly / DAYS_PER_MONTH) * trackingDays
          : 0,
    },
    {
      id: "marketing",
      label: "Digital marketing",
      hint: "Daily spend",
      weekly: weeklyMarketing,
      monthly: monthlyMarketing,
      yearly: yearlyMarketing,
      tillDate: tillDateMarketing,
    },
  ];

  const totals = {
    weekly: weeklyFixed + weeklyMarketing,
    monthly: monthlyFixed + monthlyMarketing,
    yearly: yearlyFixed + yearlyMarketing,
    tillDate: tillDateFixed + tillDateMarketing,
  };

  const monthLabel = today.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return {
    currency,
    asOf: today.toISOString().slice(0, 10),
    trackingStartDate: trackingStart ? trackingStart.toISOString().slice(0, 10) : null,
    trackingDays,
    lines,
    totals,
    currentMonth: {
      label: monthLabel,
      daysElapsed: daysElapsedInMonth,
      daysInMonth,
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
  dailyMarketing: string;
  trackingStartDate?: string | null;
}): ExpenditureInputs {
  return {
    employeeSalaryMonthly: toNumber(row.employeeSalaryMonthly),
    infrastructureMonthly: toNumber(row.infrastructureMonthly),
    operationsMonthly: toNumber(row.operationsMonthly),
    miscellaneousMonthly: toNumber(row.miscellaneousMonthly),
    dailyMarketing: toNumber(row.dailyMarketing),
    trackingStartDate: row.trackingStartDate ?? null,
  };
}
