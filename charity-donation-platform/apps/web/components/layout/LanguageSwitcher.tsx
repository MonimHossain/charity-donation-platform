"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "ur", label: "Urdu", native: "اردو", flag: "🇵🇰" },
  { code: "fr", label: "French", native: "Français", flag: "🇫🇷" },
  { code: "tr", label: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  { code: "bn", label: "Bengali", native: "বাংলা", flag: "🇧🇩" },
];

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(LANGUAGES[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Change language"
        className="inline-flex items-center px-2.5 h-9 rounded-full text-xs font-semibold bg-secondary/70 hover:bg-secondary text-foreground border border-border transition-colors"
      >
        {selected.code.toUpperCase()}
        <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[200px] bg-card border border-border rounded-2xl shadow-lift z-50 py-1 overflow-hidden">
          <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Language
          </div>
          <div className="border-t border-border" />
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setSelected(l);
                setOpen(false);
              }}
              className="flex items-center justify-between gap-2 w-full px-3 py-2.5 text-left text-sm cursor-pointer hover:bg-secondary transition-colors"
            >
              <span className="flex items-center gap-2">
                <span aria-hidden>{l.flag}</span>
                <span>{l.native}</span>
                <span className="text-muted-foreground text-xs">({l.label})</span>
              </span>
              {l.code === selected.code && <Check className="w-3.5 h-3.5 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
