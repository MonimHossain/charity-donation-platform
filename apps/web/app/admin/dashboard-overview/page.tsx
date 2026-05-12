"use client";

import { DashboardQuickActions } from "@/components/admin/dashboard/DashboardQuickActions";
import { DashboardStatCard } from "@/components/admin/dashboard/DashboardStatCard";
import { ExpiringCertificationsTable } from "@/components/admin/dashboard/ExpiringCertificationsTable";
import { RecentSubmissionsTable } from "@/components/admin/dashboard/RecentSubmissionsTable";
import { fetchAdminDashboardOverview } from "@/lib/api";
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  FileText,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalCharities: number;
  passedAudits: number;
  underReview: number;
  validCertificates: number;
  expiredCertificates: number;
  newSubmissions: number;
}

const EMPTY_STATS: DashboardStats = {
  totalCharities: 0,
  passedAudits: 0,
  underReview: 0,
  validCertificates: 0,
  expiredCertificates: 0,
  newSubmissions: 0,
};

export default function DashboardOverviewPage() {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadOverview() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAdminDashboardOverview();
        if (!active) return;
        setOverview(data);
      } catch {
        if (!active) return;
        setError("Failed to load dashboard overview. Please refresh and try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadOverview();
    return () => { active = false; };
  }, []);

  const stats: DashboardStats = overview?.stats ?? EMPTY_STATS;

  const statItems = [
    { title: "Total Charities", value: stats.totalCharities, icon: Landmark },
    { title: "Passed Audits", value: stats.passedAudits, icon: ShieldCheck },
    { title: "Under Review", value: stats.underReview, icon: ClipboardList },
    { title: "Valid Certificates", value: stats.validCertificates, icon: BadgeCheck },
    { title: "Expired Certificates", value: stats.expiredCertificates, icon: AlertTriangle },
    { title: "New Submissions", value: stats.newSubmissions, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Monitor audits, certifications, and public submissions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statItems.map((item) => (
          <DashboardStatCard key={item.title} title={item.title} value={item.value} icon={item.icon} loading={loading} />
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashboardQuickActions />
        <RecentSubmissionsTable items={overview?.recentSubmissions ?? []} loading={loading} />
      </div>

      <ExpiringCertificationsTable items={overview?.expiringCertifications ?? []} loading={loading} />
    </div>
  );
}
