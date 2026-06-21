"use client";

import { useEffect } from "react";
import { fetchSiteSettings } from "@/lib/api";
import { applyCurrencyRates } from "@/lib/currency";

/** Loads admin-configured currency rates once on app startup. */
export function CurrencyRatesBootstrap() {
  useEffect(() => {
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
