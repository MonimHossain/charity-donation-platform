"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

const CURRENCIES = [
  { code: "GBP", symbol: "£", flag: "🇬🇧" },
  { code: "USD", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", flag: "🇪🇺" },
  { code: "CAD", symbol: "C$", flag: "🇨🇦" },
  { code: "AUD", symbol: "A$", flag: "🇦🇺" },
  { code: "AED", symbol: "د.إ", flag: "🇦🇪" },
  { code: "SAR", symbol: "﷼", flag: "🇸🇦" },
  { code: "MYR", symbol: "RM", flag: "🇲🇾" },
];

interface Props {
  variant?: "header" | "inline" | "dark";
  className?: string;
}

export default function CurrencySwitcher({ variant = "header", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(CURRENCIES[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const styles =
    variant === "dark"
      ? "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
      : variant === "inline"
      ? "bg-secondary text-foreground hover:bg-secondary/70"
      : "bg-secondary/70 text-primary hover:bg-secondary border border-border";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Change currency"
        className={`inline-flex items-center gap-1 px-2.5 h-9 rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${styles} ${className}`}
      >
        <span className="tabular-nums">{selected.symbol}</span>
        <span>{selected.code}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-2xl shadow-lift z-50 py-1 overflow-hidden">
          <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Choose currency
          </div>
          <div className="border-t border-border" />
          {CURRENCIES.map((c) => {
            const active = c.code === selected.code;
            return (
              <button
                key={c.code}
                onClick={() => {
                  setSelected(c);
                  setOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm cursor-pointer rounded-lg hover:bg-secondary transition-colors"
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="flex-1">
                  <span className="font-semibold">{c.code}</span>{" "}
                  <span className="text-muted-foreground">{c.symbol}</span>
                </span>
                {active && <Check className="w-4 h-4 text-accent-deep" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
