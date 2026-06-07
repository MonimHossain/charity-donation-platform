"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";

const actions = [
  { label: "Add Admin User", href: "/admin/admin-users", icon: UserPlus },
];

export function DashboardQuickActions() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
      <div className="mt-3 space-y-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <action.icon className="h-4 w-4 text-primary" />
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
