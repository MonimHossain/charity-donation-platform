"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { DropdownPortal } from "./DropdownPortal";
import { cn, imageAltFromSrc } from "@/lib/utils";
import {
  applyGoogleTranslateLanguage,
  loadGoogleTranslateScript,
  readSavedLanguage,
} from "@/lib/google-translate-client";

const PAGE_LANGUAGE = "en";

const SITE_LANGUAGES = [
  { label: "English", value: "en", flag: "gb" },
  { label: "Français", value: "fr", flag: "fr" },
  { label: "العربية", value: "ar", flag: "sa" },
  { label: "Español", value: "es", flag: "es" },
  { label: "Deutsch", value: "de", flag: "de" },
  { label: "Nederlands", value: "nl", flag: "nl" },
] as const;

function flagUrl(code: string) {
  return `https://flagcdn.com/20x15/${code.toLowerCase()}.png`;
}

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentLang(readSavedLanguage(PAGE_LANGUAGE));
    loadGoogleTranslateScript(PAGE_LANGUAGE, () => setIsLoading(false), () => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!open) return;

    const close = (e: Event) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if ((target as Element).closest?.("[data-dropdown-portal]")) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]);

  const current = useMemo(
    () => SITE_LANGUAGES.find((l) => l.value === currentLang),
    [currentLang]
  );

  function selectLanguage(lang: string) {
    setOpen(false);
    if (!currentLang || lang === currentLang) return;
    applyGoogleTranslateLanguage(lang);
  }

  if (!currentLang) {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-full bg-secondary/70 border border-border text-primary font-semibold opacity-60",
          compact ? "h-8 px-2 text-[10px]" : "h-9 px-2.5 text-xs"
        )}
      >
        …
      </div>
    );
  }

  return (
    <div className="relative notranslate" translate="no" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isLoading}
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent bg-secondary/70 text-primary hover:bg-secondary border border-border",
          compact
            ? "gap-0.5 h-8 px-2 text-[10px] focus:ring-1 min-w-[3.25rem]"
            : "gap-1 px-2.5 h-9 text-xs"
        )}
      >
        {current?.flag && (
          <img
            src={flagUrl(current.flag)}
            width={16}
            height={12}
            alt={imageAltFromSrc(flagUrl(current.flag))}
            className="shrink-0 rounded-sm"
          />
        )}
        <span className="tabular-nums">{current?.value.toUpperCase() ?? currentLang.toUpperCase()}</span>
        <ChevronDown
          className={cn("shrink-0 transition-transform", compact ? "w-2.5 h-2.5" : "w-3 h-3", open && "rotate-180")}
        />
      </button>

      <DropdownPortal
        open={open}
        triggerRef={buttonRef}
        align="right"
        className="w-56 max-h-[min(70vh,320px)] overflow-y-auto bg-card border border-border rounded-2xl shadow-lift py-1"
      >
        <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          Language
        </div>
        <div className="border-t border-border" />
        {SITE_LANGUAGES.map((lang) => {
          const active = lang.value === currentLang;
          return (
            <button
              key={lang.value}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => selectLanguage(lang.value)}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm cursor-pointer rounded-lg hover:bg-secondary transition-colors touch-manipulation"
            >
              <img src={flagUrl(lang.flag)} width={20} height={15} alt={imageAltFromSrc(flagUrl(lang.flag))} className="shrink-0 rounded-sm" />
              <span className="flex-1 min-w-0 truncate">{lang.label}</span>
              {active && <Check className="w-4 h-4 text-accent-deep shrink-0" />}
            </button>
          );
        })}
      </DropdownPortal>
    </div>
  );
}
