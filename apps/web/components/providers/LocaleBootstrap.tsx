"use client";

import { initLocale } from "@/lib/i18n";
import { useEffect } from "react";

export function LocaleBootstrap() {
  useEffect(() => {
    initLocale();
  }, []);
  return null;
}
