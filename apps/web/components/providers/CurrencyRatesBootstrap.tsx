"use client";

import { useEffect } from "react";
import { fetchSiteSettings } from "@/lib/api";
import { applyCurrencyRates, initCurrencyFromVisitorLocation } from "@/lib/currency";

/** Loads admin-configured currency rates and auto-picks currency from visitor location once. */
export function CurrencyRatesBootstrap() {
  useEffect(() => {
    initCurrencyFromVisitorLocation();

    let cancelled = false;
    fetchSiteSettings()
      .then((data) => {
        if (!cancelled && data?.currencyRates) {
          applyCurrencyRates(data.currencyRates);
        }
      })
      .catch(() => {
        /* keep built-in defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
