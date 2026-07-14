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
  /** Default exchange rate from GBP (1 GBP = rate in target currency) */
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

export const DEFAULT_CURRENCY_RATES: Record<CurrencyCode, number> = Object.fromEntries(
  CURRENCY_LIST.map((c) => [c.code, c.rate])
) as Record<CurrencyCode, number>;

const STORAGE_KEY = "yif-display-currency-v1";
const DEFAULT_CURRENCY: CurrencyCode = "GBP";

/** ISO 3166-1 alpha-2 → supported display currency. */
const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  GB: "GBP",
  UK: "GBP",
  US: "USD",
  CA: "CAD",
  AU: "AUD",
  AE: "AED",
  SA: "SAR",
  MY: "MYR",
  // Eurozone (and closely tied)
  AT: "EUR",
  BE: "EUR",
  CY: "EUR",
  DE: "EUR",
  EE: "EUR",
  ES: "EUR",
  FI: "EUR",
  FR: "EUR",
  GR: "EUR",
  HR: "EUR",
  IE: "EUR",
  IT: "EUR",
  LT: "EUR",
  LU: "EUR",
  LV: "EUR",
  MT: "EUR",
  NL: "EUR",
  PT: "EUR",
  SI: "EUR",
  SK: "EUR",
};

const TIMEZONE_CURRENCY: Array<{ prefix: string; code: CurrencyCode }> = [
  { prefix: "Europe/London", code: "GBP" },
  { prefix: "America/Toronto", code: "CAD" },
  { prefix: "America/Vancouver", code: "CAD" },
  { prefix: "America/Edmonton", code: "CAD" },
  { prefix: "America/Winnipeg", code: "CAD" },
  { prefix: "America/Halifax", code: "CAD" },
  { prefix: "America/", code: "USD" },
  { prefix: "Pacific/Honolulu", code: "USD" },
  { prefix: "Australia/", code: "AUD" },
  { prefix: "Asia/Dubai", code: "AED" },
  { prefix: "Asia/Riyadh", code: "SAR" },
  { prefix: "Asia/Kuala_Lumpur", code: "MYR" },
  { prefix: "Asia/Kuching", code: "MYR" },
  { prefix: "Europe/Paris", code: "EUR" },
  { prefix: "Europe/Berlin", code: "EUR" },
  { prefix: "Europe/Madrid", code: "EUR" },
  { prefix: "Europe/Rome", code: "EUR" },
  { prefix: "Europe/Amsterdam", code: "EUR" },
  { prefix: "Europe/Brussels", code: "EUR" },
  { prefix: "Europe/Vienna", code: "EUR" },
  { prefix: "Europe/Dublin", code: "EUR" },
  { prefix: "Europe/Lisbon", code: "EUR" },
  { prefix: "Europe/Athens", code: "EUR" },
  { prefix: "Europe/Helsinki", code: "EUR" },
  { prefix: "Europe/Luxembourg", code: "EUR" },
];

let currentCurrency: CurrencyCode = DEFAULT_CURRENCY;
let runtimeRates: Record<CurrencyCode, number> = { ...DEFAULT_CURRENCY_RATES };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function isCurrencyCode(value: string): value is CurrencyCode {
  return value in CURRENCIES;
}

function hasStoredCurrencyPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return Boolean(raw && isCurrencyCode(raw));
  } catch {
    return false;
  }
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

/** Country code from navigator.language / languages (e.g. en-GB → GB). */
function visitorCountryFromLocale(): string | null {
  if (typeof navigator === "undefined") return null;
  const candidates = [navigator.language, ...(navigator.languages || [])];
  for (const lang of candidates) {
    if (!lang) continue;
    const parts = lang.replace("_", "-").split("-");
    if (parts.length >= 2 && parts[1]) {
      const region = parts[1].toUpperCase();
      if (/^[A-Z]{2}$/.test(region)) return region;
    }
  }
  return null;
}

function currencyFromTimezone(tz: string): CurrencyCode | null {
  for (const row of TIMEZONE_CURRENCY) {
    if (tz === row.prefix || tz.startsWith(row.prefix)) return row.code;
  }
  // Generic Europe/* (excluding London handled above) → EUR when no better match
  if (tz.startsWith("Europe/") && tz !== "Europe/London") {
    return "EUR";
  }
  return null;
}

/**
 * Infer display currency from browser locale country, then timezone.
 * Returns null when nothing maps (caller keeps GBP default).
 */
export function detectCurrencyFromVisitorLocation(): CurrencyCode | null {
  if (typeof window === "undefined") return null;

  const country = visitorCountryFromLocale();
  if (country && COUNTRY_CURRENCY[country]) {
    return COUNTRY_CURRENCY[country];
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz) {
      const fromTz = currencyFromTimezone(tz);
      if (fromTz) return fromTz;
    }
  } catch {
    /* ignore */
  }

  return null;
}

/**
 * On first visit (no saved currency), set currency from visitor location signals.
 * Never overrides an explicit CurrencySwitcher choice.
 */
export function initCurrencyFromVisitorLocation(): CurrencyCode | null {
  if (typeof window === "undefined") return null;
  if (hasStoredCurrencyPreference()) {
    currentCurrency = readStoredCurrency();
    return currentCurrency;
  }
  const detected = detectCurrencyFromVisitorLocation();
  if (detected) {
    persistCurrency(detected);
    return detected;
  }
  return null;
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
    window.addEventListener("currency-rates-changed", onChange);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("currency-changed", onChange);
      window.removeEventListener("currency-rates-changed", onChange);
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

export function normalizeCurrencyRates(
  raw?: Partial<Record<string, number>> | null
): Record<CurrencyCode, number> {
  const rates = { ...DEFAULT_CURRENCY_RATES };
  if (!raw || typeof raw !== "object") return rates;
  for (const [code, value] of Object.entries(raw)) {
    const upper = code.toUpperCase();
    const num = Number(value);
    if (isCurrencyCode(upper) && Number.isFinite(num) && num > 0) {
      rates[upper] = num;
    }
  }
  rates.GBP = 1;
  return rates;
}

export function getCurrencyRate(code: CurrencyCode | string): number {
  const normalized = normalizeCurrencyCode(code);
  return runtimeRates[normalized] ?? DEFAULT_CURRENCY_RATES[normalized];
}

export function getCurrencyRates(): Record<CurrencyCode, number> {
  return { ...runtimeRates };
}

export function applyCurrencyRates(raw?: Partial<Record<string, number>> | null) {
  runtimeRates = normalizeCurrencyRates(raw);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("currency-rates-changed"));
  }
  emit();
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

/** Round up to a whole number (no decimals). */
export function ceilAmount(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.ceil(amount);
}

/** Convert amount between any two supported currencies; result is always rounded up. */
export function convertAmount(
  amount: number,
  from: CurrencyCode | string,
  to: CurrencyCode | string
): number {
  const fromCode = normalizeCurrencyCode(from);
  const toCode = normalizeCurrencyCode(to);
  if (fromCode === toCode) return ceilAmount(amount);
  const rateFrom = getCurrencyRate(fromCode);
  const rateTo = getCurrencyRate(toCode);
  const gbp = amount / rateFrom;
  return ceilAmount(gbp * rateTo);
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

/** Convert a source-currency amount (usually GBP) to the user's selected display currency. */
export function displayFromSource(
  amount: number,
  sourceCurrency: CurrencyCode | string = "GBP"
): number {
  return convertAmount(amount, normalizeCurrencyCode(sourceCurrency), getSnapshot());
}

/** Convert a user-entered display amount back to source currency (usually GBP). */
export function sourceFromDisplay(
  displayAmount: number,
  sourceCurrency: CurrencyCode | string = "GBP"
): number {
  return convertAmount(displayAmount, getSnapshot(), normalizeCurrencyCode(sourceCurrency));
}

export function formatMoney(
  amount: number,
  options?: {
    from?: CurrencyCode | string;
    code?: CurrencyCode;
    /** @deprecated Amounts are always shown as whole numbers. */
    decimals?: number;
    compact?: boolean;
  }
): string {
  const displayCode = options?.code ?? getSnapshot();
  const displayAmount = options?.from
    ? convertAmount(amount, options.from, displayCode)
    : ceilAmount(amount);
  const info = CURRENCIES[displayCode];

  if (options?.compact && displayAmount >= 1000) {
    const k = displayAmount / 1000;
    const formatted = k % 1 === 0 ? `${k.toFixed(0)}` : `${Math.ceil(k * 10) / 10}`;
    return `${info.symbol}${formatted}k`;
  }

  return `${info.symbol}${displayAmount.toLocaleString()}`;
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
      convertAmount(amount, normalizeCurrencyCode(from ?? "GBP"), code),
    [code]
  );

  const fromDisplayToSource = useCallback(
    (displayAmount: number, source: CurrencyCode | string = "GBP") =>
      convertAmount(displayAmount, code, normalizeCurrencyCode(source)),
    [code]
  );

  const formatFromSource = useCallback(
    (amount: number, source: CurrencyCode | string = "GBP") =>
      formatMoney(amount, { from: source, code }),
    [code, format]
  );

  return {
    code,
    currency: info,
    symbol: info.symbol,
    setCurrency,
    formatMoney: format,
    convertToDisplay,
    fromDisplayToSource,
    formatFromSource,
    getRate: (target: CurrencyCode | string) => getCurrencyRate(target),
  };
}
