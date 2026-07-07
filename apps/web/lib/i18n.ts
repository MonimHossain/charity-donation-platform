"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Supported site languages (translated at runtime via Google Translate). */
export type Locale = "en" | "fr" | "ar" | "es" | "de" | "nl";

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  flag: string;
}

export const LOCALES: Record<Locale, LocaleInfo> = {
  en: { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "🇬🇧" },
  fr: { code: "fr", name: "French", nativeName: "Français", dir: "ltr", flag: "🇫🇷" },
  ar: { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", flag: "🇸🇦" },
  es: { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", flag: "🇪🇸" },
  de: { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr", flag: "🇩🇪" },
  nl: { code: "nl", name: "Dutch", nativeName: "Nederlands", dir: "ltr", flag: "🇳🇱" },
};

export const LOCALE_LIST = Object.values(LOCALES);

const LEGACY_STORAGE_KEY = "locale";

/** English UI strings — Google Translate localizes the rendered page. */
const translations: Record<string, string> = {
  "nav.home": "Home",
  "nav.campaigns": "Campaigns",
  "nav.about": "About",
  "nav.blog": "Stories",
  "nav.contact": "Contact",
  "nav.donate": "Donate",
  "nav.zakat": "Zakat",
  "nav.login": "Sign in",
  "nav.account": "My account",
  "nav.whereWeWork": "Where we work",
  "nav.namazTimes": "Namaz times",
  "nav.language": "Language",
  "donate.title": "Make a Donation",
  "donate.now": "Donate Now",
  "donate.inSeconds": "Donate in seconds",
  "donate.secure": "Secure checkout",
  "donate.amount": "Amount",
  "donate.others": "Others",
  "donate.complete": "Complete Donation",
  "checkout.recurring.push": "Make this a recurring gift",
  "checkout.recurring.days": "Repeat every how many days?",
  "checkout.recurring.help":
    "Your card will be charged today, then on the same schedule until you cancel from your account.",
  "footer.appeals": "Appeals",
  "footer.explore": "Explore",
  "footer.contact": "Get in touch",
  "footer.policy": "100% Donation Policy",
  "footer.policyDesc": "Your Zakat goes 100% to those in need.",
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Locale {
  return "en";
}

function getServerSnapshot(): Locale {
  return "en";
}

/** Clear legacy per-locale storage so it does not fight Google Translate. */
export function initLocale() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getLocale(): Locale {
  return "en";
}

/** No-op — language is switched via Google Translate in the header. */
export function setLocale(_locale: Locale) {
  emit();
}

export function t(key: string): string {
  return translations[key] || key;
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const set = useCallback((code: Locale) => setLocale(code), []);
  const translate = useCallback((key: string) => t(key), []);
  return { locale, setLocale: set, t: translate, dir: "ltr" as const };
}
