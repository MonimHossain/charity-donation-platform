"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import { useEmergencyBanner } from "@/lib/data/cms";

const dismissKey = (id: string) => `yif-emergency-dismissed-${id}`;

const pad = (n: number) => String(n).padStart(2, "0");

const EmergencyBanner = () => {
  const { data: banners, isLoading } = useEmergencyBanner();
  const banner = banners?.[0] ?? null;

  const [dismissed, setDismissed] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!banner?.id) return;
    setDismissed(localStorage.getItem(dismissKey(banner.id)) === "1");
  }, [banner?.id]);

  useEffect(() => {
    if (!banner?.endDate) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [banner?.endDate]);

  const countdown = useMemo(() => {
    if (!banner?.endDate) return null;
    const deadline = new Date(banner.endDate).getTime();
    const diff = Math.max(0, deadline - now);
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3.6e6);
    const m = Math.floor((diff % 3.6e6) / 6e4);
    const s = Math.floor((diff % 6e4) / 1000);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }, [banner?.endDate, now]);

  if (isLoading || !banner || dismissed) return null;
  if (banner.endDate && new Date(banner.endDate).getTime() <= now) return null;

  const bg = banner.backgroundColor || undefined;
  const fg = banner.textColor || undefined;
  const ctaBg = fg || "hsl(var(--destructive-foreground))";
  const ctaFg = bg || "hsl(var(--destructive))";

  return (
    <div
      className="relative z-[60] bg-destructive text-destructive-foreground"
      style={bg ? { backgroundColor: bg, color: fg || undefined } : undefined}
    >
      <div className="container-wide py-2 flex items-center gap-3 text-sm">
        <span className="hidden sm:inline-flex items-center gap-2 font-semibold shrink-0">
          <AlertTriangle className="w-4 h-4" /> {banner.title}
        </span>
        <span className="sm:hidden font-semibold flex items-center gap-1.5 shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </span>
        <span className="flex-1 truncate">
          {banner.content}
          {countdown && (
            <>
              {" "}
              <span className="hidden md:inline opacity-90">Ends in</span>
              <span className="ml-2 font-mono tabular-nums font-bold tracking-wider">{countdown}</span>
            </>
          )}
        </span>
        {banner.ctaText && banner.ctaUrl && (
          <>
            <Link
              href={banner.ctaUrl}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-xs hover:opacity-90 shrink-0"
              style={{ backgroundColor: ctaBg, color: ctaFg }}
            >
              {banner.ctaText} <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              href={banner.ctaUrl}
              className="sm:hidden px-2.5 py-1 rounded-full font-semibold text-xs shrink-0"
              style={{ backgroundColor: ctaBg, color: ctaFg }}
            >
              {banner.ctaText}
            </Link>
          </>
        )}
        {banner.dismissible !== false && (
          <button
            aria-label="Dismiss"
            onClick={() => {
              localStorage.setItem(dismissKey(banner.id), "1");
              setDismissed(true);
            }}
            className="p-1 rounded hover:bg-white/10 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default EmergencyBanner;
