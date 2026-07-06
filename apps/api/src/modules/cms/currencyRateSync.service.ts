import { AppDataSource } from "../../helper/connectDB.js";
import { SiteSettings } from "../../components/cms/siteSettings.entity.js";

const SYNC_CURRENCY_CODES = ["USD", "EUR", "CAD", "AUD", "AED", "SAR", "MYR"] as const;

const DEFAULT_CURRENCY_RATES: Record<string, number> = {
  GBP: 1,
  USD: 1.27,
  EUR: 1.17,
  CAD: 1.72,
  AUD: 1.93,
  AED: 4.67,
  SAR: 4.76,
  MYR: 5.98,
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeCurrencyRates(
  raw: Record<string, unknown> | null | undefined,
  base: Record<string, number>
): Record<string, number> {
  const rates = { ...base };
  if (!raw || typeof raw !== "object") return rates;
  for (const [code, value] of Object.entries(raw)) {
    const upper = code.toUpperCase();
    const num = Number(value);
    if (upper in rates && Number.isFinite(num) && num > 0) {
      rates[upper] = num;
    }
  }
  rates.GBP = 1;
  return rates;
}

async function fetchFrankfurterRates(): Promise<Record<string, number>> {
  const symbols = SYNC_CURRENCY_CODES.join(",");
  const url = `https://api.frankfurter.app/latest?from=GBP&to=${symbols}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Frankfurter API error: ${res.status}`);
  }
  const data = (await res.json()) as { rates?: Record<string, number> };
  return data.rates ?? {};
}

export async function syncCurrencyRatesFromApi(): Promise<{
  rates: Record<string, number>;
  updatedAt: Date;
  fetched: string[];
}> {
  const repo = AppDataSource.getRepository(SiteSettings);
  let settings = await repo.findOne({ where: {} });
  if (!settings) {
    settings = repo.create({ siteName: "Charity Donation Platform" });
    await repo.save(settings);
  }

  const current = normalizeCurrencyRates(
    settings.currencyRates as Record<string, unknown>,
    DEFAULT_CURRENCY_RATES
  );

  let fetchedRates: Record<string, number> = {};
  try {
    fetchedRates = await fetchFrankfurterRates();
  } catch (error) {
    console.warn("Currency sync: Frankfurter fetch failed, keeping stored rates.", error);
  }

  const merged = { ...current };
  const fetched: string[] = [];
  for (const code of SYNC_CURRENCY_CODES) {
    const rate = fetchedRates[code];
    if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
      merged[code] = rate;
      fetched.push(code);
    }
  }
  merged.GBP = 1;

  const updatedAt = new Date();
  settings.currencyRates = merged;
  settings.currencyRatesUpdatedAt = updatedAt;
  await repo.save(settings);

  return { rates: merged, updatedAt, fetched };
}

export async function maybeSyncCurrencyRatesOnBoot(): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(SiteSettings);
    const settings = await repo.findOne({ where: {} });
    const last = settings?.currencyRatesUpdatedAt;
    const stale = !last || Date.now() - new Date(last).getTime() > SEVEN_DAYS_MS;
    if (stale) {
      const result = await syncCurrencyRatesFromApi();
      console.log(
        `Currency rates synced (${result.fetched.length} codes from Frankfurter).`
      );
    }
  } catch (error) {
    console.warn("Currency rate boot sync skipped:", (error as Error).message);
  }
}

export function startCurrencyRateSyncWorker(intervalMs = SEVEN_DAYS_MS): void {
  const run = () => {
    void syncCurrencyRatesFromApi().catch((error) => {
      console.warn("Scheduled currency sync failed:", (error as Error).message);
    });
  };
  setInterval(run, intervalMs);
}
