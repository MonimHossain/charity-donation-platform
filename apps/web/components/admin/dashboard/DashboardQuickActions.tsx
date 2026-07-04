"use client";

import Link from "next/link";
import { Layers, Megaphone, TrendingUp, UserPlus } from "lucide-react";
import { isSuperAdminSession, useAdminSession, hasAdminPermission } from "@/components/admin/AdminSessionProvider";

const actions = [
  { label: "Create Campaign", href: "/admin/campaigns", icon: Megaphone, permission: "campaigns.view" },
  { label: "View Analytics", href: "/admin/analytics", icon: TrendingUp, permission: "analytics.view" },
  { label: "Manage Content", href: "/admin/cms", icon: Layers, permission: "cms.view" },
  {
    label: "Add Admin User",
    href: "/admin/admin-users",
    icon: UserPlus,
    permission: "admins.view",
    superAdminOnly: true,
  },
];

export function DashboardQuickActions() {
  const session = useAdminSession();

  const visible = actions.filter((action) => {
    if (action.superAdminOnly) return isSuperAdminSession(session);
    return hasAdminPermission(session, action.permission);
  });

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft h-full">
      <h3 className="text-lg font-serif font-bold text-foreground">Quick Actions</h3>
      <p className="text-xs text-muted-foreground mt-0.5">Common admin tasks</p>
      <div className="mt-4 space-y-1.5">
        {visible.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <action.icon className="h-4 w-4" />
            </span>
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
