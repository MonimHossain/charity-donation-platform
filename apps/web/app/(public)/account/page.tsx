"use client";

import { USE_MOCK_DATA } from "@/lib/config";
import MockAccountDashboard from "./MockAccountDashboard";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Heart,
  TrendingUp,
  Repeat,
  Calendar,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { statValueSmClass } from "@/lib/home-buttons";
import { fetchUserProfile, fetchUserDonations, fetchUserRecurringDonations } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { AccountReviewCard } from "@/components/account/AccountReviewCard";

interface DashboardData {
  totalDonated: number;
  donationCount: number;
  activeRecurring: number;
  recentDonations: {
    id: string;
    amount: number;
    currency: string;
    campaign?: string;
    status: string;
    createdAt: string;
  }[];
  recurringDonations: {
    id: string;
    amount: number;
    currency: string;
    frequency: string;
    campaign?: string;
    status: string;
    nextPaymentDate?: string;
  }[];
}

const STAT_CARDS = [
  {
    key: "totalDonated",
    label: "Total Donated",
    icon: TrendingUp,
    money: true,
    gradient: "gradient-plum",
    textClass: "text-primary-foreground",
  },
  {
    key: "donationCount",
    label: "Donations Made",
    icon: Heart,
    money: false,
    gradient: "gradient-lavender",
    textClass: "text-foreground",
  },
  {
    key: "activeRecurring",
    label: "Active Recurring",
    icon: Repeat,
    money: false,
    gradient: "gradient-mint",
    textClass: "text-foreground",
  },
];

export default function AccountDashboard() {
  if (USE_MOCK_DATA) return <MockAccountDashboard />;
  return <AccountDashboardApi />;
}

function AccountDashboardApi() {
  const { formatMoney } = useCurrency();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchUserProfile(),
      fetchUserDonations(),
      fetchUserRecurringDonations(),
    ])
      .then(([profile, donations, recurring]) => {
        const donationList = donations.items || donations || [];
        const recurringList = recurring.items || recurring || [];
        setData({
          totalDonated: Number(profile.totalDonated ?? 0),
          donationCount: Number(profile.donationCount ?? donationList.length),
          activeRecurring: recurringList.filter((r: { status: string }) => r.status === "active").length,
          recentDonations: donationList,
          recurringDonations: recurringList,
        });
      })
      .catch(() => {
        setData({
          totalDonated: 0,
          donationCount: 0,
          activeRecurring: 0,
          recentDonations: [],
          recurringDonations: [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const d = data!;
  const userName =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user_profile") || "{}")?.name ||
        JSON.parse(localStorage.getItem("user_profile") || "{}")?.fullName
      : "";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-primary">
            Welcome back{userName ? `, ${userName}` : ""}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s an overview of your giving journey.
          </p>
        </div>
        <Button asChild variant="accent" className="rounded-full gap-2">
          <Link href="/donate">
            <Heart className="w-4 h-4" /> Make a Donation
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={cn(
              "rounded-2xl p-6 shadow-soft",
              card.gradient,
              card.textClass
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest font-bold opacity-75">
                {card.label}
              </p>
              <card.icon className="w-5 h-5 opacity-60" />
            </div>
            <p className={`${statValueSmClass} mt-2`}>
              {card.money
                ? formatMoney(d[card.key as keyof DashboardData] as number, { from: "GBP" })
                : String(d[card.key as keyof DashboardData])}
            </p>
          </div>
        ))}
      </div>

      <AccountReviewCard />

      {/* Recent donations */}
      <div className="rounded-3xl bg-card border border-border p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-primary">Recent Donations</h2>
          <Link
            href="/account/history"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {d.recentDonations.length === 0 ? (
          <div className="text-center py-10">
            <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground mt-3">No donations yet.</p>
            <Button asChild variant="accent" className="mt-4 rounded-full gap-2">
              <Link href="/donate">Make Your First Donation</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Campaign</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {d.recentDonations.slice(0, 5).map((don) => (
                  <tr
                    key={don.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-3">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(don.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="py-3 font-semibold tabular-nums">
                      {formatMoney(don.amount, { from: don.currency })}
                    </td>
                    <td className="py-3 hidden sm:table-cell text-muted-foreground">
                      {don.campaign || "General"}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold",
                          don.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : don.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-secondary text-secondary-foreground"
                        )}
                      >
                        {don.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active recurring */}
      {d.recurringDonations.length > 0 && (
        <div className="rounded-3xl bg-card border border-border p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-primary">
              Active Recurring Donations
            </h2>
            <Link
              href="/account/recurring"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {d.recurringDonations
              .filter((r) => r.status === "active")
              .map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border"
                >
                  <div>
                    <p className="font-semibold">
                      {formatMoney(r.amount, { from: r.currency })}/{r.frequency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.campaign || "General Fund"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      Active
                    </span>
                    {r.nextPaymentDate && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Next:{" "}
                        {new Date(r.nextPaymentDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Upcoming automated donations */}
      <UpcomingAutomationsPreview />
    </div>
  );
}

function UpcomingAutomationsPreview() {
  const { formatMoney } = useCurrency();
  const [items, setItems] = useState<
    Array<{
      id: string;
      automationType?: string;
      amount: number;
      currency: string;
      campaign?: string;
      status: string;
      nextScheduledDate?: string | null;
      frequency?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("@/lib/api")
      .then(({ fetchMyAutomatedSchedules }) => fetchMyAutomatedSchedules())
      .then((res) => {
        const list = Array.isArray(res.items) ? res.items : [];
        setItems(
          list
            .filter((item: { status?: string }) =>
              ["active", "scheduled", "awaiting_payment_method", "paused"].includes(
                item.status || ""
              )
            )
            .slice(0, 5)
            .map(
              (item: {
                id: string;
                automationType?: string;
                totalAmount?: number;
                currency?: string;
                campaign?: { title?: string };
                status?: string;
                nextScheduledDate?: string | null;
                frequency?: string;
              }) => ({
                id: item.id,
                automationType: item.automationType,
                amount: Number(item.totalAmount || 0),
                currency: item.currency || "GBP",
                campaign: item.campaign?.title,
                status: item.status || "active",
                nextScheduledDate: item.nextScheduledDate,
                frequency: item.frequency,
              })
            )
        );
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <div className="rounded-3xl bg-card border border-border p-6 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl text-primary">Upcoming automated donations</h2>
        <Link
          href="/account/automated"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border"
          >
            <div>
              <p className="font-semibold">
                {formatMoney(item.amount, { from: item.currency })}
                {item.automationType === "recurring" && item.frequency
                  ? ` / ${item.frequency}`
                  : ""}
              </p>
              <p className="text-xs text-muted-foreground">{item.campaign || "General Fund"}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 capitalize">
                {item.status.replace(/_/g, " ")}
              </span>
              {item.nextScheduledDate && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Next:{" "}
                  {new Date(item.nextScheduledDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
