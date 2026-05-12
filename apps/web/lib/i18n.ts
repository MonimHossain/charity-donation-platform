export type Locale = "en" | "ar" | "fr" | "ur" | "tr" | "bn";

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
}

export const LOCALES: Record<Locale, LocaleInfo> = {
  en: { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  ar: { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  fr: { code: "fr", name: "French", nativeName: "Français", dir: "ltr" },
  ur: { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl" },
  tr: { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr" },
  bn: { code: "bn", name: "Bengali", nativeName: "বাংলা", dir: "ltr" },
};

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.campaigns": "Campaigns",
    "nav.about": "About Us",
    "nav.blog": "Blog",
    "nav.contact": "Contact",
    "nav.donate": "Donate Now",
    "nav.login": "Login",
    "nav.register": "Register",
    "hero.title": "Transform Lives. Deliver Hope.",
    "hero.subtitle": "A trusted charity delivering food, water, education and emergency aid to families in crisis.",
    "donate.title": "Make a Donation",
    "donate.single": "Single",
    "donate.monthly": "Monthly",
    "donate.quarterly": "Quarterly",
    "donate.annually": "Annually",
    "donate.amount": "Donation Amount",
    "donate.custom": "Custom Amount",
    "donate.giftaid": "Gift Aid",
    "donate.giftaid.desc": "I am a UK taxpayer and I consent to Gift Aid. The charity can claim 25% extra at no cost to you.",
    "donate.name": "Full Name",
    "donate.email": "Email Address",
    "donate.phone": "Phone Number",
    "donate.complete": "Complete Donation",
    "donate.dedication": "Dedicate this donation",
    "donate.dedication.memory": "In memory of",
    "donate.dedication.honor": "In honor of",
    "donate.dedication.behalf": "On behalf of",
    "thankyou.title": "Thank You for Your Generous Donation!",
    "thankyou.subtitle": "Your contribution will make a real difference in the lives of those in need.",
    "zakat.title": "Zakat Calculator",
    "zakat.calculate": "Calculate Zakat",
    "zakat.pay": "Pay Your Zakat",
    "footer.about": "About Us",
    "footer.quicklinks": "Quick Links",
    "footer.contact": "Contact Us",
    "footer.social": "Follow Us",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.campaigns": "الحملات",
    "nav.about": "عن المؤسسة",
    "nav.blog": "المدونة",
    "nav.contact": "اتصل بنا",
    "nav.donate": "تبرع الآن",
    "nav.login": "تسجيل الدخول",
    "nav.register": "إنشاء حساب",
    "hero.title": "غيّر حياة. أوصل الأمل.",
    "hero.subtitle": "مؤسسة خيرية موثوقة توفر الطعام والمياه والتعليم والمساعدات الطارئة.",
    "donate.title": "قدّم تبرعاً",
    "donate.single": "مرة واحدة",
    "donate.monthly": "شهري",
    "donate.quarterly": "ربع سنوي",
    "donate.annually": "سنوي",
    "donate.complete": "إتمام التبرع",
    "thankyou.title": "شكراً لتبرعك الكريم!",
    "zakat.title": "حاسبة الزكاة",
    "zakat.calculate": "احسب الزكاة",
    "zakat.pay": "ادفع زكاتك",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.campaigns": "Campagnes",
    "nav.about": "À propos",
    "nav.donate": "Faire un don",
    "donate.title": "Faire un don",
    "donate.complete": "Finaliser le don",
    "thankyou.title": "Merci pour votre don généreux !",
  },
  ur: {
    "nav.home": "ہوم",
    "nav.campaigns": "مہمات",
    "nav.donate": "ابھی عطیہ دیں",
    "donate.title": "عطیہ دیں",
    "donate.complete": "عطیہ مکمل کریں",
    "thankyou.title": "آپ کے فراخدلانہ عطیہ کا شکریہ!",
    "zakat.title": "زکوٰۃ کیلکولیٹر",
  },
  tr: {
    "nav.home": "Ana Sayfa",
    "nav.donate": "Bağış Yap",
    "donate.title": "Bağış Yap",
    "donate.complete": "Bağışı Tamamla",
  },
  bn: {
    "nav.home": "হোম",
    "nav.donate": "দান করুন",
    "donate.title": "দান করুন",
    "donate.complete": "দান সম্পূর্ণ করুন",
  },
};

let currentLocale: Locale = "en";

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  if (typeof window !== "undefined") {
    localStorage.setItem("locale", locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = LOCALES[locale].dir;
  }
}

export function t(key: string, locale?: Locale): string {
  const l = locale || currentLocale;
  return translations[l]?.[key] || translations.en[key] || key;
}

export function initLocale() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved && LOCALES[saved]) {
      setLocale(saved);
    }
  }
}
