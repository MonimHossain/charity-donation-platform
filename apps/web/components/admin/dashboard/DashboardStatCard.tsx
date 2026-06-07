"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: number | string;
  icon: LucideIcon;
  loading?: boolean;
  accent?: string;
  highlight?: boolean;
}

export function DashboardStatCard({
  title,
  value,
  icon: Icon,
  loading,
  accent = "text-primary bg-primary/10",
  highlight,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-md",
        highlight && "border-amber-200 bg-amber-50/50"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", accent)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded bg-muted" />
      ) : (
        <p className={cn("mt-3 text-2xl font-bold tracking-tight", highlight && "text-amber-700")}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      )}
    </div>
  );
}
