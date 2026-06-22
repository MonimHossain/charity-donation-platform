/** Troy ounce → grams (used for spot price conversion). */
export const TROY_OZ_GRAMS = 31.1034768;

export const NISAB_GOLD_GRAMS = 87.48;
export const NISAB_SILVER_GRAMS = 612.36;

export type MetalPriceSource = "goldapi" | "metals-api" | "metalpriceapi" | "fallback";

export type MetalPrices = {
  currency: string;
  goldPricePerGram: number;
  silverPricePerGram: number;
  goldPricePerTroyOz: number;
  silverPricePerTroyOz: number;
  source: MetalPriceSource;
  updatedAt: string;
  isLive: boolean;
};

/** Approximate fallback rates (GBP) — used only when no API key / provider fails. */
const FALLBACK_BY_CURRENCY: Record<string, { goldPerGram: number; silverPerGram: number }> = {
  GBP: { goldPerGram: 87, silverPerGram: 0.95 },
  USD: { goldPerGram: 110, silverPerGram: 1.2 },
  EUR: { goldPerGram: 101, silverPerGram: 1.1 },
  AED: { goldPerGram: 405, silverPerGram: 4.4 },
  SAR: { goldPerGram: 413, silverPerGram: 4.5 },
};

type CacheEntry = { data: MetalPrices; expiresAt: number };

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function normalizeCurrency(code?: string): string {
  return (code || "GBP").toUpperCase().slice(0, 3);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fromTroyOz(pricePerOz: number): number {
  return round2(pricePerOz / TROY_OZ_GRAMS);
}

function toTroyOz(pricePerGram: number): number {
  return round2(pricePerGram * TROY_OZ_GRAMS);
}

function fallbackPrices(currency: string): MetalPrices {
  const base = FALLBACK_BY_CURRENCY[currency] ?? FALLBACK_BY_CURRENCY.GBP;
  return {
    currency,
    goldPricePerGram: base.goldPerGram,
    silverPricePerGram: base.silverPerGram,
    goldPricePerTroyOz: toTroyOz(base.goldPerGram),
    silverPricePerTroyOz: toTroyOz(base.silverPerGram),
    source: "fallback",
    updatedAt: new Date().toISOString(),
    isLive: false,
  };
}

function buildResult(
  currency: string,
  goldPerGram: number,
  silverPerGram: number,
  source: MetalPriceSource
): MetalPrices {
  return {
    currency,
    goldPricePerGram: round2(goldPerGram),
    silverPricePerGram: round2(silverPerGram),
    goldPricePerTroyOz: toTroyOz(goldPerGram),
    silverPricePerTroyOz: toTroyOz(silverPerGram),
    source,
    updatedAt: new Date().toISOString(),
    isLive: source !== "fallback",
  };
}

async function fetchFromGoldApi(currency: string): Promise<MetalPrices | null> {
  const key = process.env.GOLD_API_KEY?.trim();
  if (!key) return null;

  const headers = { "x-access-token": key, Accept: "application/json" };

  const [goldRes, silverRes] = await Promise.all([
    fetch(`https://www.goldapi.io/api/XAU/${currency}`, { headers }),
    fetch(`https://www.goldapi.io/api/XAG/${currency}`, { headers }),
  ]);

  if (!goldRes.ok || !silverRes.ok) return null;

  const gold = (await goldRes.json()) as {
    price?: number;
    price_gram_24k?: number;
  };
  const silver = (await silverRes.json()) as {
    price?: number;
    price_gram_24k?: number;
  };

  const goldPerGram =
    Number(gold.price_gram_24k) ||
    (Number(gold.price) > 0 ? fromTroyOz(Number(gold.price)) : 0);
  const silverPerGram =
    Number(silver.price_gram_24k) ||
    (Number(silver.price) > 0 ? fromTroyOz(Number(silver.price)) : 0);

  if (!goldPerGram || !silverPerGram) return null;
  return buildResult(currency, goldPerGram, silverPerGram, "goldapi");
}

async function fetchFromMetalsApi(currency: string): Promise<MetalPrices | null> {
  const key = process.env.METALS_API_KEY?.trim();
  if (!key) return null;

  const url = new URL("https://metals-api.com/api/latest");
  url.searchParams.set("access_key", key);
  url.searchParams.set("base", currency);
  url.searchParams.set("symbols", "XAU,XAG");

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as {
    success?: boolean;
    rates?: { XAU?: number; XAG?: number };
  };
  if (!data.success || !data.rates?.XAU || !data.rates?.XAG) return null;

  const goldPerOz = 1 / Number(data.rates.XAU);
  const silverPerOz = 1 / Number(data.rates.XAG);
  if (!Number.isFinite(goldPerOz) || !Number.isFinite(silverPerOz)) return null;

  return buildResult(currency, fromTroyOz(goldPerOz), fromTroyOz(silverPerOz), "metals-api");
}

async function fetchFromMetalpriceApi(currency: string): Promise<MetalPrices | null> {
  const key = process.env.METALPRICE_API_KEY?.trim();
  if (!key) return null;

  const url = new URL("https://api.metalpriceapi.com/v1/latest");
  url.searchParams.set("api_key", key);
  url.searchParams.set("base", currency);
  url.searchParams.set("currencies", "XAU,XAG");

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as {
    success?: boolean;
    rates?: { XAU?: number; XAG?: number };
  };
  if (!data.success || !data.rates?.XAU || !data.rates?.XAG) return null;

  const goldPerOz = 1 / Number(data.rates.XAU);
  const silverPerOz = 1 / Number(data.rates.XAG);
  if (!Number.isFinite(goldPerOz) || !Number.isFinite(silverPerOz)) return null;

  return buildResult(currency, fromTroyOz(goldPerOz), fromTroyOz(silverPerOz), "metalpriceapi");
}

export async function getMetalPrices(currencyInput?: string): Promise<MetalPrices> {
  const currency = normalizeCurrency(currencyInput);
  const cached = cache.get(currency);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const providers = [fetchFromGoldApi, fetchFromMetalsApi, fetchFromMetalpriceApi];
  for (const provider of providers) {
    try {
      const live = await provider(currency);
      if (live) {
        cache.set(currency, { data: live, expiresAt: Date.now() + CACHE_TTL_MS });
        return live;
      }
    } catch (err) {
      console.warn("Metal price provider failed:", err);
    }
  }

  const fallback = fallbackPrices(currency);
  cache.set(currency, { data: fallback, expiresAt: Date.now() + 5 * 60 * 1000 });
  return fallback;
}
