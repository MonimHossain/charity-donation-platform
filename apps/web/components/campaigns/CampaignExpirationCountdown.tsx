"use client";

import { useEffect, useMemo } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCountdown, getRemainingMs } from "@/lib/campaign-expiration";
import { useSyncExternalStore } from "react";

interface CampaignExpirationCountdownProps {
  expiresAt: string;
  className?: string;
  variant?: "default" | "compact";
  onExpired?: () => void;
}

function subscribeToTick(onStoreChange: () => void) {
  const timer = window.setInterval(onStoreChange, 1000);
  return () => window.clearInterval(timer);
}

function getTickSnapshot() {
  return Date.now();
}

function getServerTickSnapshot() {
  return 0;
}

function useNow() {
  return useSyncExternalStore(subscribeToTick, getTickSnapshot, getServerTickSnapshot);
}

export function CampaignExpirationCountdown({
  expiresAt,
  className,
  variant = "default",
  onExpired,
}: CampaignExpirationCountdownProps) {
  const now = useNow();
  const remainingMs = useMemo(() => getRemainingMs(expiresAt, now), [expiresAt, now]);
  const ended = remainingMs <= 0;
  const parts = formatCountdown(remainingMs);

  useEffect(() => {
    if (ended) onExpired?.();
  }, [ended, onExpired]);

  if (ended && variant === "compact") {
    return null;
  }

  const units = [
    { label: "Days", short: "d", value: parts.days },
    { label: "Hours", short: "h", value: parts.hours },
    { label: "Mins", short: "m", value: parts.minutes },
    { label: "Secs", short: "s", value: parts.seconds },
  ];

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "rounded-xl border border-primary/25 bg-primary/10 px-3 py-2.5",
          className
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Ends in
          </p>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {units.map((unit) => (
            <div
              key={unit.label}
              className="rounded-lg bg-background/90 px-1.5 py-1.5 text-center"
            >
              <p className="text-sm font-bold tabular-nums text-primary leading-none">
                {String(unit.value).padStart(2, "0")}
              </p>
              <p className="mt-0.5 text-[9px] font-medium uppercase text-muted-foreground">
                {unit.short}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-soft",
        ended ? "border-muted" : "border-primary/20 bg-primary/5",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className={cn("h-5 w-5", ended ? "text-muted-foreground" : "text-primary")} />
        <h2 className="font-serif text-lg font-semibold">
          {ended ? "Campaign has ended" : "Campaign ends in"}
        </h2>
      </div>

      {ended ? (
        <p className="text-sm text-muted-foreground">
          This campaign is no longer accepting donations past its expiration time.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {units.map((unit) => (
            <div
              key={unit.label}
              className="rounded-xl border bg-background px-3 py-4 text-center shadow-sm"
            >
              <p className="text-2xl font-bold tabular-nums text-primary">
                {String(unit.value).padStart(2, "0")}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {unit.label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
