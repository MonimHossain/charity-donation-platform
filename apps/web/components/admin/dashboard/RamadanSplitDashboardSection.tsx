"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Calendar, Heart, Moon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { resolveDonationCampaignName } from "@/lib/quick-donate";
import { cn } from "@/lib/utils";
import {
  fetchAdminAutomatedSchedules,
  fetchAdminCampaigns,
  fetchAdminDonations,
} from "@/lib/api";
import type { RamadanSplitConfig } from "@/lib/campaign-experience";
import { DashboardStatCard } from "./DashboardStatCard";

interface RamadanCampaign {
  id: string;
  title: string;
  slug: string;
  status: string;
  raisedAmount?: number;
  donorCount?: number;
  experienceConfig?: RamadanSplitConfig;
}

interface RamadanDonation {
  id: string;
  donorName?: string;
  donor?: string;
  amount?: number;
  totalAmount?: number;
  status?: string;
  campaignTitle?: string;
  campaign?: { title?: string };
  createdAt?: string;
  donationType?: string;
  frequency?: string;
}

interface RamadanSchedule {
  id: string;
  donorName: string;
  donorEmail: string;
  totalAmount: number;
  paidAmount: number;
  totalDays: number;
  completedDays: number;
  status: string;
  startDate: string;
  endDate: string;
  installments?: unknown[];
  campaign?: { title?: string };
}

function isRamadanDonation(d: RamadanDonation): boolean {
  return d.donationType === "ramadan" || d.frequency === "ramadan_split";
}

function isRamadanSchedule(s: RamadanSchedule): boolean {
  return Array.isArray(s.installments) && s.installments.length > 0;
}

function formatRamadanStart(config?: RamadanSplitConfig): string {
  if (!config) return "—";
  const date = config.ramadanStartDate || config.startChoices?.[0]?.date;
  if (!date) return "—";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const campaignStatusStyles: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-slate-100 text-slate-600",
  archived: "bg-amber-100 text-amber-800",
};

const donationStatusStyles: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-red-100 text-red-700",
};

export function RamadanSplitDashboardSection() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<RamadanCampaign[]>([]);
  const [donations, setDonations] = useState<RamadanDonation[]>([]);
  const [schedules, setSchedules] = useState<RamadanSchedule[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [campaignsRes, donationsRes, schedulesRes] = await Promise.all([
          fetchAdminCampaigns({ mode: "ramadan_split", limit: "20" }),
          fetchAdminDonations({ limit: "100" }),
          fetchAdminAutomatedSchedules({ limit: "100" }),
        ]);
        if (!active) return;

        setCampaigns(campaignsRes.items || campaignsRes || []);
        const allDonations = donationsRes.items || donationsRes || [];
        setDonations(allDonations.filter(isRamadanDonation));
        const allSchedules = schedulesRes.items || schedulesRes || [];
        setSchedules(allSchedules.filter(isRamadanSchedule));
      } catch {
        if (active) {
          setCampaigns([]);
          setDonations([]);
          setSchedules([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const completed = donations.filter((d) => d.status === "completed");
    const totalRaised = completed.reduce(
      (sum, d) => sum + Number(d.totalAmount ?? d.amount ?? 0),
      0
    );
    const activeSchedules = schedules.filter((s) =>
      ["active", "scheduled", "awaiting_payment_method"].includes(s.status)
    );
    const publishedCampaigns = campaigns.filter((c) => c.status === "published");

    return {
      campaignCount: campaigns.length,
      publishedCount: publishedCampaigns.length,
      donationCount: completed.length,
      totalRaised,
      activeSchedules: activeSchedules.length,
    };
  }, [campaigns, donations, schedules]);

  const recentDonations = donations.slice(0, 8);
  const activeSchedules = schedules
    .filter((s) => ["active", "scheduled", "awaiting_payment_method"].includes(s.status))
    .slice(0, 5);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-serif font-bold tracking-tight">Ramadan Split</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ramadan campaigns, nightly split schedules, and related donations
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link href="/admin/campaigns">
              Manage campaigns <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link href="/admin/automated">
              Split schedules <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-card to-card p-5 shadow-soft space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            title="Ramadan campaigns"
            value={stats.campaignCount}
            icon={Moon}
            accent="text-amber-700 bg-amber-100"
            loading={loading}
          />
          <DashboardStatCard
            title="Published live"
            value={stats.publishedCount}
            icon={Calendar}
            accent="text-emerald-700 bg-emerald-100"
            loading={loading}
          />
          <DashboardStatCard
            title="Ramadan donations"
            value={stats.donationCount}
            icon={Heart}
            accent="text-orange-700 bg-orange-100"
            loading={loading}
          />
          <DashboardStatCard
            title="Total raised"
            value={`£${stats.totalRaised.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`}
            icon={Users}
            accent="text-amber-800 bg-amber-100"
            loading={loading}
            highlight={stats.totalRaised > 0}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-amber-100 bg-card/90 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100/80">
              <div>
                <h3 className="font-semibold text-sm">Ramadan campaigns</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Start date, nights, and progress</p>
              </div>
            </div>
            {loading ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Loading campaigns...</div>
            ) : campaigns.length > 0 ? (
              <div className="divide-y">
                {campaigns.map((c) => {
                  const config = c.experienceConfig as RamadanSplitConfig | undefined;
                  return (
                    <div key={c.id} className="px-5 py-4 hover:bg-amber-50/40 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{c.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Starts {formatRamadanStart(config)} · {config?.maxNights ?? 30} nights
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                            campaignStatusStyles[c.status] || "bg-slate-100 text-slate-600"
                          )}
                        >
                          {c.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>£{Number(c.raisedAmount ?? 0).toLocaleString("en-GB")} raised</span>
                        <span>{c.donorCount ?? 0} donors</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                No Ramadan Split campaigns yet.{" "}
                <Link href="/admin/campaigns" className="text-amber-700 font-medium hover:underline">
                  Create one
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amber-100 bg-card/90 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100/80">
              <div>
                <h3 className="font-semibold text-sm">Recent Ramadan donations</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Latest split gifts and installments</p>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-8">
                <Link href="/admin/donations">
                  View all <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-amber-50/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Donor</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Campaign</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        Loading donations...
                      </td>
                    </tr>
                  ) : recentDonations.length > 0 ? (
                    recentDonations.map((d) => (
                      <tr key={d.id} className="border-b last:border-0 hover:bg-amber-50/30">
                        <td className="px-4 py-3 font-medium">{d.donorName || d.donor || "Anonymous"}</td>
                        <td className="px-4 py-3 font-semibold tabular-nums">
                          £{Number(d.totalAmount ?? d.amount ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[120px]">
                          {resolveDonationCampaignName(d) || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                              donationStatusStyles[d.status || ""] || "bg-slate-100 text-slate-600"
                            )}
                          >
                            {d.status || "—"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                        No Ramadan donations yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {!loading && activeSchedules.length > 0 && (
          <>
            <Separator className="bg-amber-100" />
            <div>
              <h3 className="font-semibold text-sm mb-3">Active split schedules</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeSchedules.map((s) => {
                  const progress =
                    s.totalDays > 0 ? Math.round((s.completedDays / s.totalDays) * 100) : 0;
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl border border-amber-100 bg-card/80 px-4 py-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{s.donorName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {resolveDonationCampaignName(s) || "—"}
                          </p>
                        </div>
                        <span className="text-xs font-medium capitalize text-amber-800">{s.status}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-amber-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          £{Number(s.paidAmount).toLocaleString("en-GB")} / £
                          {Number(s.totalAmount).toLocaleString("en-GB")}
                        </span>
                        <span>
                          {s.completedDays}/{s.totalDays} nights
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
