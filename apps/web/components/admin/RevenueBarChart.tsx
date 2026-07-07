"use client";

import { cn } from "@/lib/utils";

export type RevenueBarPoint = {
  label: string;
  amount: number;
};

function formatBarAmount(amount: number): string {
  if (amount >= 1000) return `£${(amount / 1000).toFixed(1)}k`;
  return `£${amount.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

type Props = {
  data: RevenueBarPoint[];
  className?: string;
  heightClass?: string;
  labelClassName?: string;
};

export default function RevenueBarChart({
  data,
  className,
  heightClass = "h-48",
  labelClassName = "text-xs",
}: Props) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className={cn("flex items-end gap-2", heightClass, className)}>
      {data.map((point) => {
        const pct = (point.amount / maxAmount) * 100;
        return (
          <div key={point.label} className="flex-1 min-w-0 h-full flex flex-col items-center gap-1">
            <span className={cn("font-medium text-muted-foreground whitespace-nowrap", labelClassName)}>
              {formatBarAmount(point.amount)}
            </span>
            <div className="flex-1 w-full flex items-end min-h-0">
              <div
                className="w-full rounded-t-lg bg-primary/80 hover:bg-primary transition-colors min-h-[4px]"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className={cn("text-muted-foreground whitespace-nowrap truncate max-w-full", labelClassName)}>
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
