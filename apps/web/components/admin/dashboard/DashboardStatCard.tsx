"use client";

import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: number;
  icon: LucideIcon;
  loading?: boolean;
}

export function DashboardStatCard({ title, value, icon: Icon, loading }: Props) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-primary/60" />
      </div>
      {loading ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-2 text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
      )}
    </div>
  );
}
