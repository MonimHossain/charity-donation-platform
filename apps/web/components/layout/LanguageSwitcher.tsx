"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { DropdownPortal } from "./DropdownPortal";
import { LOCALE_LIST, useLocale, type Locale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const { locale, setLocale, t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selected = LOCALE_LIST.find((l) => l.code === locale) ?? LOCALE_LIST[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if ((target as Element).closest?.("[data-dropdown-portal]")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        aria-label="Change language"
        className="inline-flex items-center px-2.5 h-9 rounded-full text-xs font-semibold bg-secondary/70 hover:bg-secondary text-foreground border border-border transition-colors"
      >
        {selected.code.toUpperCase()}
        <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <DropdownPortal
        open={open}
        triggerRef={buttonRef}
        align="right"
        className="min-w-[200px] bg-card border border-border rounded-2xl shadow-lift py-1 overflow-hidden"
      >
        <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          {t("nav.language")}
        </div>
        <div className="border-t border-border" />
        {LOCALE_LIST.map((l) => (
          <button
            key={l.code}
            onClick={() => {
              setLocale(l.code as Locale);
              setOpen(false);
            }}
            className="flex items-center justify-between gap-2 w-full px-3 py-2.5 text-left text-sm cursor-pointer hover:bg-secondary transition-colors"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden>{l.flag}</span>
              <span>{l.nativeName}</span>
              <span className="text-muted-foreground text-xs">({l.name})</span>
            </span>
            {l.code === locale && <Check className="w-3.5 h-3.5 text-accent" />}
          </button>
        ))}
      </DropdownPortal>
    </div>
  );
}
