"use client";

import { initLocale } from "@/lib/i18n";
import { useEffect } from "react";

/** Clears legacy locale storage on load; Google Translate handles language selection. */
export function LocaleBootstrap() {
  useEffect(() => {
    initLocale();
  }, []);
  return null;
}
