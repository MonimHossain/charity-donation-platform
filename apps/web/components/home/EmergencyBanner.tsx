"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, X, ArrowRight } from "lucide-react";

const STORAGE_KEY = "yif-emergency-dismissed-v1";

const pad = (n: number) => String(n).padStart(2, "0");

const EmergencyBanner = () => {
  const [dismissed, setDismissed] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [deadline, setDeadline] = useState(0);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(STORAGE_KEY) === "1";
    setDismissed(wasDismissed);

    const stored = sessionStorage.getItem("yif-emergency-deadline");
    let d: number;
    if (stored) {
      d = Number(stored);
    } else {
      d = Date.now() + 72 * 60 * 60 * 1000;
      sessionStorage.setItem("yif-emergency-deadline", String(d));
    }
    setDeadline(d);

    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (dismissed || !deadline) return null;

  const diff = Math.max(0, deadline - now);
  const h = Math.floor(diff / 3.6e6);
  const m = Math.floor((diff % 3.6e6) / 6e4);
  const s = Math.floor((diff % 6e4) / 1000);

  return (
    <div className="relative z-[60] bg-destructive text-destructive-foreground">
      <div className="container-wide py-2 flex items-center gap-3 text-sm">
        <span className="hidden sm:inline-flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4" /> GAZA EMERGENCY
        </span>
        <span className="sm:hidden font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
        </span>
        <span className="flex-1 truncate">
          Famine declared — every minute counts.{" "}
          <span className="hidden md:inline opacity-90">Match funding ends in</span>
          <span className="ml-2 font-mono tabular-nums font-bold tracking-wider">
            {pad(h)}:{pad(m)}:{pad(s)}
          </span>
        </span>
        <Link
          href="/donate?cause=gaza"
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-destructive-foreground text-destructive font-semibold text-xs hover:opacity-90"
        >
          Donate now <ArrowRight className="w-3 h-3" />
        </Link>
        <Link
          href="/donate?cause=gaza"
          className="sm:hidden px-2.5 py-1 rounded-full bg-destructive-foreground text-destructive font-semibold text-xs"
        >
          Donate
        </Link>
        <button
          aria-label="Dismiss"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "1");
            setDismissed(true);
          }}
          className="p-1 rounded hover:bg-destructive-foreground/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default EmergencyBanner;
