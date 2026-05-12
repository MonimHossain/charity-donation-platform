export type CurrencyCode = "GBP" | "USD" | "EUR" | "CAD" | "AUD";

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  GBP: { code: "GBP", symbol: "£", name: "British Pound", rate: 1 },
  USD: { code: "USD", symbol: "$", name: "US Dollar", rate: 1.27 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", rate: 1.17 },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 1.72 },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 1.93 },
};

let currentCurrency: CurrencyCode = "GBP";

export function getCurrency(): CurrencyInfo {
  return CURRENCIES[currentCurrency];
}

export function setCurrency(code: CurrencyCode) {
  currentCurrency = code;
}

export function convert(gbpAmount: number): number {
  const rate = CURRENCIES[currentCurrency].rate;
  return Math.round(gbpAmount * rate);
}

export function formatCurrency(amount: number, code?: CurrencyCode): string {
  const c = CURRENCIES[code ?? currentCurrency];
  return `${c.symbol}${amount.toLocaleString()}`;
}
