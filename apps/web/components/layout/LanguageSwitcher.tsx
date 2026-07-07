"use client";

import "next-google-translate-widget/styles";
import GoogleTranslate from "next-google-translate-widget";

const SITE_LANGUAGES = [
  { label: "English", value: "en", flag: "gb" },
  { label: "Français", value: "fr", flag: "fr" },
  { label: "العربية", value: "ar", flag: "sa" },
  { label: "Español", value: "es", flag: "es" },
  { label: "Deutsch", value: "de", flag: "de" },
  { label: "Nederlands", value: "nl", flag: "nl" },
];

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  return (
    <GoogleTranslate
      pageLanguage="en"
      languages={SITE_LANGUAGES}
      menuAlign="right"
      className={compact ? "ngt-site-header ngt-compact" : "ngt-site-header"}
    />
  );
}
