"use client";

import { USE_MOCK_DATA } from "@/lib/config";
import MockAdminDashboard from "@/components/admin/MockAdminDashboard";
import { DashboardQuickActions } from "@/components/admin/dashboard/DashboardQuickActions";
import { DashboardStatCard } from "@/components/admin/dashboard/DashboardStatCard";
import { ExpiringCertificationsTable } from "@/components/admin/dashboard/ExpiringCertificationsTable";
import { RecentSubmissionsTable } from "@/components/admin/dashboard/RecentSubmissionsTable";
import { RamadanSplitDashboardSection } from "@/components/admin/dashboard/RamadanSplitDashboardSection";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DollarSign,
  Heart,
  Users,
  Megaphone,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  Repeat,
  BadgeCheck,
  ClipboardList,
  FileText,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  fetchDonationStats,
  fetchAdminDonations,
  fetchCampaigns,
  fetchAdminDashboardOverview,
} from "@/lib/api";
import {
  formatDonationTypeLabel,
  QUICK_DONATION_TYPE,
  resolveDonationCampaignName,
} from "@/lib/quick-donate";

const statusBadge: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-red-100 text-red-700",
};

function donationTypeBadgeClass(donationType?: string): string {
  if (donationType === QUICK_DONATION_TYPE) return "bg-violet-100 text-violet-700";
  if (donationType === "ramadan") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-600";
}

interface OverviewStats {
  totalCharities: number;
  passedAudits: number;
  underReview: number;
  validCertificates: number;
  expiredCertificates: number;
  newSubmissions: number;
}

const EMPTY_OVERVIEW_STATS: OverviewStats = {
  totalCharities: 0,
  passedAudits: 0,
  underReview: 0,
  validCertificates: 0,
  expiredCertificates: 0,
  newSubmissions: 0,
};

function DashboardSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-serif font-bold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default function AdminDashboardPage() {
  if (USE_MOCK_DATA) return <MockAdminDashboard />;
  return <AdminDashboardPageApi />;
}

function AdminDashboardPageApi() {
  const [fundraisingLoading, setFundraisingLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    let active = true;

    async function loadFundraising() {
      let hasError = false;
      try {
        const [statsData, donationsData, campaignsData] = await Promise.all([
          fetchDonationStats().catch((err) => {
            console.error("Stats error:", err?.response?.status);
            hasError = true;
            return null;
          }),
          fetchAdminDonations({ limit: "10" }).catch((err) => {
            console.error("Donations error:", err?.response?.status);
            hasError = true;
            return null;
          }),
          fetchCampaigns({ limit: "5" }).catch((err) => {
            console.error("Campaigns error:", err?.response?.status);
            hasError = true;
            return null;
          }),
        ]);
        if (!active) return;
        if (statsData) setStats(statsData);
        if (donationsData) setRecentDonations(donationsData.items || donationsData || []);
        if (campaignsData) setCampaigns(campaignsData.items || campaignsData || []);
        if (hasError) {
          toast.error("Some fundraising data failed to load. Check if the API server and database are running.");
        }
      } catch {
        if (active) toast.error("Failed to load fundraising data");
      } finally {
        if (active) setFundraisingLoading(false);
      }
    }

    async function loadOverview() {
      setOverviewError(null);
      try {
        const data = await fetchAdminDashboardOverview();
        if (!active) return;
        setOverview(data);
      } catch {
        if (!active) return;
        setOverviewError("Operations data failed to load. Please refresh and try again.");
      } finally {
        if (active) setOverviewLoading(false);
      }
    }

    loadFundraising();
    loadOverview();
    return () => {
      active = false;
    };
  }, []);

  const totalRevenue = stats?.totalRaised || 0;
  const totalDonations = stats?.totalDonations || 0;
  const monthlyDonors = stats?.monthlyDonors || 0;
  const avgDonation = totalDonations > 0 ? totalRevenue / totalDonations : 0;
  const conversionRate = stats?.conversionRate || 0;
  const recurringActive = stats?.recurringActive || 0;
  const failedPayments = stats?.failedPayments || 0;

  const monthlyRevenue = stats?.monthlyRevenue || [
    { month: "Jan", amount: 4200 },
    { month: "Feb", amount: 5100 },
    { month: "Mar", amount: 3800 },
    { month: "Apr", amount: 6400 },
    { month: "May", amount: 5900 },
    { month: "Jun", amount: 7200 },
  ];
  const maxRevenue = Math.max(...monthlyRevenue.map((m: { amount: number }) => m.amount), 1);

  const fundraisingCards = [
    {
      label: "Total Revenue",
      value: `£${Number(totalRevenue).toLocaleString("en-GB")}`,
      change: stats?.raisedChange || "+12.5%",
      icon: DollarSign,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Total Donations",
      value: Number(totalDonations).toLocaleString("en-GB"),
      change: stats?.donationsChange || "+8.2%",
      icon: Heart,
      color: "text-orange-600 bg-orange-100",
    },
    {
      label: "Monthly Donors",
      value: Number(monthlyDonors).toLocaleString("en-GB"),
      change: stats?.monthlyChange || "+5.1%",
      icon: Users,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Avg Donation",
      value: `£${avgDonation.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "",
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Conversion Rate",
      value: `${Number(conversionRate).toFixed(1)}%`,
      change: "",
      icon: Megaphone,
      color: "text-violet-600 bg-violet-100",
    },
  ];

  const overviewStats: OverviewStats = overview?.stats ?? EMPTY_OVERVIEW_STATS;

  const operationsCards = [
    { title: "Total Charities", value: overviewStats.totalCharities, icon: Landmark, accent: "text-primary bg-primary/10" },
    { title: "Passed Audits", value: overviewStats.passedAudits, icon: ShieldCheck, accent: "text-emerald-600 bg-emerald-100" },
    { title: "Under Review", value: overviewStats.underReview, icon: ClipboardList, accent: "text-blue-600 bg-blue-100" },
    { title: "Valid Certificates", value: overviewStats.validCertificates, icon: BadgeCheck, accent: "text-violet-600 bg-violet-100" },
    {
      title: "Expired Certificates",
      value: overviewStats.expiredCertificates,
      icon: AlertTriangle,
      accent: "text-amber-600 bg-amber-100",
      highlight: overviewStats.expiredCertificates > 0,
    },
    { title: "New Submissions", value: overviewStats.newSubmissions, icon: FileText, accent: "text-orange-600 bg-orange-100" },
  ];

  const initialLoad = fundraisingLoading && overviewLoading;

  if (initialLoad) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-9 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded mt-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="h-10 w-10 bg-muted animate-pulse rounded-xl" />
              <div className="h-7 w-24 bg-muted animate-pulse rounded mt-4" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded mt-1" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-64 rounded-2xl border bg-card shadow-soft animate-pulse" />
          <div className="h-64 rounded-2xl border bg-card shadow-soft animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Your complete command centre — fundraising performance, campaign progress, audits, and submissions in one place.
        </p>
      </header>

      <DashboardSection title="Fundraising" description="Revenue, donors, and donation activity">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {fundraisingLoading
            ? [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-2xl border bg-card p-5 shadow-soft">
                  <div className="h-10 w-10 bg-muted animate-pulse rounded-xl" />
                  <div className="h-7 w-24 bg-muted animate-pulse rounded mt-4" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded mt-1" />
                </div>
              ))
            : fundraisingCards.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    {stat.change && (
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        <TrendingUp className="h-3 w-3" />
                        {stat.change}
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
        </div>

        {!fundraisingLoading && (recurringActive > 0 || failedPayments > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {recurringActive > 0 && (
              <div className="rounded-2xl border bg-card p-5 shadow-soft flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Repeat className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{recurringActive}</p>
                  <p className="text-sm text-muted-foreground">Active Recurring Donations</p>
                </div>
              </div>
            )}
            {failedPayments > 0 && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-soft flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{failedPayments}</p>
                  <p className="text-sm text-red-600">Failed Payments Requiring Attention</p>
                </div>
              </div>
            )}
          </div>
        )}
      </DashboardSection>

      <RamadanSplitDashboardSection />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card shadow-soft p-5">
          <h2 className="text-lg font-serif font-bold">Revenue Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Monthly donation revenue trend</p>
          {fundraisingLoading ? (
            <div className="mt-4 h-48 animate-pulse rounded-xl bg-muted" />
          ) : (
            <div className="mt-4 flex items-end gap-2 h-48">
              {monthlyRevenue.map((m: { month: string; amount: number }) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    £{(m.amount / 1000).toFixed(1)}k
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-primary/80 hover:bg-primary transition-colors min-h-[4px]"
                    style={{ height: `${(m.amount / maxRevenue) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <DashboardQuickActions />
      </div>

      <DashboardSection title="Operations" description="Audits, certifications, and platform health">
        {overviewError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {overviewError}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {operationsCards.map((item) => (
            <DashboardStatCard
              key={item.title}
              title={item.title}
              value={item.value}
              icon={item.icon}
              accent={item.accent}
              highlight={item.highlight}
              loading={overviewLoading}
            />
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="Activity" description="Latest donations, campaigns, and submissions">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card shadow-soft">
            <div className="flex items-center justify-between p-5">
              <div>
                <h3 className="text-lg font-serif font-bold">Recent Donations</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Last 10 transactions</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/donations">
                  View All <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Separator />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Donor</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Amount</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fundraisingLoading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                        Loading donations...
                      </td>
                    </tr>
                  ) : recentDonations.length > 0 ? (
                    recentDonations.slice(0, 10).map((d: any) => (
                      <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-medium">{d.donorName || d.donor || "Anonymous"}</td>
                        <td className="px-5 py-3 font-semibold">
                          £{Number(d.amount || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {resolveDonationCampaignName(d) || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                              donationTypeBadgeClass(d.donationType)
                            )}
                          >
                            {formatDonationTypeLabel(d.donationType)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                              statusBadge[d.status] || "bg-slate-100 text-slate-600"
                            )}
                          >
                            {d.status || "—"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                        No recent donations
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-soft">
            <div className="flex items-center justify-between p-5">
              <div>
                <h3 className="text-lg font-serif font-bold">Campaign Performance</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Top active campaigns by progress</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/campaigns">
                  View All <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Separator />
            <div className="divide-y">
              {fundraisingLoading ? (
                <div className="px-5 py-8 text-center text-muted-foreground">Loading campaigns...</div>
              ) : campaigns.length > 0 ? (
                campaigns.slice(0, 5).map((c: any) => {
                  const raised = c.raised ?? c.raisedAmount ?? 0;
                  const pct = c.goalAmount > 0 ? Math.round((raised / c.goalAmount) * 100) : 0;
                  return (
                    <div key={c.id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate max-w-[200px]">{c.title}</p>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          £{Number(raised).toLocaleString("en-GB")} raised
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {c.donors ?? c.donorCount ?? 0} donors
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-5 py-10 text-center text-muted-foreground">No campaigns yet</div>
              )}
            </div>
          </div>
        </div>

        <RecentSubmissionsTable items={overview?.recentSubmissions ?? []} loading={overviewLoading} />
      </DashboardSection>

      <ExpiringCertificationsTable items={overview?.expiringCertifications ?? []} loading={overviewLoading} />
    </div>
  );
}
