"use client";

import { useCallback, useSyncExternalStore } from "react";

export type CurrencyCode =
  | "GBP"
  | "USD"
  | "EUR"
  | "CAD"
  | "AUD"
  | "AED"
  | "SAR"
  | "MYR";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  /** Exchange rate from GBP (1 GBP = rate in target currency) */
  rate: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  GBP: { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧", rate: 1 },
  USD: { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸", rate: 1.27 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺", rate: 1.17 },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦", rate: 1.72 },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺", rate: 1.93 },
  AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪", rate: 4.67 },
  SAR: { code: "SAR", symbol: "﷼", name: "Saudi Riyal", flag: "🇸🇦", rate: 4.76 },
  MYR: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", flag: "🇲🇾", rate: 5.98 },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);

const STORAGE_KEY = "yif-display-currency-v1";
const DEFAULT_CURRENCY: CurrencyCode = "GBP";

let currentCurrency: CurrencyCode = DEFAULT_CURRENCY;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function isCurrencyCode(value: string): value is CurrencyCode {
  return value in CURRENCIES;
}

function readStoredCurrency(): CurrencyCode {
  if (typeof window === "undefined") return DEFAULT_CURRENCY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isCurrencyCode(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_CURRENCY;
}

function persistCurrency(code: CurrencyCode) {
  currentCurrency = code;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent("currency-changed", { detail: code }));
  }
  emit();
}

function ensureLoaded() {
  if (typeof window !== "undefined" && currentCurrency === DEFAULT_CURRENCY) {
    const stored = readStoredCurrency();
    if (stored !== DEFAULT_CURRENCY) currentCurrency = stored;
  }
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  if (typeof window !== "undefined") {
    const onChange = () => listener();
    window.addEventListener("currency-changed", onChange);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("currency-changed", onChange);
    };
  }
  return () => listeners.delete(listener);
}

function getSnapshot(): CurrencyCode {
  ensureLoaded();
  return currentCurrency;
}

export function normalizeCurrencyCode(code?: string | null): CurrencyCode {
  const upper = (code || DEFAULT_CURRENCY).toUpperCase();
  return isCurrencyCode(upper) ? upper : DEFAULT_CURRENCY;
}

export function getCurrency(): CurrencyInfo {
  return CURRENCIES[getSnapshot()];
}

export function getCurrencyCode(): CurrencyCode {
  return getSnapshot();
}

export function setCurrency(code: CurrencyCode) {
  if (!isCurrencyCode(code)) return;
  persistCurrency(code);
}

/** Convert amount between any two supported currencies */
export function convertAmount(
  amount: number,
  from: CurrencyCode | string,
  to: CurrencyCode | string
): number {
  const fromCode = normalizeCurrencyCode(from);
  const toCode = normalizeCurrencyCode(to);
  if (fromCode === toCode) return amount;
  const gbp = amount / CURRENCIES[fromCode].rate;
  return Math.round(gbp * CURRENCIES[toCode].rate * 100) / 100;
}

/** @deprecated Use convertAmount(amount, "GBP", getCurrencyCode()) */
export function convert(gbpAmount: number): number {
  return convertAmount(gbpAmount, "GBP", getSnapshot());
}

export function toDisplayAmount(
  amount: number,
  fromCurrency?: CurrencyCode | string
): number {
  return convertAmount(amount, normalizeCurrencyCode(fromCurrency), getSnapshot());
}

export function formatMoney(
  amount: number,
  options?: {
    from?: CurrencyCode | string;
    code?: CurrencyCode;
    decimals?: number;
    compact?: boolean;
  }
): string {
  const displayCode = options?.code ?? getSnapshot();
  const displayAmount = options?.from
    ? convertAmount(amount, options.from, displayCode)
    : amount;
  const info = CURRENCIES[displayCode];
  const decimals = options?.decimals ?? (displayAmount % 1 === 0 ? 0 : 2);

  if (options?.compact && displayAmount >= 1000) {
    const k = displayAmount / 1000;
    const formatted =
      k % 1 === 0 ? `${k.toFixed(0)}` : `${k.toFixed(1)}`;
    return `${info.symbol}${formatted}k`;
  }

  const formatted =
    decimals === 0
      ? Math.round(displayAmount).toLocaleString()
      : displayAmount.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });

  return `${info.symbol}${formatted}`;
}

/** @deprecated Use formatMoney */
export function formatCurrency(amount: number, code?: CurrencyCode): string {
  return formatMoney(amount, { code });
}

export function getCurrencySymbol(code?: CurrencyCode | string): string {
  return CURRENCIES[normalizeCurrencyCode(code)].symbol;
}

export function subscribeDisplayCurrency(listener: () => void): () => void {
  return subscribe(listener);
}

export function useCurrency() {
  const code = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_CURRENCY);
  const info = CURRENCIES[code];

  const format = useCallback(
    (
      amount: number,
      options?: Omit<NonNullable<Parameters<typeof formatMoney>[1]>, "code">
    ) => formatMoney(amount, { ...options, code }),
    [code]
  );

  const convertToDisplay = useCallback(
    (amount: number, from?: CurrencyCode | string) =>
      convertAmount(amount, normalizeCurrencyCode(from), code),
    [code]
  );

  return {
    code,
    currency: info,
    symbol: info.symbol,
    setCurrency,
    formatMoney: format,
    convertToDisplay,
  };
}
