"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Download,
  TrendingUp,
  Users,
  Heart,
  DollarSign,
  Loader2,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  fetchAnalyticsDashboard,
  fetchAnalyticsRevenue,
  fetchAnalyticsCampaigns,
  fetchAnalyticsDonors,
  fetchAnalyticsGiftAid,
  fetchAnalyticsCategories,
  fetchAdminCampaigns,
} from "@/lib/api";
import RevenueBarChart from "@/components/admin/RevenueBarChart";

type DateRange = "week" | "month" | "year" | "custom";

interface CampaignPerf {
  id: string;
  title: string;
  raised: number;
  raisedAmount: number;
  goalAmount: number;
  donorCount: number;
  totalDonations: number;
}

interface TopDonor {
  name: string;
  email: string;
  totalDonated: number;
  donationCount: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [campaigns, setCampaigns] = useState<Array<{ id: string; title: string }>>([]);

  const [revenueTrend, setRevenueTrend] = useState<{ label: string; amount: number }[]>([]);
  const [campaignPerf, setCampaignPerf] = useState<CampaignPerf[]>([]);
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [summaryStats, setSummaryStats] = useState<Record<string, number>>({});

  useEffect(() => {
    void fetchAdminCampaigns({ limit: "200" })
      .then((res) => {
        const items = res.items || res.data || [];
        setCampaigns(
          items.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title }))
        );
      })
      .catch(() => setCampaigns([]));
  }, []);

  const buildParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = { range: dateRange };
    if (dateRange === "custom" && customFrom && customTo) {
      params.from = customFrom;
      params.to = customTo;
    }
    if (campaignId) params.campaignId = campaignId;
    return params;
  }, [dateRange, customFrom, customTo, campaignId]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();

      const [statsData, trendsData, campaignsData, donorsData, giftAidData, categoriesData] =
        await Promise.all([
          fetchAnalyticsDashboard(params).catch(() => ({})),
          fetchAnalyticsRevenue(params).catch(() => []),
          fetchAnalyticsCampaigns(params).catch(() => []),
          fetchAnalyticsDonors(params).catch(() => []),
          fetchAnalyticsGiftAid(params).catch(() => ({})),
          fetchAnalyticsCategories(params).catch(() => []),
        ]);

      const stats = (statsData || {}) as Record<string, number>;
      if (giftAidData?.summary) {
        stats.giftAidTotal =
          giftAidData.summary.totalGiftAidClaimed || giftAidData.summary.giftAidRevenue || 0;
      }
      setSummaryStats(stats);

      const trends = Array.isArray(trendsData) ? trendsData : [];
      setRevenueTrend(
        trends.map((t: { period: string; revenue: number }) => ({
          label: t.period,
          amount: Number(t.revenue || 0),
        }))
      );

      const campaignRows = Array.isArray(campaignsData) ? campaignsData : [];
      setCampaignPerf(
        campaignRows.map((c: CampaignPerf & { calculatedRevenue?: number }) => ({
          ...c,
          raised: Number(c.raisedAmount || c.calculatedRevenue || 0),
        }))
      );

      const donors = Array.isArray(donorsData) ? donorsData : [];
      setTopDonors(
        donors.map((d: { donorName?: string; donorEmail?: string; lifetimeValue?: number; totalDonations?: number }) => ({
          name: d.donorName || "Anonymous",
          email: d.donorEmail || "",
          totalDonated: Number(d.lifetimeValue || 0),
          donationCount: Number(d.totalDonations || 0),
        }))
      );

      const categories = Array.isArray(categoriesData) ? categoriesData : [];
      setCategoryBreakdown(
        categories.map((c: CategoryBreakdown) => ({
          category: c.category,
          amount: Number(c.amount || 0),
          count: Number(c.count || 0),
        }))
      );
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    if (dateRange === "custom" && (!customFrom || !customTo)) return;
    void loadAnalytics();
  }, [dateRange, campaignId, loadAnalytics]);

  function exportCSV(filename: string, headers: string[], rows: string[][]) {
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCampaigns() {
    exportCSV(
      "campaign-performance.csv",
      ["Campaign", "Raised", "Goal", "Progress %", "Donors"],
      campaignPerf.map((c) => [
        c.title,
        String(c.raised),
        String(c.goalAmount),
        String(c.goalAmount > 0 ? Math.round((c.raised / c.goalAmount) * 100) : 0),
        String(c.donorCount),
      ])
    );
  }

  function exportDonors() {
    exportCSV(
      "top-donors.csv",
      ["Name", "Email", "Total Donated", "Donation Count"],
      topDonors.map((d) => [d.name, d.email, String(d.totalDonated), String(d.donationCount)])
    );
  }

  const summaryCards = [
    { label: "Total Revenue", value: `£${Number(summaryStats.totalRevenue || 0).toLocaleString("en-GB")}`, icon: DollarSign, color: "text-primary bg-primary/10" },
    { label: "Donations", value: Number(summaryStats.totalDonations || 0).toLocaleString("en-GB"), icon: Heart, color: "text-orange-600 bg-orange-100" },
    { label: "Avg Donation", value: `£${Number(summaryStats.avgDonation || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-blue-600 bg-blue-100" },
    { label: "Gift Aid Total", value: `£${Number(summaryStats.giftAidTotal || 0).toLocaleString("en-GB")}`, icon: BarChart3, color: "text-emerald-600 bg-emerald-100" },
    { label: "Monthly Donors", value: Number(summaryStats.monthlyDonors || 0).toLocaleString("en-GB"), icon: Users, color: "text-violet-600 bg-violet-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive donation and campaign insights</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[12rem]"
        >
          <option value="">All campaigns</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
          {(["week", "month", "year", "custom"] as DateRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDateRange(r)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors capitalize",
                dateRange === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {r === "week" ? "This Week" : r === "month" ? "This Month" : r === "year" ? "This Year" : "Custom"}
            </button>
          ))}
        </div>
        {dateRange === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
            <span className="text-muted-foreground">to</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
            <Button size="sm" onClick={() => void loadAnalytics()}>Apply</Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-card shadow-soft p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading analytics...
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {summaryCards.map((s) => (
              <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-soft">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", s.color)}>
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border bg-card shadow-soft p-5">
            <h2 className="text-lg font-serif font-bold mb-4">Revenue Trends</h2>
            {revenueTrend.length > 0 ? (
              <RevenueBarChart
                data={revenueTrend}
                heightClass="h-56"
                labelClassName="text-[10px]"
                className="overflow-x-auto pb-2 gap-1"
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">No revenue data for this period</p>
            )}
          </div>

          <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
            <div className="flex items-center justify-between p-5">
              <h2 className="text-lg font-serif font-bold">Campaign Performance</h2>
              <Button variant="outline" size="sm" onClick={exportCampaigns}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
            <Separator />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Raised</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Goal</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Progress</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Donors</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignPerf.length > 0 ? campaignPerf.map((c) => {
                    const pct = c.goalAmount > 0 ? Math.round((c.raised / c.goalAmount) * 100) : 0;
                    return (
                      <tr key={c.id || c.title} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-medium max-w-[250px] truncate">{c.title}</td>
                        <td className="px-5 py-3 font-semibold">£{Number(c.raised).toLocaleString("en-GB")}</td>
                        <td className="px-5 py-3 text-muted-foreground">£{Number(c.goalAmount).toLocaleString("en-GB")}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{c.donorCount}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No campaign data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
              <div className="flex items-center justify-between p-5">
                <h2 className="text-lg font-serif font-bold">Top Donors</h2>
                <Button variant="outline" size="sm" onClick={exportDonors}>
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>
              <Separator />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-5 py-3 text-left font-medium text-muted-foreground">Donor</th>
                      <th className="px-5 py-3 text-left font-medium text-muted-foreground">Total</th>
                      <th className="px-5 py-3 text-left font-medium text-muted-foreground">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDonors.length > 0 ? topDonors.map((d, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.email}</p>
                        </td>
                        <td className="px-5 py-3 font-semibold">£{Number(d.totalDonated).toLocaleString("en-GB")}</td>
                        <td className="px-5 py-3 text-muted-foreground">{d.donationCount}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="px-5 py-10 text-center text-muted-foreground">No donor data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {categoryBreakdown.length > 0 && (
              <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
                <div className="p-5">
                  <h2 className="text-lg font-serif font-bold">Donations by Category</h2>
                </div>
                <Separator />
                <div className="p-5 space-y-3">
                  {categoryBreakdown.map((c, i) => {
                    const maxCat = Math.max(...categoryBreakdown.map((x) => x.amount), 1);
                    const pct = (c.amount / maxCat) * 100;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{c.category}</span>
                          <span className="text-muted-foreground">£{Number(c.amount).toLocaleString("en-GB")} ({c.count})</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
