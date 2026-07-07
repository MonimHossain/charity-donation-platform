"use client";

import Link from "next/link";
import {
  Megaphone,
  Heart,
  Users,
  Newspaper,
  TrendingUp,
} from "lucide-react";
import {
  demoCampaigns,
  demoDonations,
  demoUsers,
  demoBlogPosts,
  fmtMoney,
  totalDonors,
  recurringCount,
} from "@/lib/mock";

export default function MockAdminDashboard() {
  const raised = demoDonations
    .filter((d) => d.status === "succeeded")
    .reduce((s, d) => s + d.amount, 0);

  const fundraisingCards = [
    { label: "Total raised", value: fmtMoney(raised), href: "/admin/donations", icon: Heart },
    { label: "Campaigns", value: String(demoCampaigns.length), href: "/admin/campaigns", icon: Megaphone },
    { label: "Donors", value: String(totalDonors), href: "/admin/users", icon: Users },
    { label: "Blog posts", value: String(demoBlogPosts.filter((b) => b.status === "published").length), href: "/admin/blog", icon: Newspaper },
    { label: "Recurring", value: String(recurringCount), href: "/admin/recurring", icon: TrendingUp },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-3xl font-bold text-primary">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Demo metrics — enable API integration per{" "}
          <code className="text-xs bg-secondary px-1 rounded">docs/PHASE2_INTEGRATION.md</code>
        </p>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-serif font-bold">Fundraising</h2>
          <p className="text-sm text-muted-foreground">Revenue, donors, and donation activity</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {fundraisingCards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-2xl bg-card border border-border p-5 shadow-soft hover:shadow-md transition-all"
            >
              <c.icon className="w-5 h-5 text-accent" />
              <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                {c.label}
              </p>
              <p className="font-serif text-2xl font-bold text-primary mt-1">{c.value}</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Demo admin users: {demoUsers.filter((u) => u.role === "admin").map((u) => u.email).join(", ")}
      </p>
    </div>
  );
}
