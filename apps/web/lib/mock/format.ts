export const fmtMoney = (amount: number, currency = "GBP") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export const fmtMoneyDecimal = (amount: number, currency = "GBP") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();

export const inDays = (n: number) =>
  new Date(Date.now() + n * 24 * 3600 * 1000).toISOString();
