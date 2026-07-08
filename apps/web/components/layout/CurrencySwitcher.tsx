"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { CURRENCY_LIST, useCurrency } from "@/lib/currency";
import { DropdownPortal } from "./DropdownPortal";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "header" | "inline" | "dark";
  compact?: boolean;
  className?: string;
}

export default function CurrencySwitcher({ variant = "header", compact = false, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const { code, currency, setCurrency } = useCurrency();
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if ((target as Element).closest?.("[data-dropdown-portal]")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
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
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        aria-label="Change currency"
        className={cn(
          "inline-flex items-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent",
          compact
            ? "gap-0.5 h-8 px-2 text-[10px] focus:ring-1"
            : "gap-1 px-2.5 h-9 text-xs",
          styles,
          className
        )}
      >
        <span className="tabular-nums">{currency.symbol}</span>
        <span>{code}</span>
        <ChevronDown className={cn("transition-transform", compact ? "w-2.5 h-2.5" : "w-3 h-3", open && "rotate-180")} />
      </button>
      <DropdownPortal
        open={open}
        triggerRef={buttonRef}
        align="right"
        className="w-56 bg-card border border-border rounded-2xl shadow-lift py-1 overflow-hidden"
      >
        <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          Choose currency
        </div>
        <div className="border-t border-border" />
        {CURRENCY_LIST.map((c) => {
          const active = c.code === code;
          return (
            <button
              key={c.code}
              onClick={() => {
                setCurrency(c.code);
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
      </DropdownPortal>
    </div>
  );
}
