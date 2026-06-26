"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Locale = "en" | "ar" | "ur" | "tr";

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  flag: string;
}

export const LOCALES: Record<Locale, LocaleInfo> = {
  en: { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "🇬🇧" },
  ar: { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", flag: "🇸🇦" },
  ur: { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl", flag: "🇵🇰" },
  tr: { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr", flag: "🇹🇷" },
};

export const LOCALE_LIST = Object.values(LOCALES);

const STORAGE_KEY = "locale";
const DEFAULT_LOCALE: Locale = "en";

const translations: Record<Locale, Record<string, string>> = {
  en: {
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
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.campaigns": "الحملات",
    "nav.about": "عن المؤسسة",
    "nav.blog": "القصص",
    "nav.contact": "اتصل بنا",
    "nav.donate": "تبرع",
    "nav.zakat": "الزكاة",
    "nav.login": "تسجيل الدخول",
    "nav.account": "حسابي",
    "nav.whereWeWork": "أين نعمل",
    "nav.namazTimes": "أوقات الصلاة",
    "nav.language": "اللغة",
    "donate.title": "قدّم تبرعاً",
    "donate.now": "تبرع الآن",
    "donate.inSeconds": "تبرع في ثوانٍ",
    "donate.secure": "دفع آمن",
    "donate.amount": "المبلغ",
    "donate.others": "أخرى",
    "donate.complete": "إتمام التبرع",
    "checkout.recurring.push": "اجعل هذا تبرعاً متكرراً",
    "checkout.recurring.days": "كرر كل كم يوم؟",
    "checkout.recurring.help":
      "سيتم خصم بطاقتك اليوم، ثم بنفس الجدول حتى تلغي من حسابك.",
    "footer.appeals": "الحملات",
    "footer.explore": "استكشف",
    "footer.contact": "تواصل معنا",
    "footer.policy": "سياسة التبرع 100%",
    "footer.policyDesc": "زكاتك تذهب 100% للمحتاجين.",
  },
  ur: {
    "nav.home": "ہوم",
    "nav.campaigns": "مہمات",
    "nav.about": "ہمارے بارے میں",
    "nav.blog": "کہانیاں",
    "nav.contact": "رابطہ",
    "nav.donate": "عطیہ",
    "nav.zakat": "زکوٰۃ",
    "nav.login": "سائن ان",
    "nav.account": "میرا اکاؤنٹ",
    "nav.whereWeWork": "ہم کہاں کام کرتے ہیں",
    "nav.namazTimes": "نماز کے اوقات",
    "nav.language": "زبان",
    "donate.title": "عطیہ دیں",
    "donate.now": "ابھی عطیہ دیں",
    "donate.inSeconds": "سیکنڈوں میں عطیہ",
    "donate.secure": "محفوظ چیک آؤٹ",
    "donate.amount": "رقم",
    "donate.others": "دیگر",
    "donate.complete": "عطیہ مکمل کریں",
    "checkout.recurring.push": "اسے بار بار عطیہ بنائیں",
    "checkout.recurring.days": "ہر کتنے دن بعد دہرائیں؟",
    "checkout.recurring.help":
      "آج چارج ہوگا، پھر اسی شیڈول پر جب تک آپ اپنے اکاؤنٹ سے منسوخ نہ کریں۔",
    "footer.appeals": "مہمات",
    "footer.explore": "دریافت کریں",
    "footer.contact": "رابطہ کریں",
    "footer.policy": "100% عطیہ پالیسی",
    "footer.policyDesc": "آپ کی زکوٰۃ 100% محتاجین تک جاتی ہے۔",
  },
  tr: {
    "nav.home": "Ana Sayfa",
    "nav.campaigns": "Kampanyalar",
    "nav.about": "Hakkımızda",
    "nav.blog": "Hikayeler",
    "nav.contact": "İletişim",
    "nav.donate": "Bağış",
    "nav.zakat": "Zekat",
    "nav.login": "Giriş yap",
    "nav.account": "Hesabım",
    "nav.whereWeWork": "Nerede çalışıyoruz",
    "nav.namazTimes": "Namaz vakitleri",
    "nav.language": "Dil",
    "donate.title": "Bağış Yap",
    "donate.now": "Bağış Yap",
    "donate.inSeconds": "Saniyeler içinde bağış",
    "donate.secure": "Güvenli ödeme",
    "donate.amount": "Tutar",
    "donate.others": "Diğer",
    "donate.complete": "Bağışı Tamamla",
    "checkout.recurring.push": "Bunu tekrarlayan bağış yap",
    "checkout.recurring.days": "Kaç günde bir tekrarlansın?",
    "checkout.recurring.help":
      "Kartınız bugün tahsil edilir, hesabınızdan iptal edene kadar aynı takvimle devam eder.",
    "footer.appeals": "Kampanyalar",
    "footer.explore": "Keşfet",
    "footer.contact": "İletişim",
    "footer.policy": "%100 Bağış Politikası",
    "footer.policyDesc": "Zekatınız %100 ihtiyaç sahiplerine gider.",
  },
};

let currentLocale: Locale = DEFAULT_LOCALE;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function isLocale(value: string): value is Locale {
  return value in LOCALES;
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isLocale(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

function applyDocumentLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.documentElement.dir = LOCALES[locale].dir;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Locale {
  return currentLocale;
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
    applyDocumentLocale(locale);
    window.dispatchEvent(new CustomEvent("locale-changed", { detail: locale }));
  }
  emit();
}

export function initLocale() {
  if (typeof window === "undefined") return;
  const saved = readStoredLocale();
  currentLocale = saved;
  applyDocumentLocale(saved);
}

export function t(key: string, locale?: Locale): string {
  const l = locale || currentLocale;
  return translations[l]?.[key] || translations.en[key] || key;
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const set = useCallback((code: Locale) => setLocale(code), []);
  const translate = useCallback((key: string) => t(key, locale), [locale]);
  return { locale, setLocale: set, t: translate, dir: LOCALES[locale].dir };
}
