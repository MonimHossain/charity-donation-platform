"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calculator,
  CalendarRange,
  Loader2,
  PiggyBank,
  Save,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fetchAdminExpenditures, updateAdminExpenditures } from "@/lib/api";
import {
  computeExpenditureSummary,
  type ExpenditureInputs,
  type ExpenditureSummary,
} from "@/lib/expenditure-calculations";

type PeriodView = "weekly" | "monthly" | "yearly";

type ConfigForm = ExpenditureInputs & { currency: string };

function parseInputMoney(value: string): number {
  const n = parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "GBP",
    maximumFractionDigits: 2,
  }).format(amount);
}

function periodAmount(
  line: { weekly: number; monthly: number; yearly: number },
  period: PeriodView
) {
  if (period === "weekly") return line.weekly;
  if (period === "yearly") return line.yearly;
  return line.monthly;
}

function MoneyField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          £
        </span>
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          className="pl-7"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
        />
      </div>
    </div>
  );
}

export default function AdminExpendituresPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState<PeriodView>("monthly");
  const [currency, setCurrency] = useState("GBP");
  const [fields, setFields] = useState({
    employeeSalaryMonthly: "0",
    infrastructureMonthly: "0",
    operationsMonthly: "0",
    miscellaneousMonthly: "0",
    dailyMarketing: "0",
    trackingStartDate: new Date().toISOString().slice(0, 10),
  });

  const inputs = useMemo<ExpenditureInputs>(
    () => ({
      employeeSalaryMonthly: parseInputMoney(fields.employeeSalaryMonthly),
      infrastructureMonthly: parseInputMoney(fields.infrastructureMonthly),
      operationsMonthly: parseInputMoney(fields.operationsMonthly),
      miscellaneousMonthly: parseInputMoney(fields.miscellaneousMonthly),
      dailyMarketing: parseInputMoney(fields.dailyMarketing),
      trackingStartDate: fields.trackingStartDate || null,
    }),
    [fields]
  );

  const summary = useMemo(
    () => computeExpenditureSummary(inputs, currency),
    [inputs, currency]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAdminExpenditures();
      const c = data.config as ConfigForm;
      setCurrency(c.currency || "GBP");
      setFields({
        employeeSalaryMonthly: String(c.employeeSalaryMonthly ?? 0),
        infrastructureMonthly: String(c.infrastructureMonthly ?? 0),
        operationsMonthly: String(c.operationsMonthly ?? 0),
        miscellaneousMonthly: String(c.miscellaneousMonthly ?? 0),
        dailyMarketing: String(c.dailyMarketing ?? 0),
        trackingStartDate: c.trackingStartDate ?? new Date().toISOString().slice(0, 10),
      });
    } catch {
      toast.error("Failed to load expenditure settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...inputs,
        currency,
      };
      const data = await updateAdminExpenditures(payload);
      toast.success("Expenditure settings saved");
      const c = data.config as ConfigForm;
      setFields({
        employeeSalaryMonthly: String(c.employeeSalaryMonthly ?? 0),
        infrastructureMonthly: String(c.infrastructureMonthly ?? 0),
        operationsMonthly: String(c.operationsMonthly ?? 0),
        miscellaneousMonthly: String(c.miscellaneousMonthly ?? 0),
        dailyMarketing: String(c.dailyMarketing ?? 0),
        trackingStartDate: c.trackingStartDate ?? fields.trackingStartDate,
      });
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight flex items-center gap-2">
            <WalletIcon />
            Expenditures
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Model fixed monthly costs and daily marketing spend. Totals update live for weekly,
            monthly, and yearly views, plus spend from your tracking start date through today.
          </p>
        </div>
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save settings
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarRange className="h-4 w-4 text-primary" />
              Tracking period
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trackingStart">Start date (for till-date total)</Label>
              <Input
                id="trackingStart"
                type="date"
                value={fields.trackingStartDate}
                onChange={(e) =>
                  setFields((f) => ({ ...f, trackingStartDate: e.target.value }))
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <PiggyBank className="h-4 w-4 text-primary" />
              Fixed costs
              <span className="text-xs font-normal text-muted-foreground">(per month)</span>
            </div>
            <MoneyField
              id="salary"
              label="Employee salaries"
              value={fields.employeeSalaryMonthly}
              onChange={(v) => setFields((f) => ({ ...f, employeeSalaryMonthly: v }))}
            />
            <MoneyField
              id="infra"
              label="Web hosting, server & email"
              value={fields.infrastructureMonthly}
              onChange={(v) => setFields((f) => ({ ...f, infrastructureMonthly: v }))}
            />
            <MoneyField
              id="ops"
              label="Operations"
              value={fields.operationsMonthly}
              onChange={(v) => setFields((f) => ({ ...f, operationsMonthly: v }))}
            />
            <MoneyField
              id="misc"
              label="Miscellaneous"
              value={fields.miscellaneousMonthly}
              onChange={(v) => setFields((f) => ({ ...f, miscellaneousMonthly: v }))}
            />
          </section>

          <section className="rounded-2xl border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20 p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <TrendingDown className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              Variable cost
              <span className="text-xs font-normal text-muted-foreground">(per day)</span>
            </div>
            <MoneyField
              id="marketing"
              label="Digital marketing"
              hint="Multiplied by 7 / ~30.4 / 365 for week, month, and year."
              value={fields.dailyMarketing}
              onChange={(v) => setFields((f) => ({ ...f, dailyMarketing: v }))}
            />
          </section>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <SummaryCards summary={summary} period={period} />

          <section className="rounded-2xl border bg-card p-5 shadow-soft space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Calculator className="h-4 w-4 text-primary" />
                Breakdown
              </div>
              <div className="inline-flex rounded-lg border bg-muted/40 p-1">
                {(
                  [
                    ["weekly", "Weekly"],
                    ["monthly", "Monthly"],
                    ["yearly", "Yearly"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPeriod(key)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      period === key
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {period === "weekly" &&
                "Weekly = monthly fixed ÷ 4.33, plus marketing × 7 days."}
              {period === "monthly" &&
                "Monthly = sum of fixed inputs, plus marketing × ~30.4 days."}
              {period === "yearly" &&
                "Yearly = fixed × 12, plus marketing × 365.25 days."}
            </p>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium text-right">
                      {period === "weekly" ? "Per week" : period === "yearly" ? "Per year" : "Per month"}
                    </th>
                    <th className="px-4 py-3 font-medium text-right">Till date</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.lines.map((line) => (
                    <tr key={line.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium">{line.label}</div>
                        {line.hint ? (
                          <div className="text-[11px] text-muted-foreground">{line.hint}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {formatMoney(periodAmount(line, period), summary.currency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {formatMoney(line.tillDate, summary.currency)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-primary/5 font-semibold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(periodAmount(summary.totals, period), summary.currency)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(summary.totals.tillDate, summary.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border bg-muted/20 p-5 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">This calendar month so far</span> (
              {summary.currentMonth.label}, day {summary.currentMonth.daysElapsed} of{" "}
              {summary.currentMonth.daysInMonth}):{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatMoney(summary.currentMonth.total, summary.currency)}
              </span>{" "}
              (fixed {formatMoney(summary.currentMonth.fixed, summary.currency)} + marketing{" "}
              {formatMoney(summary.currentMonth.marketing, summary.currency)}).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function WalletIcon() {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <PiggyBank className="h-5 w-5" />
    </span>
  );
}

function SummaryCards({
  summary,
  period,
}: {
  summary: ExpenditureSummary;
  period: PeriodView;
}) {
  const periodTotal = periodAmount(summary.totals, period);
  const periodLabel =
    period === "weekly" ? "Per week" : period === "yearly" ? "Per year" : "Per month";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Till date
        </p>
        <p className="mt-2 font-serif text-3xl font-semibold tabular-nums">
          {formatMoney(summary.totals.tillDate, summary.currency)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {summary.trackingStartDate
            ? `From ${summary.trackingStartDate} · ${summary.trackingDays} day${
                summary.trackingDays === 1 ? "" : "s"
              }`
            : "Set a start date to calculate"}
        </p>
      </div>
      <div className="rounded-2xl border bg-card p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {periodLabel} (all costs)
        </p>
        <p className="mt-2 font-serif text-3xl font-semibold tabular-nums">
          {formatMoney(periodTotal, summary.currency)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Switch Weekly / Monthly / Yearly in the breakdown table.
        </p>
      </div>
    </div>
  );
}
