"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  Clock,
  Loader2,
  Repeat,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import {
  formatAutomationType,
  formatNextChargeDate,
  normalizeAutomationItems,
  type AutomationListItem,
} from "@/lib/automation-list";
import { fetchMyAutomatedSchedules, cancelAutomatedSchedule } from "@/lib/api";
import { SCHEDULE_STATUS_STYLES } from "@/lib/payment-utils";
import { recurringIntervalLabel } from "@/lib/stripe-recurring";

type Tab = "all" | "failed";

export default function UserAutomatedPage() {
  const { formatMoney } = useCurrency();
  const [schedules, setSchedules] = useState<AutomationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyAutomatedSchedules()
      .then((res) => setSchedules(normalizeAutomationItems(res)))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (tab === "failed") {
      return schedules.filter((s) => {
        if (["awaiting_payment_method", "paused", "failed"].includes(s.status)) return true;
        if (s.status === "cancelled" && s.completedDays < s.totalDays) return true;
        return false;
      });
    }
    return schedules;
  }, [schedules, tab]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await cancelAutomatedSchedule(id);
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "cancelled" } : s))
      );
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl text-primary">
          Automated Donations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Recurring gifts and scheduled plans waiting for their next charge date.
        </p>
      </div>

      <div className="flex gap-2">
        {(["all", "failed"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold transition-all",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "all" ? "All automations" : "Failed & incomplete"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-card border border-border p-12 shadow-soft text-center">
          <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <h2 className="font-serif text-xl text-primary mt-4">
            {tab === "failed" ? "No failed payments" : "No automated donations yet"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            {tab === "failed"
              ? "All your scheduled donations are on track."
              : "Set up a recurring gift or Ramadan split from any campaign checkout."}
          </p>
          {tab === "all" && (
            <Button asChild variant="accent" className="mt-6 rounded-full">
              <Link href="/donate">Browse campaigns</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => {
            const isRecurring = s.automationType === "recurring";
            const pct =
              !isRecurring && s.totalDays > 0
                ? Math.round((s.completedDays / s.totalDays) * 100)
                : 0;
            const detailHref = isRecurring
              ? "/account/recurring"
              : `/account/automated/${s.id}`;

            return (
              <div
                key={`${s.automationType || "schedule"}-${s.id}`}
                className="rounded-3xl bg-card border border-border p-6 shadow-soft"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                        {isRecurring ? (
                          <Repeat className="w-5 h-5 text-accent-deep" />
                        ) : (
                          <Clock className="w-5 h-5 text-accent-deep" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {s.campaign?.title || "General Fund"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isRecurring ? (
                            <>
                              {formatMoney(s.totalAmount, { from: s.currency })} ·{" "}
                              {recurringIntervalLabel(s.frequency || "monthly")}
                            </>
                          ) : (
                            <>
                              {formatMoney(s.totalAmount, { from: s.currency })} total ·{" "}
                              {formatMoney(s.dailyAmount, { from: s.currency })}/day
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full font-semibold bg-secondary text-foreground">
                        {formatAutomationType(s)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex px-2.5 py-0.5 rounded-full font-semibold capitalize",
                          SCHEDULE_STATUS_STYLES[s.status] || "bg-secondary"
                        )}
                      >
                        {s.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1 font-medium text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        Next charge: {formatNextChargeDate(s.nextScheduledDate)}
                      </span>
                      {!isRecurring && (
                        <span className="text-muted-foreground">
                          {s.completedDays}/{s.totalDays} days ({pct}%)
                        </span>
                      )}
                    </div>
                    {!isRecurring && (
                      <div className="h-1.5 max-w-xs rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!isRecurring &&
                      !["completed", "cancelled"].includes(s.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-destructive"
                          disabled={cancellingId === s.id}
                          onClick={() => handleCancel(s.id)}
                        >
                          {cancellingId === s.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            "Cancel plan"
                          )}
                        </Button>
                      )}
                    <Button variant="outline" size="sm" asChild className="rounded-xl gap-1">
                      <Link href={detailHref}>
                        {isRecurring ? "Manage recurring" : "View details"}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
